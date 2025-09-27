import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AddArt.css"; // make sure to create this CSS

const AddArt = () => {
  const [artists, setArtists] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    id_number: "",
    estimated_value: "",
    category: "",
    availability: "available",
    is_active: "yes",
    image: "",
    quantity: 1,
  });

  const [loading, setLoading] = useState(false);

  // Fetch all active artists
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/getAllArtists/get")
      .then((res) => setArtists(res.data.users || []))
      .catch((err) => console.error("Error fetching artists:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    for (let key in formData) {
      if (formData[key] === "" || formData[key] === null) {
        alert("Please fill all fields.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/AddArt/AddArt",
        formData
      );

      if (response.data.Status) {
        alert("Art piece added successfully!");
        setFormData({
          title: "",
          description: "",
          id_number: "",
          estimated_value: "",
          category: "",
          availability: "available",
          is_active: "yes",
          image: "",
          quantity: 1,
        });
      } else {
        alert(response.data.msg || "Failed to add art piece.");
      }
    } catch (err) {
      console.error("Error adding art piece:", err);
      alert(err.response?.data?.msg || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Add New Art Piece</h1>
        <p className="subtitle">Fill in the details below</p>

        <form className="edit-artist-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Artist
            <select
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
            >
              <option value="">Select an artist</option>
              {artists.map((artist) => (
                <option key={artist.artist_id} value={artist.id_number}>
                  {artist.first_name} {artist.surname}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estimated Value (R)
            <input
              type="number"
              name="estimated_value"
              value={formData.estimated_value}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="Nature">Nature</option>
              <option value="History">History</option>
              <option value="Photography">Photography</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Availability
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
            >
              <option value="available">Available</option>
              <option value="displayed">Displayed</option>
            </select>
          </label>

          <label>
            Status
            <select
              name="is_active"
              value={formData.is_active}
              onChange={handleChange}
              required
            >
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </label>

          <label>
            Image URL
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </label>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Art Piece"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddArt;
