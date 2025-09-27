import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Ex.css"; // Reuse the same styling as Home.jsx

const EditEx = () => {
  const { exhibition_id } = useParams();
  const navigate = useNavigate();

  const [exhibition, setExhibition] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [ex_title, setExTitle] = useState("");
  const [ex_date, setExDate] = useState("");
  const [ex_space, setExSpace] = useState("");
  const [ex_category, setExCategory] = useState("");
  const [ex_status, setExStatus] = useState("");
  const [ex_price, setExPrice] = useState("");
  const [ex_poster, setExPoster] = useState("");

  const token = localStorage.getItem("token");

  // Fetch existing exhibition details
useEffect(() => {
axios.get(`http://localhost:3000/api/getEachEx/getEachEx/${exhibition_id}`)

    .then((res) => {
      const ex = res.data.Exhibition;
      setExhibition(ex);
      setExTitle(ex.ex_title);
      setExDate(ex.ex_date);
      setExSpace(ex.ex_space);
      setExCategory(ex.ex_category);
      setExStatus(ex.ex_status);
      setExPrice(ex.ex_price);
      setExPoster(ex.ex_poster);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to fetch exhibition details");
      navigate("/");
    });
}, [exhibition_id, navigate]);


  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .put(
        `http://localhost:3000/api/updateEx/update/${exhibition_id}`,
        {
          ex_title,
          ex_date,
          ex_space,
          ex_category,
          ex_status,
          ex_price,
          ex_poster,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        alert("Exhibition updated successfully!");
        navigate("/");
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.msg || "Update failed");
      });
  };

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading...</p>;

  return (
    <div className="ex-wrapper">
      <main className="content">
        <h1>Edit Exhibition</h1>
        <p className="subtitle">Update exhibition details below</p>
        <form className="modal" onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            type="text"
            value={ex_title}
            onChange={(e) => setExTitle(e.target.value)}
            required
          />

          <label>Date</label>
          <input
            type="date"
            value={ex_date}
            onChange={(e) => setExDate(e.target.value)}
            required
          />

          <label>Space</label>
          <input
            type="text"
            value={ex_space}
            onChange={(e) => setExSpace(e.target.value)}
            required
          />

          <label>Category</label>
          <select
            value={ex_category}
            onChange={(e) => setExCategory(e.target.value)}
            required
          >
            <option value="Nature">Nature</option>
            <option value="History">History</option>
            <option value="Photography">Photography</option>
            <option value="Other">Others</option>
          </select>

          <label>Status</label>
          <select
            value={ex_status}
            onChange={(e) => setExStatus(e.target.value)}
            required
          >
            <option value="coming">Coming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>

          <label>Price (R)</label>
          <input
            type="number"
            value={ex_price}
            onChange={(e) => setExPrice(e.target.value)}
            required
          />

          <label>Poster URL</label>
          <input
            type="text"
            value={ex_poster}
            onChange={(e) => setExPoster(e.target.value)}
          />

          <div className="modal-buttons">
            <button type="submit" className="btn primary">
              Save Changes
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditEx;
