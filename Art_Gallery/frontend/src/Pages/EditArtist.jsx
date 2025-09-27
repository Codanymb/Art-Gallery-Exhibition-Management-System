// EditArtist.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./EditArtist.css";

const EditArtist = () => {
  const { artist_id } = useParams(); // ✅ Grab the ID from the URL
  const navigate = useNavigate();
  const [artist, setArtist] = useState({
    first_name: "",
    surname: "",
    id_number: "",
    is_active: "yes",
  });
  const [loading, setLoading] = useState(true);

  // Fetch artist details
  useEffect(() => {
    if (!artist_id) return;

    axios
      .get(`http://localhost:3000/api/getEachArtist/getEachArtist/${artist_id}`)
      .then((res) => {
        setArtist(res.data.artist);
        setLoading(false);
      })
      .catch((err) => {
        alert("Failed to fetch artist details");
        setLoading(false);
      });
  }, [artist_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setArtist({ ...artist, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`http://localhost:3000/api/updateArtist/update/${artist_id}`, artist)
      .then(() => {
        alert("Artist updated successfully");
        navigate("/artist"); // redirect back to artist list
      })
      .catch((err) => {
        alert(err.response?.data?.msg || "Failed to update artist");
      });
  };

  if (loading) return <p>Loading artist details...</p>;

  return (
    <div className="edit-artist-wrapper">
      <h1>Edit Artist</h1>
      <form className="edit-artist-form" onSubmit={handleSubmit}>
        <label>
          First Name:
          <input
            type="text"
            name="first_name"
            value={artist.first_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Surname:
          <input
            type="text"
            name="surname"
            value={artist.surname}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          ID Number:
          <input
            type="text"
            name="id_number"
            value={artist.id_number}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Status:
          <select
            name="is_active"
            value={artist.is_active}
            onChange={handleChange}
            required
          >
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
          </select>
        </label>

        <button type="submit" className="btn primary">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditArtist;
