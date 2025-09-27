import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditArt.css";

const EditArt = () => {
  const { art_piece_id } = useParams();
  const navigate = useNavigate();

  const [art, setArt] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [isActive, setIsActive] = useState("");
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!art_piece_id) return;

    axios
      .get(`http://localhost:3000/api/getEachArt/getEachArt/${art_piece_id}`)
      .then((res) => {
        if (!res.data.art) {
          alert("Art piece not found");
          navigate("/art");
          return;
        }
        const artData = res.data.art;
        setArt(artData);
        setTitle(artData.title);
        setDescription(artData.description);
        setEstimatedValue(artData.estimated_value);
        setCategory(artData.category);
        setAvailability(artData.availability);
        setIsActive(artData.is_active);
        setImage(artData.image);
        setQuantity(artData.quantity);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to fetch art piece");
        navigate("/art");
      });
  }, [art_piece_id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .put(
        `http://localhost:3000/api/updateArt/updateArt/${art_piece_id}`,
        {
          title,
          description,
          estimated_value: estimatedValue,
          category,
          availability,
          is_active: isActive,
          image,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        alert("Art piece updated successfully");
        navigate("/art");
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.msg || "Update failed");
      });
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading...</p>;

  return (
    <div className="ex-wrapper">
      <main className="content">
        <h1>Edit Art Piece</h1>
        <form className="modal" onSubmit={handleSubmit}>
          <label>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>Estimated Value (R)</label>
          <input
            type="number"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            required
          />

          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="Nature">Nature</option>
            <option value="History">History</option>
            <option value="Photography">Photography</option>
            <option value="Other">Other</option>
          </select>

          <label>Availability</label>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} required>
            <option value="available">Available</option>
            <option value="displayed">Displayed</option>
          </select>

          <label>Active Status</label>
          <select value={isActive} onChange={(e) => setIsActive(e.target.value)} required>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label>Quantity</label>
          <input
            type="number"
            value={quantity}
            min="0"
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label>Image URL</label>
          <input type="text" value={image} onChange={(e) => setImage(e.target.value)} />

          <div className="modal-buttons">
            <button type="submit" className="btn primary">
              Save Changes
            </button>
            <button type="button" className="btn secondary" onClick={() => navigate("/art")}>
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditArt;
