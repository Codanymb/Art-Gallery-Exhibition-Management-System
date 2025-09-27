import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddEx.css"; // optional: create a CSS file for styling

const AddExhibition = () => {
  const navigate = useNavigate();
  const [exhibition, setExhibition] = useState({
    ex_title: "",
    ex_date: "",
    ex_status: "coming",
    ex_space: "",
    ex_category: "Nature",
    ex_poster: "",
    ex_price: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExhibition({ ...exhibition, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/api/AddExhibition/Add",
        exhibition
      );

      alert(response.data.Message);
      navigate("/exhibitions"); // Redirect to exhibitions list after adding
    } catch (err) {
      console.error("Error creating exhibition:", err);
      alert(err.response?.data?.msg || "Failed to create exhibition");
    }
  };

  return (
    <div className="add-exhibition-wrapper">
      <h1>Create New Exhibition</h1>
      <form className="add-exhibition-form" onSubmit={handleSubmit}>
        <label>
          Title:
          <input
            type="text"
            name="ex_title"
            value={exhibition.ex_title}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date:
          <input
            type="date"
            name="ex_date"
            value={exhibition.ex_date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Space:
          <input
            type="number"
            name="ex_space"
            value={exhibition.ex_space}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Category:
          <select
            name="ex_category"
            value={exhibition.ex_category}
            onChange={handleChange}
            required
          >
            <option value="Nature">Nature</option>
            <option value="History">History</option>
            <option value="Photography">Photography</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Status:
          <select
            name="ex_status"
            value={exhibition.ex_status}
            onChange={handleChange}
            required
          >
            <option value="coming">Coming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label>
          Poster URL:
          <input
            type="text"
            name="ex_poster"
            value={exhibition.ex_poster}
            onChange={handleChange}
            placeholder="Paste poster image URL"
          />
        </label>

        <label>
          Price:
          <input
            type="number"
            step="0.01"
            name="ex_price"
            value={exhibition.ex_price}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="btn primary">
          Create Exhibition
        </button>
      </form>
    </div>
  );
};

export default AddExhibition;
