import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroceryStore } from '../../store/groceryStore';
import { formatDate } from '../../utils/dateUtils';
import { ShoppingCart, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function GroceriesScreen() {
  const router = useRouter();
  const { groceries, fetchGroceries, removeFromGroceryList, isLoading } = useGroceryStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchGroceries();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchGroceries();
    setRefreshing(false);
  }, [fetchGroceries]);

  const handleDelete = (groceryId: string) => {
    Alert.alert(
      'Remove from Grocery List',
      'Are you sure you want to remove this item from your grocery list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromGroceryList(groceryId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item from grocery list');
            }
          },
        },
      ]
    );
  };

  const renderGroceryItem = ({ item }: { item: any }) => {
    if (!item.product_name) return null;

    return (
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <TouchableOpacity
          style={styles.groceryCard}
          onPress={() => router.push({
            pathname: '/warranty-details',
            params: { id: item.warranty_id }
          })}
        >
          <Image
            source={{ uri: item.product_image_url || item.receipt_image_url || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070' }}
            style={styles.groceryImage}
          />
          <View style={styles.groceryContent}>
            <Text style={styles.groceryTitle} numberOfLines={1}>
              {item.product_name}
            </Text>
            <Text style={styles.groceryCompany} numberOfLines={1}>
              {item.company_name}
            </Text>
            {item.notes && (
              <Text style={styles.groceryNotes} numberOfLines={2}>
                {item.notes}
              </Text>
            )}
            <View style={styles.groceryFooter}>
              <Text style={styles.groceryQuantity}>
                Quantity: {item.quantity}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 size={16} color="#dc3545" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
      </View>

      <FlatList
        data={groceries}
        renderItem={renderGroceryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color="#6c757d" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No items in your grocery list</Text>
            <Text style={styles.emptySubtext}>
              Add items from your warranties to create your shopping list
            </Text>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  groceryCard: {
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
  groceryImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  groceryContent: {
    flex: 1,
    padding: 16,
  },
  groceryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  groceryCompany: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  groceryNotes: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  groceryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groceryQuantity: {
    fontSize: 12,
    color: '#4361ee',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});