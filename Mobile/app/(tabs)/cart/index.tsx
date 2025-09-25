import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 🔄 CHANGED: Use Expo Router instead of React Navigation
import { useRouter } from "expo-router";

// 👇 Use your computer's IP address
const API_BASE_URL = "http://192.168.10.163:3000";

// TypeScript interface for cart item structure
interface CartItem {
  cart_item_id: number;
  art_piece_id: number;
  title: string;
  quantity: number;
  price: number;
}

export default function CartPage() {
  // State management - these store our component's data
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Array of cart items
  const [cartId, setCartId] = useState<number | null>(null); // ID of the current cart
  const [totalAmount, setTotalAmount] = useState<number>(0); // Total price of all items
  const [loading, setLoading] = useState<boolean>(true); // Loading state for better UX
  
  // 🔄 CHANGED: Use Expo Router hook instead of React Navigation
  const router = useRouter();

  // Function to get cart data from the server
  const fetchCart = async (): Promise<void> => {
    try {
      setLoading(true);
      
      console.log("🔍 Starting cart fetch...");
      console.log("📍 API URL:", `${API_BASE_URL}/api/cart/view`);
      
      // Get authentication token from device storage
      const token = await AsyncStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);
      
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      // Make API call to get cart data
      const response = await fetch(`${API_BASE_URL}/api/cart/view`, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("📡 Response received:");
      console.log("   Status:", response.status);
      console.log("   OK:", response.ok);
      
      const data = await response.json();
      console.log("📦 Response data:", data);
      
      if (response.ok) {
        // Success - update our state with cart data
        setCartItems(data.items || []);
        setCartId(data.cart_id);
        calculateTotal(data.items || []);
        console.log("✅ Cart loaded successfully");
      } else {
        // Show error message to user
        console.log("❌ API Error:", data.error);
        Alert.alert("Error", data.error || "Failed to fetch cart");
      }
    } catch (error: any) {
      console.error("🚨 Network Error Details:");
      console.error("   Message:", error.message);
      console.error("   Name:", error.name);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          "Connection Failed", 
          `Cannot connect to server at ${API_BASE_URL}\n\n` +
          "Please check:\n" +
          "• Server is running on port 3000\n" +
          "• Same WiFi network\n" +
          "• Firewall allows connection\n" +
          "• Try restarting the server"
        );
      } else {
        Alert.alert("Error", `Network error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate total price of all items in cart
  const calculateTotal = (items: CartItem[]): void => {
    const sum = items.reduce((accumulator, item) => {
      return accumulator + (item.price * item.quantity);
    }, 0);
    setTotalAmount(sum);
  };

  // Function to remove an item from the cart
  const handleRemove = async (artPieceId: number): Promise<void> => {
    // Show confirmation dialog
    Alert.alert(
      "Remove Item",
      "Remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              
              const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ art_piece_id: artPieceId })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                const updatedCart = cartItems.filter(
                  item => item.art_piece_id !== artPieceId
                );
                setCartItems(updatedCart);
                calculateTotal(updatedCart);
                Alert.alert("Success", data.message);
              } else {
                Alert.alert("Error", data.error || "Failed to remove item");
              }
            } catch (error) {
              console.error("Error removing item:", error);
              Alert.alert("Error", "Failed to remove item");
            }
          }
        }
      ]
    );
  };

  // Function to navigate to orders page
  const handleOrders = useCallback(() => {
    router.push('/orders');
  }, [router]);

  // 🔄 CHANGED: Updated checkout function to use Expo Router
  const handleCheckout = (): void => {
    // Check if cart is empty
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty! Add items before proceeding to checkout.");
      return;
    }

    console.log("🛒 Proceeding to checkout:");
    console.log("   Cart ID:", cartId);
    console.log("   Total Amount:", totalAmount);
    console.log("   Items:", cartItems.length);

    try {
      router.push({
        pathname: "/payment",
        params: {
          cartId: cartId?.toString() || "",
          totalAmount: totalAmount.toString()
        }
      });
      console.log("✅ Navigation to payment initiated");
    } catch (error) {
      console.error("❌ Navigation error:", error);
      Alert.alert("Navigation Error", "Failed to navigate to payment page");
    }
  };

  // useEffect runs when component mounts (loads for first time)
  useEffect(() => {
    fetchCart();
  }, []);

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5e3c" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  // Main component render
  return (
    <View style={styles.container}>
      
      {/* Header with Orders button */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Your Cart</Text>
        <TouchableOpacity
          style={styles.ordersHeaderButton}
          onPress={handleOrders}
        >
          <Text style={styles.ordersHeaderButtonText}>View Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Show message if cart is empty */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            // 🔄 CHANGED: Use Expo Router for navigation
            onPress={() => router.push("/home")}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart items list */}
          <ScrollView style={styles.itemsList}>
            {cartItems.map((item) => (
              <View key={item.cart_item_id} style={styles.cartItem}>
                {/* Item details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemInfo}>Quantity: {item.quantity}</Text>
                  <Text style={styles.itemInfo}>Price: R{item.price.toFixed(2)}</Text>
                  <Text style={styles.itemTotal}>
                    Total: R{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>

                {/* Remove button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(item.art_piece_id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          {/* Total and checkout section */}
          <View style={styles.checkoutSection}>
            <Text style={styles.totalAmount}>
              Total Amount: R{totalAmount.toFixed(2)}
            </Text>
            
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f2eb",
    padding: 16,
  },

  ordersButton: {
    backgroundColor: "#6b4e3d", 
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: "#8b5e3c",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  itemsList: {
    flex: 1,
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  
  
  ordersHeaderButton: {
    backgroundColor: "#8b5e3c",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  
  ordersHeaderButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  cartItem: {
    backgroundColor: "#fffaf3",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8b5e3c",
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  checkoutSection: {
    backgroundColor: "#fffaf3",
    padding: 20,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  
  debugButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});