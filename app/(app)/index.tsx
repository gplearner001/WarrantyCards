import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWarrantyStore } from '../../store/warrantyStore';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, Search, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { warranties, fetchWarranties, isLoading } = useWarrantyStore();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchWarranties();
    setRefreshing(false);
  }, [fetchWarranties]);

  // Get expiring warranties (within 30 days)
  const expiringWarranties = warranties.filter(warranty => {
    if (!warranty.expiryDate) return false;
    const expiryDate = new Date(warranty.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  // Get recently added warranties (last 7 days)
  const recentWarranties = warranties
    .filter(warranty => {
      const createdDate = new Date(warranty.createdAt);
      const today = new Date();
      const diffTime = today.getTime() - createdDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color="#4361ee" />
          </TouchableOpacity>
        </View>

        <Animated.View
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.statsContainer}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#e9f5ff' }]}>
              <ShieldCheck size={24} color="#4361ee" />
            </View>
            <Text style={styles.statValue}>{warranties.length}</Text>
            <Text style={styles.statLabel}>Total Warranties</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fff4e5' }]}>
              <Bell size={24} color="#ff9800" />
            </View>
            <Text style={styles.statValue}>{expiringWarranties.length}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.duration(800).delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expiring Soon</Text>
            <TouchableOpacity onPress={() => router.push('/warranties')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.expiringCardsContainer}
          >
            {expiringWarranties.length > 0 ? (
              expiringWarranties.map((warranty, index) => (
                <TouchableOpacity
                  key={warranty.id}
                  style={styles.expiringCard}
                  onPress={() => router.push(`/warranty/${warranty.id}`)}
                >
                  <Image
                    source={{ uri: warranty.productImage || warranty.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070' }}
                    style={styles.expiringCardImage}
                  />
                  <View style={styles.expiringCardContent}>
                    <Text style={styles.expiringCardTitle} numberOfLines={1}>
                      {warranty.productName}
                    </Text>
                    <Text style={styles.expiringCardCompany} numberOfLines={1}>
                      {warranty.company}
                    </Text>
                    <View style={styles.expiringCardFooter}>
                      <Clock size={14} color="#dc3545" />
                      <Text style={styles.expiringCardDate}>
                        Expires in {formatDistanceToNow(new Date(warranty.expiryDate))}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No warranties expiring soon</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInRight.duration(800).delay(600)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <TouchableOpacity onPress={() => router.push('/warranties')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentWarranties.length > 0 ? (
            recentWarranties.map((warranty, index) => (
              <TouchableOpacity
                key={warranty.id}
                style={styles.recentCard}
                onPress={() => router.push(`/warranty/${warranty.id}`)}
              >
                <Image
                  source={{ uri: warranty.productImage || warranty.receiptImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070' }}
                  style={styles.recentCardImage}
                />
                <View style={styles.recentCardContent}>
                  <Text style={styles.recentCardTitle} numberOfLines={1}>
                    {warranty.productName}
                  </Text>
                  <Text style={styles.recentCardCompany} numberOfLines={1}>
                    {warranty.company}
                  </Text>
                  <View style={styles.recentCardFooter}>
                    <Text style={styles.recentCardDate}>
                      Added {formatDistanceToNow(new Date(warranty.createdAt))} ago
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No recently added warranties</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#6c757d',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f3f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4361ee',
    fontWeight: '600',
  },
  expiringCardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  expiringCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  expiringCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  expiringCardContent: {
    padding: 12,
  },
  expiringCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  expiringCardCompany: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  expiringCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiringCardDate: {
    fontSize: 12,
    color: '#dc3545',
    marginLeft: 4,
    fontWeight: '500',
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  recentCardImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  recentCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  recentCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  recentCardCompany: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  recentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentCardDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});