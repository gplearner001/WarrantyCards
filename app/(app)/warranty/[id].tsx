import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWarrantyStore } from '../../../store/warrantyStore';
import { formatDate } from '../../../utils/dateUtils';
import { ArrowLeft, Calendar, Clock, Download, Info, Share2, ShoppingBag, Store, Trash2 } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function WarrantyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { warranties, deleteWarranty } = useWarrantyStore();
  const [warranty, setWarranty] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const foundWarranty = warranties.find(w => w.id === id);
      setWarranty(foundWarranty);
    }
  }, [id, warranties]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Warranty',
      'Are you sure you want to delete this warranty? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWarranty(id as string);
              router.replace('/warranties');
            } catch (error) {
              console.error('Error deleting warranty:', error);
              Alert.alert('Error', 'Failed to delete warranty. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!warranty) return;

    try {
      const expiryInfo = warranty.expiryDate
        ? `Expires: ${formatDate(new Date(warranty.expiryDate))}`
        : 'No expiry date';

      await Share.share({
        title: `Warranty for ${warranty.productName}`,
        message: `Product: ${warranty.productName}\nCompany: ${warranty.company}\nPurchased: ${formatDate(
          new Date(warranty.purchaseDate)
        )}\n${expiryInfo}`,
      });
    } catch (error) {
      console.error('Error sharing warranty:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!warranty?.receiptImage) return;

    if (Platform.OS === 'web') {
      // For web, open the image in a new tab
      window.open(warranty.receiptImage, '_blank');
    } else {
      // For mobile, open the image URL
      try {
        await Linking.openURL(warranty.receiptImage);
      } catch (error) {
        console.error('Error opening receipt image:', error);
        Alert.alert('Error', 'Failed to open receipt image.');
      }
    }
  };

  if (!warranty) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#212529" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warranty Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Warranty not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpiringSoon = warranty.expiryDate && (() => {
    const expiryDate = new Date(warranty.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warranty Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={24} color="#212529" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(800)}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: warranty.productImage || warranty.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070',
              }}
              style={styles.productImage}
            />
            {isExpiringSoon && (
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryBadgeText}>Expiring Soon</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.contentContainer}>
          <Text style={styles.productName}>{warranty.productName}</Text>
          <Text style={styles.companyName}>{warranty.company}</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Calendar size={20} color="#4361ee" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Purchase Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(new Date(warranty.purchaseDate))}
                </Text>
              </View>
            </View>

            {warranty.expiryDate && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Clock size={20} color={isExpiringSoon ? "#dc3545" : "#4361ee"} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Expiry Date</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      isExpiringSoon && styles.expiringText,
                    ]}
                  >
                    {formatDate(new Date(warranty.expiryDate))}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <ShoppingBag size={20} color="#4361ee" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValue}>{warranty.productName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Store size={20} color="#4361ee" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Company/Brand</Text>
                <Text style={styles.detailValue}>{warranty.company}</Text>
              </View>
            </View>

            {warranty.additionalInfo && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Info size={20} color="#4361ee" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Additional Information</Text>
                  <Text style={styles.detailValue}>{warranty.additionalInfo}</Text>
                </View>
              </View>
            )}
          </View>

          {warranty.receiptImage && (
            <View style={styles.receiptContainer}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>Receipt Image</Text>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownloadReceipt}
                >
                  <Download size={20} color="#4361ee" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: warranty.receiptImage }}
                style={styles.receiptImage}
              />
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#dc3545" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  expiryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expiryBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  expiringText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  receiptContainer: {
    marginBottom: 24,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9efff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#4361ee',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#fff1f1',
  },
  deleteButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});