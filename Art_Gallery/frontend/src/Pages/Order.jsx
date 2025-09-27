import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Order.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/UserOrder/MyOrder", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data["My order"] || []);
      } else {
        alert(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (!orders.length) return <p style={{ textAlign: "center", marginTop: "2rem" }}>You have no orders yet.</p>;

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Type</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Delivery Address</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.order_id}>
              <td>{order.order_id}</td>
              <td>{order.order_type}</td>
              <td>R{order.total_amount}</td>
              <td>{order.status}</td>
              <td>{new Date(order.Date_created).toLocaleString()}</td>
              <td>{order.delivery_address || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
