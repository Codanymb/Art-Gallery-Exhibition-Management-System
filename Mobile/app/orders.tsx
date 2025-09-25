import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 👇 Use your computer's IP address (consistent with other components)
const API_BASE_URL = "http://192.168.10.163:3000";

// TypeScript interface for order structure
interface Order {
  order_id: number;
  order_type: string;
  total_amount: number;
  status: string;
  Date_created: string;
  delivery_address?: string;
}

// TypeScript interface for API response
interface OrdersResponse {
  "My order": Order[];
}

// 🔹 REQUIRED: Default export for Expo Router
export default function Orders() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const router = useRouter();

  // Function to fetch orders from the server
  const fetchOrders = async (isRefresh: boolean = false): Promise<void> => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log("📋 Fetching user orders...");
      
      // Get authentication token from device storage
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Authentication Error", "Please login to view your orders");
        router.push("/login");
        return;
      }

      // Make API call to get orders
      const response = await fetch(`${API_BASE_URL}/api/UserOrder/MyOrder`, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("📡 Orders response status:", response.status);
      
      const data: OrdersResponse = await response.json();
      console.log("📦 Orders data:", data);
      
      if (response.ok) {
        // Success - update state with orders
        const userOrders = data["My order"] || [];
        setOrders(userOrders);
        console.log(`✅ Loaded ${userOrders.length} orders`);
      } else {
        Alert.alert("Error", (data as any).error || "Failed to fetch orders");
      }
      
    } catch (error: any) {
      console.error("🚨 Error fetching orders:", error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          "Connection Error",
          "Unable to fetch orders. Please check your internet connection."
        );
      } else {
        Alert.alert("Error", "An error occurred while fetching orders");
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = (): void => {
    setRefreshing(true);
    fetchOrders(true);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString; // Return original if formatting fails
    }
  };

  // Get status color based on order status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#8b5e3c';
      case 'pending':
      case 'processing':
        return '#8b5e3c';
      case 'cancelled':
      case 'failed':
        return '#8b5e3c';
      default:
        return '#8b5e3c';
    }
  };

  // Get status background color
  const getStatusBackgroundColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#d4edda';
      case 'pending':
      case 'processing':
        return '#fff3cd';
      case 'cancelled':
      case 'failed':
        return '#f8d7da';
      default:
        return '#e9ecef';
    }
  };

  // useEffect runs when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5e3c" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  // Show empty state if no orders
  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No Orders Yet</Text>
        <Text style={styles.emptyText}>
          You haven't placed any orders yet. Start shopping to see your orders here!
        </Text>
        
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchOrders()}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main component render
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Orders</Text>
      
      <ScrollView 
        style={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.map((order) => (
          <View key={order.order_id} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #{order.order_id}</Text>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusBackgroundColor(order.status) }
                ]}
              >
                <Text 
                  style={[
                    styles.statusText, 
                    { color: getStatusColor(order.status) }
                  ]}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={styles.detailAmount}>R{order.total_amount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(order.Date_created)}</Text>
              </View>
              
              {order.delivery_address && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Address:</Text>
                  <Text style={styles.detailValue}>{order.delivery_address}</Text>
                </View>
              )}
              
              {order.order_type === 'pickup' && (
                <View style={styles.pickupNotice}>
                </View>
              )}
            </View>
            <View style={styles.orderActions}>
                     
              {order.status.toLowerCase() === 'completed' && (
                <TouchableOpacity 
                  style={styles.reorderButton}
                  onPress={() => {
                    // Future: Implement reorder functionality
                    Alert.alert("Reorder", "Reorder functionality coming soon!");
                  }}
                >
                  <Text style={styles.reorderButtonText}>Reorder</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Styles for the orders page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f2eb",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f2eb",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f2eb",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: "#8b5e3c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#8b5e3c",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#8b5e3c",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  ordersList: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: "#fffaf3",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  detailAmount: {
    fontSize: 16,
    color: "#8b5e3c",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  pickupNotice: {
    backgroundColor: "#e7f3ff",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  pickupText: {
    fontSize: 14,
    color: "#8b5e3c",
    textAlign: "center",
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: "#8b5e3c",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  reorderButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8b5e3c",
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
  },
  reorderButtonText: {
    color: "#8b5e3c",
    fontSize: 14,
    fontWeight: "600",
  },
});