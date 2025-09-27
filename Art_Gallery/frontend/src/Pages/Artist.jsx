import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./Ex.css"; // reuse your existing styling

const Artist = () => {
  const [artists, setArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userType, setUserType] = useState(""); // state for user type
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

  // Fetch all artists
  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = () => {
    axios
      .get("http://localhost:3000/api/getAllArtists/get")
      .then((res) => setArtists(res.data.users || []))
      .catch((err) => {
        console.error(err);
        setArtists([]);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this artist?")) return;

    axios
      .delete(`http://localhost:3000/api/deleteArtist/deleteA/${id}`)
      .then(() => {
        alert("Artist deleted successfully");
        setArtists((prev) => prev.filter((a) => a.artist_id !== id));
      })
      .catch((err) => {
        alert(err.response?.data?.msg || "Delete failed");
      });
  };

  const filteredArtists = (artists || []).filter((a) =>
    a.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id_number.includes(searchQuery)
  );

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Artists</h1>
        <p className="subtitle">Featured Artists</p>

        {/* Search + Add button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {userType === "owner" && (
            <button
              className="btn primary"
              onClick={() => navigate("/artist/add")}
              style={{ height: "40px" }}
            >
              Add New Artist
            </button>
          )}
        </div>

        {/* Artists grid */}
        <div className="exhibitions-grid">
          {filteredArtists.length === 0 && <p className="empty-state">No artists found.</p>}

          {filteredArtists.map((artist) => (
            <div key={artist.artist_id} className="card">
              <div className="card-content">
                <h2>{artist.first_name} {artist.surname}</h2>
                <p>ID Number: {artist.id_number}</p>
                <p>Status: {artist.is_active}</p>
              </div>

              {/* Only owners can see Edit/Delete buttons */}
              {userType === "owner" && (
                <div className="card-actions">
                  <button
                    className="btn primary"
                    onClick={() => navigate(`/artist/edit/${artist.artist_id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => handleDelete(artist.artist_id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Artist;
