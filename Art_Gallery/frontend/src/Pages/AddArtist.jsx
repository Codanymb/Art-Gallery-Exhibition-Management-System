import React, { useState } from "react";
import axios from "axios";
import "./AddArt.css"; // Reuse the same CSS for consistency

const AddArtist = () => {
  const [formData, setFormData] = useState({
    id_number: "",
    first_name: "",
    surname: "",
    is_active: "yes",
  });

  const [loading, setLoading] = useState(false);

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
      if (!formData[key]) {
        alert("Please fill all fields.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/AddArtist/AddA",
        formData
      );

      if (response.data.Status) {
        alert("Artist added successfully!");
        setFormData({
          id_number: "",
          first_name: "",
          surname: "",
          is_active: "yes",
        });
      } else {
        alert(response.data.msg || "Failed to add artist.");
      }
    } catch (err) {
      console.error("Error adding artist:", err);
      alert(err.response?.data?.msg || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Add New Artist</h1>
        <p className="subtitle">Enter the artist's details below</p>

        <form className="edit-artist-form" onSubmit={handleSubmit}>
          <label>
            ID Number
            <input
              type="text"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            First Name
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Surname
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
            />
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

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Artist"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddArtist;
