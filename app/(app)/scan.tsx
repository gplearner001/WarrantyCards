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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useWarrantyStore } from '../../store/warrantyStore';
import { formatDate } from '../../utils/dateUtils';
import { Camera as CameraIcon, Image as ImageIcon, QrCode, X, Check, ArrowLeft, Building2, ShoppingBag, Clock, Info, Loader as Loader2, Calendar, Bell } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { performOcr } from '../../utils/ocrUtils';
import { useRatingStore } from '../../store/ratingStore';
import RatingModal from '../../components/RatingModal';
import { t } from '../../utils/i18n';

export default function ScanScreen() {
  const router = useRouter();
  const { addWarranty } = useWarrantyStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState('back');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<'receipt' | 'product' | 'qr' | 'expiry'>('receipt');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const [isProcessingExpiryDate, setIsProcessingExpiryDate] = useState(false);
  const lastScannedBarcode = useRef<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [notificationDays, setNotificationDays] = useState<string>('');
  
  // Form data
  const [productName, setProductName] = useState('');
  const [company, setCompany] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [scanned, setScanned] = useState(false);
  const { hasRated } = useRatingStore();
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleExpiryDateScan = async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsProcessingExpiryDate(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      console.log("calling extract expiry api");
      const response = await fetch('https://expiry-ocrapi.vercel.app/api/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: photo?.base64,
        }),
      });

      const data = await response.json();
      console.log("expiry data:", data);
      if (data.success && data.dates && data.dates.length > 0) {
        // Get the latest date from the response
        const latestDate = data.dates[data.dates.length - 1];
        // Convert DDMMYYYY to Date object
        const day = latestDate.substring(0, 2);
        const month = latestDate.substring(2, 4);
        const year = latestDate.substring(4);
        const formattedDate = new Date(`${year}-${month}-${day}`);
        
        setExpiryDate(formattedDate);
        setIsCameraActive(false);
      } else {
        Alert.alert(
          'No Expiry Date Found',
          'Could not detect expiry date. Please enter the date manually.',
          [{ text: 'OK' }]
        );
        setIsCameraActive(false);
      }
    } catch (error) {
      console.error('Error scanning expiry date:', error);
      Alert.alert(
        'Error',
        'Failed to scan expiry date. Please enter the date manually.',
        [{ text: 'OK' }]
      );
      setIsCameraActive(false);
    } finally {
      setIsProcessingExpiryDate(false);
    }
  };

  const fetchProductInfo = async (barcode: string) => {
    try {
      setIsProcessingBarcode(true);
      const response = await fetch(`https://go-upc.com/search?q=${barcode}`);
      const html = await response.text();

      const productNameMatch = html.match(/<h1 class="product-name">(.*?)<\/h1>/);
      const productName = productNameMatch ? productNameMatch[1].trim() : '';

      const imageMatch = html.match(/<figure class="product-image[^>]*>\s*<img src="([^"]*)"[^>]*>/);
      let imageUrl = imageMatch ? imageMatch[1] : null;

      if (!imageUrl || !imageUrl.startsWith('http')) {
        imageUrl = 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070';
      }

      if (productName) {
        setProductName(productName);
      }
      if (imageUrl) {
        setProductImage(imageUrl);
      }

      setIsCameraActive(false);
      setIsScanning(false);

      if (!productName && !imageUrl) {
        Alert.alert('Product Not Found', 'Could not find product information for this barcode.');
      }
    } catch (error) {
      console.error('Error fetching product info:', error);
      Alert.alert('Error', 'Failed to fetch product information. Please try again.');
    } finally {
      setIsProcessingBarcode(false);
    }
  };

  const handleBarCodeScanned = async (scanResult: BarcodeScanningResult) => {
    const barcode = scanResult.data;
    
    if (lastScannedBarcode.current === barcode || !isScanning) {
      return;
    }
    
    lastScannedBarcode.current = barcode;
    setScanned(true);
    
    if (/^\d+$/.test(barcode)) {
      await fetchProductInfo(barcode);
    } else {
      setIsScanning(false);
      setIsCameraActive(false);
      Alert.alert('Invalid Barcode', 'Please scan a valid product barcode.');
    }
  };

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
          setValidationError(null);
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
          setValidationError(null);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processReceiptImage = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      const extractedData = await performOcr(imageUri);
      console.log("OCR extracted data:", extractedData);
      
      if (extractedData.productName) setProductName(extractedData.productName);
      if (extractedData.company) setCompany(extractedData.company);
      if (extractedData.expiryDate) setExpiryDate(new Date(extractedData.expiryDate));
      
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
    }
  };

  const validateForm = (): boolean => {
    if (!productImage) {
      setValidationError('Product image is required. Please add a product image or scan barcode on product.');
      return false;
    }
    if (!productName || !company) {
      setValidationError('Please fill in all required fields: Product Name and Company.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const resetForm = () => {
    setProductName('');
    setCompany('');
    setExpiryDate(null);
    setAdditionalInfo('');
    setNotificationDays('');
    setCapturedImage(null);
    setProductImage(null);
    setScanned(false);
    lastScannedBarcode.current = null;
  };

  const saveWarranty = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      const newWarranty = {
        id: Date.now().toString(),
        productName,
        company,
        expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
        additionalInfo: additionalInfo || undefined,
        receiptImage: capturedImage || undefined,
        productImage,
        createdAt: new Date().toISOString(),
        notificationDays: parseInt(notificationDays, 10),
      };
      
      const shouldShowRating = await addWarranty(newWarranty);
      
      // Reset form after successful save
      resetForm();
      setCapturedImage(null);
      setProductImage(null);
      setScanned(false);
      lastScannedBarcode.current = null;
     
      if (shouldShowRating) {
        setShowRatingModal(true);
      } else {
        router.push('/warranties');
      }
    } catch (error) {
      console.error('Error saving warranty:', error);
      Alert.alert('Error', 'Failed to save warranty. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startCamera = (mode: 'receipt' | 'product' | 'qr' | 'expiry') => {
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
          <Text style={styles.loadingText}>{t('requestingCameraPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>{t('noCameraAccess')}</Text>
          <Text style={styles.permissionSubtext}>
            {t('enableCameraPermissions')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>{t('goBack')}</Text>
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
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraBackButton}
                onPress={() => {
                  setIsCameraActive(false);
                  setScanned(false);
                  lastScannedBarcode.current = null;
                }}
              >
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {scanMode === 'receipt' ? t('scanReceipt') : 
                 scanMode === 'product' ? t('captureProduct') : 
                 scanMode === 'expiry' ? t('scanExpiryDate') :
                 t('scanBarcode')}
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

            {(isProcessingBarcode || isProcessingExpiryDate) && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.processingText}>
                  {isProcessingBarcode ? t('fetchingProductInfo') : t('processingExpiryDate')}
                </Text>
              </View>
            )}

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={scanMode === 'expiry' ? handleExpiryDateScan : takePicture}
                disabled={isProcessingBarcode || isProcessingExpiryDate}
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
            <Text style={styles.title}>{t('addWarranty')}</Text>
          </View>

          {isProcessing ? (
            <Animated.View 
              entering={FadeIn}
              style={styles.processingContainer}
            >
              <ActivityIndicator size="large" color="#4361ee" />
              <Text style={styles.processingText}>{t('processingImage')}</Text>
              <Text style={styles.processingSubtext}>{t('extractingInfo')}</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(800).delay(200)}>
                <View style={styles.captureSection}>
                  <Text style={styles.sectionTitle}>{t('receiptImage')} ({t('optional')})</Text>
                  <View style={styles.captureOptions}>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('receipt')}
                    >
                      <CameraIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>{t('camera')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => pickImage('receipt')}
                    >
                      <ImageIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>{t('gallery')}</Text>
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

              <Animated.View entering={FadeInDown.duration(800).delay(300)}>
                <View style={styles.captureSection}>
                  <Text style={styles.sectionTitle}>{t('productImage')} *</Text>
                  <View style={styles.captureOptions}>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('product')}
                    >
                      <CameraIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>{t('camera')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => pickImage('product')}
                    >
                      <ImageIcon size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>{t('gallery')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.captureOption}
                      onPress={() => startCamera('qr')}
                    >
                      <QrCode size={24} color="#4361ee" />
                      <Text style={styles.captureOptionText}>{t('scanBarcode')}</Text>
                    </TouchableOpacity>
                  </View>

                  {productImage && (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: productImage }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          setProductImage(null);
                          setValidationError(t('productImageRequired'));
                        }}
                      >
                        <X size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(800).delay(400)}>
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>{t('warrantyDetails')}</Text>

                  {validationError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{validationError}</Text>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <ShoppingBag size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !productName && styles.inputPlaceholder]}
                      placeholder={`${t('productName')} *`}
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
                      placeholder={`${t('company')} *`}
                      placeholderTextColor="#adb5bd"
                      value={company}
                      onChangeText={setCompany}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Calendar size={20} color="#4361ee" />
                    </View>
                    <TouchableOpacity 
                      style={[styles.input, styles.datePickerButton, { flex: 1 }]}
                      onPress={showDatePickerModal}
                    >
                      <Text style={[
                        styles.datePickerText,
                        !expiryDate && { color: '#adb5bd' }
                      ]}>
                        {expiryDate ? formatDate(expiryDate) : t('selectExpiryDate')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.scanExpiryButton}
                      onPress={() => {
                        setScanMode('expiry');
                        setIsCameraActive(true);
                      }}
                    >
                      <CameraIcon size={20} color="#4361ee" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.helperText}>
                    {t('scanExpiryDateHelper')}
                  </Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Bell size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, !notificationDays && styles.inputPlaceholder]}
                      placeholder={t('notificationDays')}
                      placeholderTextColor="#adb5bd"
                      value={notificationDays}
                      onChangeText={(text) => {
                        const numValue = text.replace(/[^0-9]/g, '');
                        setNotificationDays(numValue);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.helperText}>
                    {t('notificationDaysHelper')}
                  </Text>

                  {showDatePicker && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={expiryDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        textColor="#212529"
                        style={styles.datePicker}
                      />
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          style={styles.datePickerDoneButton}
                          onPress={hideDatePicker}
                        >
                          <Text style={styles.datePickerDoneButtonText}>{t('done')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Info size={20} color="#4361ee" />
                    </View>
                    <TextInput
                      style={[styles.input, styles.textArea, !additionalInfo && styles.inputPlaceholder]}
                      placeholder={t('additionalInfo')}
                      placeholderTextColor="#adb5bd"
                      value={additionalInfo}
                      onChangeText={setAdditionalInfo}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(800).delay(500)} style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.resetButton} 
                  onPress={resetForm}
                  disabled={isSaving}
                >
                  <X size={20} color="#dc3545" />
                  <Text style={styles.resetButtonText}>{t('resetForm')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={saveWarranty}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  ) : (
                    <Check size={20} color="#ffffff" />
                  )}
                  <Text style={styles.saveButtonText}>
                    {isSaving ? t('savingWarranty') : t('saveWarranty')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <RatingModal
        isVisible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          router.push('/warranties');
        }}
      />
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
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
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
  datePickerButton: {
    justifyContent: 'center',
  },
  datePickerText: {
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
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  datePicker: {
    backgroundColor: '#ffffff',
  },
  datePickerDoneButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  datePickerDoneButtonText: {
    color: '#4361ee',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlayText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: -12,
    marginBottom: 16,
    marginHorizontal: 16,
    fontStyle: 'italic',
  },
  scanExpiryButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
});