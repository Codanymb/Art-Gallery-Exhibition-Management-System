import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Payment.css";

export default function PaymentPage({ orderId, totalAmount }) {
  const navigate = useNavigate();

  // Form state
  const [payerName, setPayerName] = useState("");
  const [payerCardNumber, setPayerCardNumber] = useState("");
  const [payerExpiry, setPayerExpiry] = useState("");
  const [payerCardType, setPayerCardType] = useState("visa");
  const [orderType, setOrderType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Receiver details (fake constants)
  const receiverName = "Art Gallery Ltd.";
  const receiverCardNumber = "1234567890123456";

  const handlePayment = async () => {
    if (!payerName || !payerCardNumber || !payerExpiry) {
      alert("Please fill in all your card details.");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress) {
      alert("Please enter a delivery address.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // First, create the order
      const checkoutRes = await fetch("http://localhost:3000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ order_type: orderType, delivery_address: orderType === "delivery" ? deliveryAddress : null })
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        alert(checkoutData.error || "Checkout failed.");
        return;
      }

      const finalOrderId = checkoutData.order_id;

      // Then make payment
      const paymentRes = await fetch("http://localhost:3000/api/cart/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          order_id: finalOrderId,
          payer_name: payerName,
          payer_card_number: payerCardNumber,
          payer_expiry: payerExpiry,
          payer_card_type: payerCardType,
          receiver_name: receiverName,
          receiver_card_number: receiverCardNumber,
          amount: checkoutData.total_amount
        })
      });

      const paymentData = await paymentRes.json();
      if (paymentRes.ok) {
        alert(`Payment successful! Payment ID: ${paymentData.payment_id}`);
        navigate("/orders"); // Redirect to Orders page
      } else {
        alert(paymentData.error || "Payment failed.");
      }
    } catch (err) {
      console.error("Error during payment:", err);
      alert("An error occurred. Check console.");
    }
  };

  return (
    <div className="payment-page">
      <h1>Payment</h1>

      <div className="payment-form">
        <label>Payer Name:</label>
        <input value={payerName} onChange={e => setPayerName(e.target.value)} />

        <label>Card Number:</label>
        <input value={payerCardNumber} onChange={e => setPayerCardNumber(e.target.value)} maxLength={16} />

        <label>Expiry Date (MM/YY):</label>
        <input value={payerExpiry} onChange={e => setPayerExpiry(e.target.value)} maxLength={5} />

        <label>Card Type:</label>
        <select value={payerCardType} onChange={e => setPayerCardType(e.target.value)}>
          <option value="visa">Visa</option>
          <option value="mastercard">Mastercard</option>
        </select>

        <label>Order Type:</label>
        <select value={orderType} onChange={e => setOrderType(e.target.value)}>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>

        {orderType === "delivery" && (
          <>
            <label>Delivery Address:</label>
            <input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
          </>
        )}

        <label>Total Amount: R{totalAmount}</label>
        <button className="btn primary" onClick={handlePayment}>Pay & Place Order</button>
      </div>
    </div>
  );
}
