import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWarrantyStore } from '../../store/warrantyStore';
import { useGroceryStore } from '../../store/groceryStore';
import { formatDistanceToNow, formatDate } from '../../utils/dateUtils';
import { Clock, Filter, Search, Dessert as SortDesc, ShoppingCart } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WarrantiesScreen() {
  const router = useRouter();
  const { warranties, fetchWarranties, isLoading } = useWarrantyStore();
  const { addToGroceryList } = useGroceryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'expiry'>('date');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToGrocery, setAddingToGrocery] = useState<string | null>(null);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchWarranties();
    setRefreshing(false);
  }, [fetchWarranties]);

  const handleAddToGroceries = async (warrantyId: string) => {
    try {
      setAddingToGrocery(warrantyId);
      await addToGroceryList(warrantyId);
      Alert.alert(
        'Success',
        'Item added to grocery list',
        [
          {
            text: 'View List',
            onPress: () => router.push('/groceries'),
            style: 'default',
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to grocery list');
    } finally {
      setAddingToGrocery(null);
    }
  };

  // Filter warranties based on search query and expiring filter
  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = 
      warranty.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warranty.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterExpiring) {
      if (!warranty.expiryDate) return false;
      const expiryDate = new Date(warranty.expiryDate);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return matchesSearch && diffDays > 0 && diffDays <= 30;
    }
    
    return matchesSearch;
  });

  // Sort warranties
  const sortedWarranties = [...filteredWarranties].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'name') {
      return a.productName.localeCompare(b.productName);
    } else if (sortBy === 'expiry') {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    return 0;
  });

  const getWarrantyStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { type: 'expired', text: 'Expired' };
    } else if (diffDays <= 30) {
      return { type: 'expiring', text: `Expires in ${formatDistanceToNow(expiry)}` };
    } else {
      return { type: 'valid', text: `Expires: ${formatDate(expiry)}` };
    }
  };

  const renderWarrantyItem = ({ item }: { item: any }) => {
    const warrantyStatus = getWarrantyStatus(item.expiryDate);

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <TouchableOpacity
          style={styles.warrantyCard}
          onPress={() => router.push({
            pathname: '/warranty-details',
            params: { id: item.id }
          })}
        >
          <Image
            source={{ uri: item.productImage || item.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070' }}
            style={styles.warrantyImage}
          />
          <View style={styles.warrantyContent}>
            <Text style={styles.warrantyTitle} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text style={styles.warrantyCompany} numberOfLines={1}>
              {item.company}
            </Text>
            {warrantyStatus && (
              <View style={styles.expiryContainer}>
                <Clock 
                  size={14} 
                  color={warrantyStatus.type === 'expired' ? "#dc3545" : 
                         warrantyStatus.type === 'expiring' ? "#ffc107" : 
                         "#6c757d"} 
                />
                <Text
                  style={[
                    styles.warrantyExpiry,
                    warrantyStatus.type === 'expired' && styles.expiredText,
                    warrantyStatus.type === 'expiring' && styles.expiringText,
                  ]}
                >
                  {warrantyStatus.text}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.addToGroceryButton,
                addingToGrocery === item.id && styles.addingToGroceryButton
              ]}
              onPress={() => handleAddToGroceries(item.id)}
              disabled={addingToGrocery === item.id}
            >
              {addingToGrocery === item.id ? (
                <ActivityIndicator size="small" color="#4361ee" />
              ) : (
                <>
                  <ShoppingCart size={16} color="#4361ee" />
                  <Text style={styles.addToGroceryText}>Add to Groceries</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Warranties</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6c757d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search warranties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'date' && styles.activeFilterButton]}
          onPress={() => setSortBy('date')}
        >
          <SortDesc size={16} color={sortBy === 'date' ? "#4361ee" : "#6c757d"} />
          <Text
            style={[
              styles.filterButtonText,
              sortBy === 'date' && styles.activeFilterText,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'name' && styles.activeFilterButton]}
          onPress={() => setSortBy('name')}
        >
          <SortDesc size={16} color={sortBy === 'name' ? "#4361ee" : "#6c757d"} />
          <Text
            style={[
              styles.filterButtonText,
              sortBy === 'name' && styles.activeFilterText,
            ]}
          >
            Name
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'expiry' && styles.activeFilterButton]}
          onPress={() => setSortBy('expiry')}
        >
          <SortDesc size={16} color={sortBy === 'expiry' ? "#4361ee" : "#6c757d"} />
          <Text
            style={[
              styles.filterButtonText,
              sortBy === 'expiry' && styles.activeFilterText,
            ]}
          >
            Expiry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filterExpiring && styles.activeFilterButton]}
          onPress={() => setFilterExpiring(!filterExpiring)}
        >
          <Filter size={16} color={filterExpiring ? "#4361ee" : "#6c757d"} />
          <Text
            style={[
              styles.filterButtonText,
              filterExpiring && styles.activeFilterText,
            ]}
          >
            Expiring
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedWarranties}
        renderItem={renderWarrantyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No warranties match your search"
                : filterExpiring
                ? "No warranties expiring soon"
                : "No warranties added yet"}
            </Text>
            {!searchQuery && !filterExpiring && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/scan')}
              >
                <Text style={styles.addButtonText}>Add Warranty</Text>
              </TouchableOpacity>
            )}
          </View>
        }
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: '#e9efff',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  activeFilterText: {
    color: '#4361ee',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  warrantyCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  warrantyImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  warrantyContent: {
    flex: 1,
    padding: 16,
  },
  warrantyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  warrantyCompany: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warrantyExpiry: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  expiringText: {
    color: '#ffc107',
    fontWeight: '500',
  },
  expiredText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  addToGroceryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9efff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  addingToGroceryButton: {
    opacity: 0.7,
  },
  addToGroceryText: {
    color: '#4361ee',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4361ee',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});