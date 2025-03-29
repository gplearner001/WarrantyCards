import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType, BarcodeScanningResult, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useWarrantyStore } from '../../store/warrantyStore';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  QrCode,
  X,
  Check,
  ArrowLeft,
  Calendar,
  Building2,
  ShoppingBag,
  Clock,
  Info,
} from 'lucide-react-native';
import { performOcr, ExtractedWarrantyData } from '../../utils/ocrUtils';

export default function ScanScreen() {
  const router = useRouter();
  const { addWarranty } = useWarrantyStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState('back');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<'receipt' | 'product' | 'qr'>('receipt');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  
  // Form data
  const [productName, setProductName] = useState('');
  const [company, setCompany] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [scanned, setScanned] = useState(false);
  
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        
        const manipResult = await ImageManipulator.manipulateAsync(
          (photo?.uri || ""),
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        if (scanMode === 'receipt') {
          setCapturedImage(manipResult.uri);
          setIsCameraActive(false);
          processReceiptImage(manipResult.uri);
        } else if (scanMode === 'product') {
          setProductImage(manipResult.uri);
          setIsCameraActive(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const pickImage = async (for_: 'receipt' | 'product') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1000 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        if (for_ === 'receipt') {
          setCapturedImage(manipResult.uri);
          processReceiptImage(manipResult.uri);
        } else {
          setProductImage(manipResult.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleBarCodeScanned = (scanResult: BarcodeScanningResult) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    setIsCameraActive(false);
    
    try {
      const qrData = scanResult.data;
      console.log("qr code data: ", qrData);
      Alert.alert('Success', 'QR code scanned successfully!');
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert('Error', 'Invalid QR code format. Please try again.');
    }
  };

  const processReceiptImage = async (imageUri: string) => {
    setIsProcessing(false);

    //For future Development
    /*
    try {
      const extractedData = await performOcr(imageUri);
      console.log("OCR extracted data:", extractedData);
      
      if (extractedData.productName) setProductName(extractedData.productName);
      if (extractedData.company) setCompany(extractedData.company);
      if (extractedData.purchaseDate) setPurchaseDate(extractedData.purchaseDate);
      if (extractedData.expiryDate) setExpiryDate(extractedData.expiryDate);
      
      if (extractedData.productName || extractedData.company) {
        Alert.alert('Success', 'Receipt information extracted successfully!');
      } else {
        Alert.alert('Info', 'Limited information extracted. Please fill in missing details manually.');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('OCR Error', 'Failed to extract text from the image. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }*/
  };

  const saveWarranty = async () => {
    if (!productName || !company || !purchaseDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields: Product Name, Company, and Purchase Date.');
      return;
    }
    
    try {
      const newWarranty = {
        id: Date.now().toString(),
        productName,
        company,
        purchaseDate,
        expiryDate: expiryDate || undefined,
        additionalInfo: additionalInfo || undefined,
        receiptImage: capturedImage,
        productImage,
        createdAt: new Date().toISOString(),
      };
      
      await addWarranty(newWarranty);
      Alert.alert('Success', 'Warranty saved successfully!', [
        { text: 'OK', onPress: () => router.push('/warranties') }
      ]);
    } catch (error) {
      console.error('Error saving warranty:', error);
      Alert.alert('Error', 'Failed to save warranty. Please try again.');
    }
  };

  const resetForm = () => {
    setCapturedImage(null);
    setProductImage(null);
    setProductName('');
    setCompany('');
    setPurchaseDate('');
    setExpiryDate('');
    setAdditionalInfo('');
  };

  const startCamera = (mode: 'receipt' | 'product' | 'qr') => {
    setScanMode(mode);
    setIsCameraActive(true);
    if (mode === 'qr') {
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361ee" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera permissions in your device settings to use this feature.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          autofocus='on'
          barcodeScannerSettings={{
            barcodeTypes: ['qr','code128', 'code39','ean13','ean8'],
          }}
          onBarcodeScanned={(result) => {
            console.log("scanner result:", result.data);
            handleBarCodeScanned(result);
            setIsScanning(true);
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraBackButton}
                onPress={() => setIsCameraActive(false)}
              >
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {scanMode === 'receipt' ? 'Scan Receipt' : 
                 scanMode === 'product' ? 'Capture Product' : 'Scan QR Code'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {isScanning && (
              <View style={styles.qrFrame}>
                <View style={[styles.qrCorner, styles.topLeft]} />
                <View style={[styles.qrCorner, styles.topRight]} />
                <View style={[styles.qrCorner, styles.bottomLeft]} />
                <View style={[styles.qrCorner, styles.bottomRight]} />
              </View>
            )}

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isScanning}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Warranty</Text>
          </View>

          {isProcessing ? (
            <Animated.View 
              entering={FadeIn} 
              exiting={FadeOut}
              style={styles.processingContainer}
            >
              <ActivityIndicator size="large" color="#4361ee" />
              <Text style={styles.processingText}>Processing image...</Text>
              <Text style={styles.processingSubtext}>Extracting warranty information using OCR</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInUp.duration(800).delay(200)}>
                <View style={styles.captureSection}>
                  <Text style={styles.sectionTitle}>Receipt Image</Text>
                  <View style={styles.captureOptions}>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('receipt')}
                    >
                      <CameraIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => pickImage('receipt')}
                    >
                      <ImageIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('qr')}
                    >
                      <QrCode size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>QR Code</Text>
                    </TouchableOpacity>
                  </View>

                  {capturedImage && (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setCapturedImage(null)}
                      >
                        <X size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(800).delay(300)}>
                <View style={styles.captureSection}>
                  <Text style={styles.sectionTitle}>Product Image (Optional)</Text>
                  <View style={styles.captureOptions}>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('product')}
                    >
                      <CameraIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => pickImage('product')}
                    >
                      <ImageIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>

                  {productImage && (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: productImage }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setProductImage(null)}
                      >
                        <X size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(800).delay(400)}>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Warranty Details</Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <ShoppingBag size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !productName && styles.inputPlaceholder]}
                      placeholder="Product Name *"
                      placeholderTextColor="#adb5bd"
                      value={productName}
                      onChangeText={setProductName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Building2 size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !company && styles.inputPlaceholder]}
                      placeholder="Company/Brand *"
                      placeholderTextColor="#adb5bd"
                      value={company}
                      onChangeText={setCompany}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Calendar size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !purchaseDate && styles.inputPlaceholder]}
                      placeholder="Purchase Date (YYYY-MM-DD) *"
                      placeholderTextColor="#adb5bd"
                      value={purchaseDate}
                      onChangeText={setPurchaseDate}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Clock size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !expiryDate && styles.inputPlaceholder]}
                      placeholder="Expiry Date (YYYY-MM-DD)"
                      placeholderTextColor="#adb5bd"
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Info size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, styles.textArea, !additionalInfo && styles.inputPlaceholder]}
                      placeholder="Additional Information"
                      placeholderTextColor="#adb5bd"
                      value={additionalInfo}
                      onChangeText={setAdditionalInfo}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(800).delay(500)} style={styles.buttonContainer}>
                <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
                  <X size={20} color="#dc3545" />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveWarranty}>
                  <Check size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save Warranty</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#4361ee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    alignSelf: 'center',
    position: 'relative',
  },
  qrCorner: {
    width: 20,
    height: 20,
    borderColor: '#4361ee',
    borderWidth: 4,
    position: 'absolute',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  captureSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  captureOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  captureOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
    width: '30%',
  },
  captureOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#495057',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
  },
  inputPlaceholder: {
    color: '#adb5bd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 40,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f1',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  resetButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4361ee',
    borderRadius: 8,
    padding: 16,
    flex: 2,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
});