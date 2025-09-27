import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/view", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCartItems(data.items);
        setCartId(data.cart_id);
        calculateTotal(data.items);
      } else {
        alert(data.error || "Failed to fetch cart");
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalAmount(sum);
  };

  const handleRemove = async (art_piece_id) => {
    if (!window.confirm("Remove this item from the cart?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ art_piece_id })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedCart = cartItems.filter(item => item.art_piece_id !== art_piece_id);
        setCartItems(updatedCart);
        calculateTotal(updatedCart);
        alert(data.message);
      } else {
        alert(data.error || "Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty! Add items before proceeding to checkout.");
      return;
    }

    // Redirect to Payment Page (instead of using prompt here)
    navigate("/payment", { state: { cartId, totalAmount } });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Art Piece</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.cart_item_id}>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>
                  <td>R{item.price}</td>
                  <td>R{item.price * item.quantity}</td>
                  <td>
                    <button className="btn secondary" onClick={() => handleRemove(item.art_piece_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Total Amount: R{totalAmount}</h2>
          <button className="btn primary checkout-btn" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}
