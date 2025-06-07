import React, { useEffect, useState } from "react";

function RequestList({ currentUserId, selectedUnit }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUserId || !selectedUnit) return;

    async function fetchRequests() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/requests/raised-by/${currentUserId}?unit=${selectedUnit}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setRequests(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [currentUserId, selectedUnit]);

  if (!selectedUnit) return <p>Please select a unit first.</p>;
  if (loading) return <p>Loading requests...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Requests Raised by You ({selectedUnit})</h2>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request._id}>
              <strong>{request.description}</strong> - Assigned To: {request.assignedToName} - Status: {request.status} - Age: {request.age} day(s)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RequestList;
