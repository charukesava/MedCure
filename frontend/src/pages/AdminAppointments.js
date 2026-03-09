import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders, BASE_URL } from "../services/api";
import "../styles/AdminAppointments.css";

export default function AdminAppointments() {
  const { user, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchAppointments = useCallback(async () => {
    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch(`${BASE_URL}/api/appointments`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch(
        `${BASE_URL}/api/appointments/admin/notifications`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [user]);

  // Fetch appointments and notifications
  useEffect(() => {
    if (!isAdmin) return;

    fetchAppointments();
    fetchNotifications();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchAppointments();
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAdmin, fetchAppointments, fetchNotifications]);

  const handleStatusUpdate = async (appointmentId) => {
    if (!statusUpdate) {
      setMessage("❌ Please select a status");
      return;
    }

    try {
      const headers = await getAuthHeaders(user);
      const response = await fetch(
        `${BASE_URL}/api/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            status: statusUpdate,
            adminNotes: adminNotes,
          }),
        },
      );

      if (response.ok) {
        setMessage("✅ Appointment status updated successfully!");
        setStatusUpdate("");
        setAdminNotes("");
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        setMessage("❌ Failed to update appointment");
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const headers = await getAuthHeaders(user);
      await fetch(
        `${BASE_URL}/api/appointments/admin/notifications/${notificationId}/read`,
        { method: "PUT", headers },
      );
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const filteredAppointments =
    filterStatus === "all"
      ? appointments
      : appointments.filter((apt) => apt.status === filterStatus);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  if (!isAdmin) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>❌ Access Denied</h2>
        <p>Only administrators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-appointments-container">
      <h1>👨‍💼 Admin Appointment Management</h1>

      {/* Notifications Section */}
      {unreadNotifications.length > 0 && (
        <div className="notifications-section">
          <h2>🔔 New Notifications ({unreadNotifications.length})</h2>
          <div className="notifications-list">
            {unreadNotifications.map((notif) => (
              <div key={notif.id} className="notification-card">
                <div className="notification-content">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <small>{new Date(notif.createdAt).toLocaleString()}</small>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="mark-read-btn"
                >
                  Mark as Read
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Appointments</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "6px",
            backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
            color: message.includes("✅") ? "#155724" : "#721c24",
            border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {message}
        </div>
      )}

      {/* Appointments Table */}
      {loading ? (
        <p>Loading appointments...</p>
      ) : filteredAppointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div className="appointments-table">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Hospital</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => (
                <tr
                  key={apt.id}
                  className={`status-${apt.status.toLowerCase()}`}
                >
                  <td>{apt.patientName}</td>
                  <td>{apt.hospitalName}</td>
                  <td>{apt.department}</td>
                  <td>
                    {apt.date} at {apt.time}
                  </td>
                  <td>{apt.phone}</td>
                  <td>
                    <span
                      className={`status-badge ${apt.status.toLowerCase()}`}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td>{new Date(apt.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setAdminNotes(apt.adminNotes || "");
                        setStatusUpdate(apt.status);
                      }}
                      className="view-btn"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAppointment && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAppointment(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Appointment Details</h2>

            <div className="detail-row">
              <label>Patient Name:</label>
              <span>{selectedAppointment.patientName}</span>
            </div>

            <div className="detail-row">
              <label>Hospital:</label>
              <span>{selectedAppointment.hospitalName}</span>
            </div>

            <div className="detail-row">
              <label>Department:</label>
              <span>{selectedAppointment.department}</span>
            </div>

            <div className="detail-row">
              <label>Date & Time:</label>
              <span>
                {selectedAppointment.date} at {selectedAppointment.time}
              </span>
            </div>

            <div className="detail-row">
              <label>Phone:</label>
              <span>{selectedAppointment.phone}</span>
            </div>

            <div className="detail-row">
              <label>Email:</label>
              <span>{selectedAppointment.userEmail}</span>
            </div>

            <div className="detail-row">
              <label>Symptoms/Reason:</label>
              <span>{selectedAppointment.notes}</span>
            </div>

            <div className="form-group">
              <label>Current Status:</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Admin Notes:</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes..."
                rows={4}
              />
            </div>

            <div className="modal-buttons">
              <button
                onClick={() => handleStatusUpdate(selectedAppointment.id)}
                className="save-btn"
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="close-btn"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
