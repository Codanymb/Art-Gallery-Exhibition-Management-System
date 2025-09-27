import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Ex.css'; // Same CSS as Home

const Ex = () => {
  const [exhibitions, setExhibitions] = useState([]);
  const [userType, setUserType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [registrationType, setRegistrationType] = useState('individual');
  const [attendees, setAttendees] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const navigate = useNavigate();

  // Decode JWT to get user type
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserType(decoded.user_type);
      } catch (err) {
        console.error('Invalid token', err);
      }
    }
  }, []);

  // Fetch exhibitions
  useEffect(() => {
    axios
      .get('http://localhost:3000/api/getAllEx/getEx')
      .then((res) => setExhibitions(res.data.users))
      .catch((err) => console.error('Error fetching exhibitions:', err));
  }, []);

  const openModal = (exhibition) => {
    setSelectedExhibition(exhibition);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExhibition(null);
    setRegistrationType('individual');
    setAttendees(1);
    setShowPreview(false);
  };

  const submitRegistration = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('User not logged in.');
      return;
    }

    if (registrationType === 'group' && attendees < 2) {
      alert('Group registration must have at least 2 attendees.');
      return;
    }

    if (registrationType === 'individual' && attendees !== 1) {
      alert('Individual registration must have exactly 1 attendee.');
      return;
    }

    const registration = {
      exhibition_id: selectedExhibition.exhibition_id,
      registration_type: registrationType,
      attendees,
    };

    axios
      .post('http://localhost:3000/api/registerForExhibition/exReg', registration, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert('Successfully registered!');
        closeModal();
      })
      .catch((err) => {
        alert(err.response?.data?.msg || 'Registration failed.');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this exhibition?')) return;

    const token = localStorage.getItem('token');

    axios
      .delete(`http://localhost:3000/api/deleteEx/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert('Exhibition deleted');
        setExhibitions(exhibitions.filter((ex) => ex.exhibition_id !== id));
      })
      .catch((err) => alert(err.response?.data?.message || 'Delete failed'));
  };

  const filteredExhibitions = exhibitions.filter((ex) => {
    const matchesSearch = ex.ex_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? ex.ex_category === categoryFilter : true;
    const matchesStatus = statusFilter ? ex.ex_status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="home-wrapper">
      <main className="content">
        <h1>All Exhibitions</h1>
        <p className="subtitle">A World of Art, All in One Place</p>

        {/* Filters + Add Button */}
        <div
          className="search-bar-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          <input
            type="text"
            placeholder="Search by title..."
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
            <option value="coming">Coming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>

          {userType === 'owner' && (
            <button
              className="btn primary"
              onClick={() => navigate('/exhibition/add')}
              style={{ marginLeft: '10px', height: '40px' }}
            >
              Add Exhibition
            </button>
          )}
        </div>

        {/* Exhibition Grid */}
        <div className="exhibitions-grid">
          {filteredExhibitions.length === 0 && (
            <div className="empty-state">No exhibitions match your filters.</div>
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
                {(userType === 'owner' || userType === 'clerk') ? (
                  <>
                    <button
                      className="btn primary"
                      onClick={() => navigate(`/exhibition/edit/${ex.exhibition_id}`)}
                    >
                      Edit
                    </button>

                    {/* Owner only: Delete button */}
                    {userType === 'owner' && (
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
                    {/* Visitor */}
                    {ex.ex_status === 'coming' && (
                      <button className="btn primary" onClick={() => openModal(ex)}>
                        Register
                      </button>
                    )}
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
            <h3>Register for "{selectedExhibition.ex_title}"</h3>

            {!showPreview ? (
              <>
                <label>Registration Type</label>
                <select
                  value={registrationType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setRegistrationType(type);
                    setAttendees(type === 'group' ? 2 : 1);
                  }}
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>

                <label>Number of Attendees</label>
                <input
                  type="number"
                  min={registrationType === 'group' ? 2 : 1}
                  max={registrationType === 'individual' ? 1 : undefined}
                  value={attendees}
                  disabled={registrationType === 'individual'}
                  onChange={(e) => setAttendees(parseInt(e.target.value) || 1)}
                />

                <div className="modal-buttons">
                  <button className="btn primary" onClick={() => setShowPreview(true)}>
                    Preview
                  </button>
                  <button className="btn secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4>Review Your Registration</h4>
                <p><strong>Exhibition:</strong> {selectedExhibition.ex_title}</p>
                <p><strong>Type:</strong> {registrationType}</p>
                <p><strong>Attendees:</strong> {attendees}</p>

                <div className="modal-buttons">
                  <button className="btn primary" onClick={submitRegistration}>
                    Confirm
                  </button>
                  <button className="btn secondary" onClick={() => setShowPreview(false)}>
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

export default Ex;
