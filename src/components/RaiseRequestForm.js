import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RaiseRequestForm.css";

const RaiseRequestForm = () => {
  const [userId, setUserId] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unit, setUnit] = useState("");

  const navigate = useNavigate(); // 👈 initialize router navigation

  // Get userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Get selected unit from localStorage
  useEffect(() => {
    const storedUnit = localStorage.getItem("selectedUnit");
    if (storedUnit) {
      setUnit(storedUnit);
    }
  }, []);

  // Fetch employee suggestions
  useEffect(() => {
    if (searchTerm.length < 1 || !unit) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/request/assign-to/search/${encodeURIComponent(searchTerm)}?unit=${encodeURIComponent(unit)}`
        );
        setSuggestions(res.data);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, unit]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("User not authenticated. Please log in.");
      return;
    }

    if (!assignTo || !description) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/request/raise", {
        assignBy: userId,
        assignTo,
        unit,
        description,
      });

      setMessage(response.data.msg || "Request raised successfully");
      setError("");
      setAssignTo("");
      setDescription("");
      setSearchTerm("");
      setSuggestions([]);

      // 👇 Navigate to MyRequestsTab after 1s
      setTimeout(() => navigate("/my-requests"), 1000);
    } catch (err) {
      console.error("Request error:", err);
      setError(err.response?.data?.msg || "Failed to raise request");
    }
  };

  return (
    <div className="raise-request-form">
      <h2>Raise a Request</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="assignTo">Assign To</label>
        <input
          type="text"
          value={searchTerm}
          placeholder="Type employee name..."
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setAssignTo("");
          }}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((emp) => (
              <li
                key={emp._id}
                onClick={() => {
                  setAssignTo(emp._id);
                  setSearchTerm(`${emp.firstName} ${emp.lastName}`);
                  setSuggestions([]);
                }}
              >
                {emp.firstName} {emp.lastName} ({emp.email})
              </li>
            ))}
          </ul>
        )}

        <label htmlFor="description">Task Description</label>
        <textarea
          id="description"
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task details (max 100 chars)"
        />

        <button type="submit">Submit Request</button>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </form>
    </div>
  );
};

export default RaiseRequestForm;
