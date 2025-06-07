import React, { useEffect, useState } from "react";
import axios from "axios";
import './AssignedToMeTab.css';

const statusOptions = ["Yet to Start", "In Progress", "Completed"];

const AssignedToMeTab = () => {
const [requests, setRequests] = useState([]);
const [statusUpdates, setStatusUpdates] = useState({});
const [message, setMessage] = useState("");

const userId = localStorage.getItem("userId");

useEffect(() => {
if (userId) {
fetchAssignedRequests();
}
}, [userId]);

const fetchAssignedRequests = async () => {
try {
const res = await axios.get(`http://localhost:5000/api/request/assigned-to/${userId}`);
setRequests(res.data);
} catch (error) {
console.error("Error fetching assigned requests", error);
}
};

const handleStatusChange = (id, newStatus) => {
setStatusUpdates((prev) => ({ ...prev, [id]: newStatus }));
};

const handleSubmit = async (id) => {
const status = statusUpdates[id];
if (!status) return;

try {
  const res = await axios.put(`http://localhost:5000/api/request/status/${id}`, {
    status,
  });
  setMessage("Status updated successfully");
  fetchAssignedRequests();
  setTimeout(() => setMessage(""), 2000);
} catch (error) {
  console.error("Error updating status", error);
  setMessage("Failed to update status");
}
};

return (
<div className="assigned-to-me-tab">
<h2>Requests Assigned to Me</h2>
{message && <p style={{ color: "green" }}>{message}</p>}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Unit</th>
        <th>Assigned By</th>
        <th>Current Status</th>
        <th>Update Status</th>
      </tr>
    </thead>
    <tbody>
      {requests.map((req) => (
        <tr key={req._id}>
          <td>{req.description}</td>
          <td>{req.unit}</td>
          <td>{req.assignBy?.firstName} {req.assignBy?.lastName}</td>
          <td>{req.status}</td>
          <td>
            <select
              value={statusUpdates[req._id] || req.status}
              onChange={(e) => handleStatusChange(req._id, e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button onClick={() => handleSubmit(req._id)}>Submit</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
);
};
export default AssignedToMeTab;