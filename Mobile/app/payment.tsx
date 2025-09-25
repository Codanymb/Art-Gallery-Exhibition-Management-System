import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// 👇 Use your computer's IP address (same as other components)
const API_BASE_URL = "http://192.168.10.163:3000";

// TypeScript interfaces for better type safety
interface CartItem {
  cart_item_id: number;
  art_piece_id: number;
  title: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  order_id: number;
  payer_name: string;
  payer_card_number: string;
  payer_expiry: string;
  payer_card_type: string;
  receiver_name: string;
  receiver_card_number: string;
  amount: number;
}

interface CheckoutResponse {
  order_id: number;
  total_amount: number;
  message: string;
}

interface PaymentResponse {
  payment_id: number;
  message: string;
}

// 🔹 REQUIRED: Default export for Expo Router
export default function PaymentPage() {
  // Get parameters from navigation (passed from Cart page)
  const params = useLocalSearchParams();
  const cartId = params.cartId as string;
  const totalAmount = parseFloat(params.totalAmount as string) || 0;
  
  const router = useRouter();

  // Form state - stores all the user input
  const [payerName, setPayerName] = useState<string>("");
  const [payerCardNumber, setPayerCardNumber] = useState<string>("");
  const [payerExpiry, setPayerExpiry] = useState<string>("");
  const [payerCardType, setPayerCardType] = useState<string>("visa");
  const [orderType, setOrderType] = useState<string>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  
  // Cart items state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState<boolean>(true);
  
  // Modal states for dropdowns
  const [showCardTypeModal, setShowCardTypeModal] = useState<boolean>(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState<boolean>(false);
  
  // Loading state for better user experience
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Receiver details (fixed values for the art gallery)
  const receiverName = "Art Gallery Ltd.";
  const receiverCardNumber = "1234567890123456";

  // Card type options
  const cardTypeOptions = [
    { label: "Visa", value: "visa" },
    { label: "Mastercard", value: "mastercard" },
    { label: "American Express", value: "amex" }
  ];

  // Order type options
  const orderTypeOptions = [
    { label: "Pickup from Gallery", value: "pickup" },
    { label: "Home Delivery", value: "delivery" }
  ];

  // Get display label for card type
  const getCardTypeLabel = (value: string) => {
    return cardTypeOptions.find(option => option.value === value)?.label || "Select";
  };

  // Get display label for order type
  const getOrderTypeLabel = (value: string) => {
    return orderTypeOptions.find(option => option.value === value)?.label || "Select";
  };

  // Function to fetch cart items
  const fetchCartItems = async (): Promise<void> => {
    try {
      setLoadingCart(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/view`, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCartItems(data.items || []);
      } else {
        console.log("Failed to fetch cart items:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setLoadingCart(false);
    }
  };

  // Check if required parameters are available and fetch cart items
  useEffect(() => {
    console.log("📋 Payment params received:");
    console.log("   Cart ID:", cartId);
    console.log("   Total Amount:", totalAmount);
    
    if (!cartId || !totalAmount) {
      Alert.alert(
        "Missing Information",
        "Payment information is incomplete. Returning to cart.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }

    // Fetch cart items to show in order summary
    fetchCartItems();
  }, [cartId, totalAmount]);

  // Function to format card number with spaces (for better UX)
  const formatCardNumber = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    return numbers.replace(/(.{4})/g, '$1 ').trim();
  };

  // Function to format expiry date (MM/YY format)
  const formatExpiry = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  // Validate form inputs before processing payment
  const validateForm = (): boolean => {
    if (!payerName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name.");
      return false;
    }
    
    if (!payerCardNumber.replace(/\s/g, '') || payerCardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert("Validation Error", "Please enter a valid 16-digit card number.");
      return false;
    }
    
    if (!payerExpiry || payerExpiry.length !== 5) {
      Alert.alert("Validation Error", "Please enter expiry date in MM/YY format.");
      return false;
    }
    
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      Alert.alert("Validation Error", "Please enter a delivery address.");
      return false;
    }
    
    return true;
  };

  // Main payment processing function
  const handlePayment = async (): Promise<void> => {
    // Validate form first
    if (!validateForm()) return;
    
    try {
      setIsProcessing(true); // Show loading indicator
      
      console.log("💳 Starting payment process...");
      
      // Get authentication token from device storage
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Authentication Error", "Please login again.");
        return;
      }

      // Step 1: Create the order (checkout process)
      console.log("🛒 Creating order...");
      const checkoutResponse = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          order_type: orderType, 
          delivery_address: orderType === "delivery" ? deliveryAddress : null 
        })
      });
      
      const checkoutData: CheckoutResponse = await checkoutResponse.json();
      console.log("📦 Checkout response:", checkoutData);
      
      if (!checkoutResponse.ok) {
        Alert.alert("Checkout Error", checkoutData.message || "Checkout failed.");
        return;
      }

      const finalOrderId = checkoutData.order_id;

      // Step 2: Process the payment
      console.log("💰 Processing payment...");
      const paymentResponse = await fetch(`${API_BASE_URL}/api/cart/payment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          order_id: finalOrderId,
          payer_name: payerName,
          payer_card_number: payerCardNumber.replace(/\s/g, ''), // Remove spaces
          payer_expiry: payerExpiry,
          payer_card_type: payerCardType,
          receiver_name: receiverName,
          receiver_card_number: receiverCardNumber,
          amount: checkoutData.total_amount
        } as PaymentData)
      });

      const paymentData: PaymentResponse = await paymentResponse.json();
      console.log("✅ Payment response:", paymentData);

      if (paymentResponse.ok) {
        // Success! Show confirmation and navigate
        Alert.alert(
          "Payment Successful! ",
          `Thank You for shoppig with us `,
          [
            {
              text: "View Orders",
              onPress: () => router.push("/orders")
            },
            {
              text: "Continue Shopping",
              onPress: () => router.push("/home")
            }
          ]
        );
      } else {
        Alert.alert("Payment Failed", paymentData.message || "Payment processing failed.");
      }

    } catch (error: any) {
      console.error("🚨 Payment error:", error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          "Connection Error", 
          "Unable to process payment. Please check your internet connection and try again."
        );
      } else {
        Alert.alert("Error", "An error occurred during payment processing.");
      }
    } finally {
      setIsProcessing(false); // Hide loading indicator
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Payment Details</Text>
      
      {/* Payment Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        
        {/* Cart Items */}
        {loadingCart ? (
          <View style={styles.loadingItems}>
            <ActivityIndicator size="small" color="#8b5e3c" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : (
          <>
            {cartItems.map((item, index) => (
              <View key={item.cart_item_id} style={styles.summaryItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetails}>Art Pieces: {item.quantity} × R{item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>R{(item.quantity * item.price).toFixed(2)}</Text>
              </View>
            ))}
            
            {cartItems.length > 0 && <View style={styles.summaryDivider} />}
          </>
        )}
        
        <Text style={styles.summaryAmount}>Total Amount: R{totalAmount.toFixed(2)}</Text>
      </View>

      {/* Payment Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Cardholder Information</Text>
        
        {/* Payer Name */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={payerName}
          onChangeText={setPayerName}
          autoCapitalize="words"
        />

        {/* Card Number */}
        <Text style={styles.label}>Card Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          value={payerCardNumber}
          onChangeText={(text) => {
            const formatted = formatCardNumber(text);
            if (formatted.replace(/\s/g, '').length <= 16) {
              setPayerCardNumber(formatted);
            }
          }}
          keyboardType="numeric"
          maxLength={19} // 16 digits + 3 spaces
        />

        {/* Expiry Date */}
        <Text style={styles.label}>Expiry Date (MM/YY) *</Text>
        <TextInput
          style={styles.input}
          placeholder="12/25"
          value={payerExpiry}
          onChangeText={(text) => {
            const formatted = formatExpiry(text);
            if (formatted.length <= 5) {
              setPayerExpiry(formatted);
            }
          }}
          keyboardType="numeric"
          maxLength={5}
        />

        {/* Card Type */}
        <Text style={styles.label}>Card Type</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowCardTypeModal(true)}
        >
          <Text style={styles.filterButtonText}>{getCardTypeLabel(payerCardType)}</Text>
        </TouchableOpacity>

        {/* Order Type */}
        <Text style={styles.sectionTitle}>Delivery Options</Text>
        <Text style={styles.label}>Order Type</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowOrderTypeModal(true)}
        >
          <Text style={styles.filterButtonText}>{getOrderTypeLabel(orderType)}</Text>
        </TouchableOpacity>

        {/* Delivery Address (conditional) */}
        {orderType === "delivery" && (
          <>
            <Text style={styles.label}>Delivery Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your full delivery address"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
            />
          </>
        )}

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.paymentButton, isProcessing && styles.disabledButton]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.paymentButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.paymentButtonText}>
              Pay R{totalAmount.toFixed(2)} & Place Order
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Card Type Modal */}
      <Modal
        visible={showCardTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCardTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Card Type</Text>
            {cardTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalOption, payerCardType === option.value && styles.selectedOption]}
                onPress={() => {
                  setPayerCardType(option.value);
                  setShowCardTypeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, payerCardType === option.value && styles.selectedOptionText]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCardTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Type Modal */}
      <Modal
        visible={showOrderTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Order Type</Text>
            {orderTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalOption, orderType === option.value && styles.selectedOption]}
                onPress={() => {
                  setOrderType(option.value);
                  setShowOrderTypeModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, orderType === option.value && styles.selectedOptionText]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowOrderTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f2eb",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#fffaf3",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#8b5e3c",
    marginBottom: 4,
  },
  
  // Order summary item styles
  loadingItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    marginBottom: 4,
  },
  
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5e3c',
  },
  
  summaryDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  
  summaryNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  formCard: {
    backgroundColor: "#fffaf3",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  picker: {
    height: 50,
  },
  paymentButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#6c757d",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "600",
  },
  securityNote: {
    alignItems: "center",
    marginBottom: 20,
  },
  securityText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  
  // Filter button styles (for dropdowns)
  filterButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  
  filterButtonText: {
    fontSize: 16,
    color: "#333",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  modalOption: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  
  selectedOption: {
    backgroundColor: '#8B4513',
  },
  
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  modalCloseButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#6c757d',
    marginTop: 10,
  },
  
  modalCloseText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});