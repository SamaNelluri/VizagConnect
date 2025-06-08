import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyRequestsTab.css"; // You can create styling here

const MyRequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/request/raised-by/${userId}`);
        setRequests(res.data);
      } catch (err) {
        console.error("Failed to fetch requests:", err);
        setError("Could not load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) return <p>Loading your requests...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="my-requests-tab">
      <h2>Requests Raised By Me</h2>
      {requests.length === 0 ? (
        <p>No requests raised yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Assign To</th>
              <th>Task Description</th>
              <th>Raised On</th>
              <th>Age of the Task (Days)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
  {requests.map((req, idx) => (
    <tr key={req._id}>
      <td data-label="S.No.">{idx + 1}</td>
      <td data-label="Assign To">{req.assignTo?.firstName} {req.assignTo?.lastName}</td>
      <td data-label="Task Description">{req.description}</td>
      <td data-label="Raised On">{new Date(req.createdAt).toLocaleString()}</td>
      <td data-label="Age of the Task (Days)">{req.age}</td>
      <td data-label="Status">{req.status}</td>
    </tr>
  ))}
</tbody>

        </table>
      )}
    </div>
  );
};

export default MyRequestsTab;
