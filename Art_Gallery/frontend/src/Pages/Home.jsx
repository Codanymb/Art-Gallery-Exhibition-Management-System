import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [userType, setUserType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showReview, setShowReview] = useState(false); // New state for review step
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [registrationType, setRegistrationType] = useState("individual");
  const [attendees, setAttendees] = useState(1);

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

  // Fetch exhibitions
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/getAllEx/getEx")
      .then((res) => setExhibitions(res.data.users))
      .catch((err) => console.error("Error fetching exhibitions:", err));
  }, []);

  // Open modal
  const openModal = (exhibition) => {
    setSelectedExhibition(exhibition);
    setShowModal(true);
    setShowReview(false); // reset review step
    setRegistrationType("individual");
    setAttendees(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExhibition(null);
    setShowReview(false);
    setRegistrationType("individual");
    setAttendees(1);
  };

  // Move to review step
  const handleReview = () => {
    if (registrationType === "group" && attendees < 2) {
      alert("Group registration must have at least 2 attendees.");
      return;
    }

    if (registrationType === "individual" && attendees !== 1) {
      alert("Individual registration must have exactly 1 attendee.");
      return;
    }

    setShowReview(true);
  };

  // Final registration submission
  const submitRegistration = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("User not logged in.");
      return;
    }

    const registration = {
      exhibition_id: selectedExhibition.exhibition_id,
      registration_type: registrationType,
      attendees,
    };

    axios
      .post("http://localhost:3000/api/registerForExhibition/exReg", registration, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Successfully registered!");
        closeModal();
      })
      .catch((err) => {
        alert(err.response?.data?.msg || "Registration failed.");
      });
  };

  // Delete exhibition (owner only)
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this exhibition?")) return;

    const token = localStorage.getItem("token");

    axios
      .delete(`http://localhost:3000/api/deleteEx/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Exhibition deleted");
        setExhibitions(exhibitions.filter((ex) => ex.exhibition_id !== id));
      })
      .catch((err) => alert(err.response?.data?.message || "Delete failed"));
  };

  // Filter exhibitions (only coming status + search + category)
  const filteredExhibitions = exhibitions
    .filter((ex) => ex.ex_status === "coming") // only upcoming
    .filter((ex) => {
      return (
        ex.ex_title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (category ? ex.ex_category === category : true)
      );
    });

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Upcoming Exhibitions</h1>
        <p className="subtitle">Your Journey Through Inspiration</p>

        {/* Search & filter */}
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Nature">Nature</option>
            <option value="History">History</option>
            <option value="Photography">Photography</option>
            <option value="Other">Other</option>
          </select>

          {userType === "owner" && (
            <button
              className="btn primary"
              onClick={() => navigate("/exhibition/add")}
              style={{ marginLeft: "10px", height: "40px" }}
            >
              Add Exhibition
            </button>
          )}
        </div>

        {/* Exhibition grid */}
        <div className="exhibitions-grid">
          {filteredExhibitions.length === 0 && (
            <div className="empty-state">No upcoming exhibitions found.</div>
          )}

          {filteredExhibitions.map((ex) => (
            <div key={ex.exhibition_id} className="card">
              {ex.ex_poster && <img src={ex.ex_poster} alt={ex.ex_title} className="poster" />}
              <div className="card-content">
                <span className={`chip ${ex.ex_status}`}>{ex.ex_status}</span>
                <h2>{ex.ex_title}</h2>
                <p>Date: {new Date(ex.ex_date).toLocaleDateString()}</p>
                <p>Category: {ex.ex_category}</p>
              </div>

<div className="card-actions">
  {userType === "owner" || userType === "clerk" ? (
    <>
      <button
        className="btn primary"
        onClick={() => navigate(`/exhibition/edit/${ex.exhibition_id}`)}
      >
        Edit
      </button>

      {userType === "owner" && (
        <button
          className="btn primary"
          onClick={() => handleDelete(ex.exhibition_id)}
        >
          Delete
        </button>
      )}

      <button
        className="btn secondary"
        onClick={() => navigate(`/exhibition/${ex.exhibition_id}`)}
      >
        View Details
      </button>
    </>
  ) : (
    <>
      <button className="btn primary" onClick={() => openModal(ex)}>
        Register
      </button>
      <button
        className="btn secondary"
        onClick={() => navigate(`/exhibition/${ex.exhibition_id}`)}
      >
        View Details
      </button>
    </>
  )}
</div>

            </div>
          ))}
        </div>
      </main>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            {!showReview ? (
              <>
                <h3>Register for "{selectedExhibition.ex_title}"</h3>

                <label>Registration Type</label>
                <select
                  value={registrationType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setRegistrationType(type);
                    setAttendees(type === "group" ? 2 : 1);
                  }}
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>

                <label>Number of Attendees</label>
                <input
                  type="number"
                  min={registrationType === "group" ? 2 : 1}
                  max={registrationType === "individual" ? 1 : undefined}
                  value={attendees}
                  disabled={registrationType === "individual"}
                  onChange={(e) => setAttendees(parseInt(e.target.value) || 1)}
                />

                <div className="modal-buttons">
                  <button className="btn primary" onClick={handleReview}>
                    View Registration Details
                  </button>
                  <button className="btn secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              // Review Step
              <>
                <h3>Review Registration</h3>
                <p>
                  <strong>Exhibition:</strong> {selectedExhibition.ex_title}
                </p>
                <p>
                  <strong>Registration Type:</strong> {registrationType}
                </p>
                <p>
                  <strong>Number of Attendees:</strong> {attendees}
                </p>

                <div className="modal-buttons">
                  <button className="btn primary" onClick={submitRegistration}>
                    Confirm
                  </button>
                  <button className="btn secondary" onClick={() => setShowReview(false)}>
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
