import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Chrome as Home, CirclePlus as PlusCircle, Receipt, Settings, User, Bell, ShoppingCart } from 'lucide-react-native';
import Constants from 'expo-constants';

const isDevelopment = __DEV__;

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e9ecef',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: '#4361ee',
        tabBarInactiveTintColor: '#6c757d',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="warranties"
        options={{
          title: 'Warranties',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: 'Groceries',
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      {isDevelopment && (
        <Tabs.Screen
          name="notification-test"
          options={{
            title: 'Test',
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="warranty-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="warranty/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rating"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rating-success"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}