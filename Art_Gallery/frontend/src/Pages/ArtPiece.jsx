import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Ex.css"; 

const ArtPieces = () => {
  const [arts, setArts] = useState([]);
  const [userType, setUserType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  // Decode JWT to get user type
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
  }, []);

  // Fetch all art pieces
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/getAllArts/getArt")
      .then((res) => setArts(res.data.arts))
      .catch((err) => console.error("Error fetching arts:", err));
  }, []);

  // Filtered arts
  const filteredArts = arts.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? art.category === categoryFilter : true;
    const matchesStatus = statusFilter ? art.availability === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Art Pieces</h1>
        <p className="subtitle">Explore Art From Various Exhibitions</p>

        {/* Filters */}
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search art by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Nature">Nature</option>
            <option value="History">History</option>
            <option value="Photography">Photography</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="displayed">Displayed</option>
          </select>

          {userType === "owner" && (
            <button
              className="btn primary"
              onClick={() => navigate("/art/add")}
              style={{ marginLeft: '10px', height: '40px' }}
            >
              Add Art Piece
            </button>
          )}
        </div>

        {/* Art Grid */}
        <div className="exhibitions-grid">
          {filteredArts.length === 0 && (
            <div className="empty-state">No art pieces found.</div>
          )}

          {filteredArts.map((art) => (
            <div key={art.art_piece_id} className="card">
              {art.image && <img src={art.image} alt={art.title} className="poster" />}
              <div className="card-content">
                <span className={`chip ${art.availability}`}>{art.availability}</span>
                <h2>{art.title}</h2>
                <p>{art.description}</p>
                <p>Category: {art.category}</p>
                <p>Estimated Value: R{art.estimated_value.toFixed(2)}</p>
                <p>Quantity: {art.quantity}</p>
              </div>

              <div className="card-actions">
                {(userType === "owner" || userType === "clerk") && (
                  <>
                    <button
                      className="btn primary"
                      onClick={() => navigate(`/art/edit/${art.art_piece_id}`)}
                    >
                      Edit
                    </button>

                    {/* Only owner sees Delete */}
                    {userType === "owner" && (
                      <button
                        className="btn primary"
                        onClick={() => {
                          if (!window.confirm("Are you sure you want to delete this art piece?")) return;

                          const token = localStorage.getItem("token");
                          axios
                            .delete(`http://localhost:3000/api/deleteArt/${art.art_piece_id}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            .then(() => {
                              alert("Art piece deleted successfully");
                              setArts(arts.filter((a) => a.art_piece_id !== art.art_piece_id));
                            })
                            .catch((err) => {
                              alert(err.response?.data?.message || "Delete failed");
                            });
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ArtPieces;
