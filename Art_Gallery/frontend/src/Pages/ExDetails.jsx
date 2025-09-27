import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./ExDetails.css";

export default function ExDetails() {
  const { exhibition_id } = useParams();
  const [exhibition, setExhibition] = useState(null);
  const [artPieces, setArtPieces] = useState([]);
  const [availableArt, setAvailableArt] = useState([]);
  const [userType, setUserType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserType(decoded.user_type);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }

    fetchExhibitionData();
    fetchAvailableArt();
  }, [exhibition_id]);

  const fetchExhibitionData = () => {
    fetch(`http://localhost:3000/api/getEachEx/getEachEx/${exhibition_id}`)
      .then(res => res.json())
      .then(data => setExhibition(data.Exhibition))
      .catch(err => console.error(err));

    fetch(`http://localhost:3000/api/ExArt/getExhibitionArt/${exhibition_id}`)
      .then(res => res.json())
      .then(data => setArtPieces(data.art_pieces || []))
      .catch(err => console.error(err));
  };

  const fetchAvailableArt = () => {
    fetch("http://localhost:3000/api/available/getAvailableArt")
      .then(res => res.json())
      .then(data => setAvailableArt(data.art_pieces || []))
      .catch(err => console.error(err));
  };

  // Add to Cart
const handleAddToCart = async (art_piece_id, price) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to add to cart");

    const quantity = 1;

    const res = await fetch("http://localhost:3000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ art_piece_id, quantity, price }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON response:", text);
      alert("Server returned invalid response. Check backend logs.");
      return;
    }

    if (!res.ok) {
      alert(data.error || data.msg || "Failed to add to cart");
      return;
    }

    //  Dispatch an event to notify Navbar
    window.dispatchEvent(new Event("cartUpdated"));

    alert(data.message);
  } catch (err) {
    console.error("Error adding to cart:", err);
    alert("An error occurred. Check console for details.");
  }
};

  // Owner-only: Add Art Button
  const handleAdd = async (art_piece_id) => {
    try {
      const res = await fetch("http://localhost:3000/api/Assign/AssignArt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibition_id, art_piece_id })
      });
      const data = await res.json();
      alert(data.msg);

      if (res.ok) {
        fetchExhibitionData();
        setAvailableArt(prev => prev.filter(a => a.art_piece_id !== art_piece_id));
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding art piece:", err);
    }
  };

  const handleRemove = async (art_piece_id) => {
    if (!window.confirm("Are you sure you want to remove this art piece?")) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/remove/DeleteArt/${exhibition_id}/${art_piece_id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      alert(data.msg);

      if (res.ok) {
        fetchExhibitionData();
        const removedArt = artPieces.find(a => a.art_piece_id === art_piece_id);
        if (removedArt) setAvailableArt(prev => [...prev, removedArt]);
      }
    } catch (err) {
      console.error("Error removing art piece:", err);
    }
  };

  const filteredArt = availableArt.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!exhibition) return <p>Loading...</p>;

  return (
    <div className="exhibition-details">
      <h1>{exhibition.ex_title}</h1>
      <div className="info-grid">
        <p><strong>Status:</strong> {exhibition.ex_status}</p>
        <p><strong>Date:</strong> {exhibition.ex_date}</p>
      </div>

      {userType === "owner" && (
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>
          + Add Art Piece
        </button>
      )}

      <h2>Art Pieces</h2>
      <div className="art-grid">
        {artPieces.length ? (
          artPieces.map((art, i) => (
            <div key={i} className="art-card">
              {art.image ? <img src={art.image} alt={art.title} /> : <div>No Image</div>}
              <h3>{art.title}</h3>
              <p><strong>Category:</strong> {art.category}</p>
              <p><strong>Description:</strong> {art.description}</p>
              <p><strong>Value:</strong> {art.estimated_value ? `R${art.estimated_value}` : "No Price"}</p>

              {userType === "owner" && (
                <button onClick={() => handleRemove(art.art_piece_id)} className="remove-btn">
                  Remove
                </button>
              )}

              {userType !== "owner" && (
                <button onClick={() => handleAddToCart(art.art_piece_id, art.estimated_value)} className="cart-btn">
                   Add to Cart
                </button>

              )}
            </div>
          ))
        ) : (
          <p>No art pieces found.</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Select Art Piece to Add</h3>
            <input
              type="text"
              placeholder="Search by title or category"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="modal-list">
              {filteredArt.length ? (
                filteredArt.map(a => (
                  <div key={a.art_piece_id} className="modal-item">
                    <span>{a.title} ({a.category})</span>
                    <button onClick={() => handleAdd(a.art_piece_id)}>Add</button>
                  </div>
                ))
              ) : (
                <p>No available art pieces found.</p>
              )}
            </div>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
