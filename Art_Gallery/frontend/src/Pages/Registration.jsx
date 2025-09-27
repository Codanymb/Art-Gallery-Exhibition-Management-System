import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./Registration.css"; // reuse same styling as Home

const Registration = () => {
  const [registrations, setRegistrations] = useState([]);
  const [userType, setUserType] = useState("");

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

  // Fetch registrations
  useEffect(() => {
    axios
      .get("http://localhost:3000/api/getAllReg/getReg") // backend endpoint to fetch all registrations
      .then((res) => {
        setRegistrations(res.data.registrations || []);
      })
      .catch((err) => {
        console.error("Error fetching registrations:", err);
      });
  }, []);

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>Exhibition Registrations</h1>
        <p className="subtitle">All confirmed visitor registrations</p>

        <div className="exhibitions-grid">
          {registrations.length === 0 && (
            <div className="empty-state">No registrations found.</div>
          )}

          {registrations.map((reg) => (
            <div key={reg.registration_id} className="card">
              <div className="card-content">
                <span className={`chip ${reg.status}`}>{reg.status}</span>
                <h2>Registration #{reg.registration_id}</h2>
                <p><strong>User ID:</strong> {reg.user_id}</p>
                <p><strong>Exhibition ID:</strong> {reg.exhibition_id}</p>
                <p><strong>Attendees:</strong> {reg.attendees}</p>
                <p><strong>Type:</strong> {reg.registration_type}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Registration;
