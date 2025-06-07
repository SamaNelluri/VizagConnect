import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UnitSelector.css";

function UnitSelector({ selectedUnit, onUnitChange }) {
  const [units, setUnits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUnits() {
      try {
        const response = await fetch("http://localhost:5000/api/request/units");
        if (!response.ok) throw new Error("Failed to fetch units");
        const data = await response.json();
        setUnits(data);
      } catch (err) {
        console.error("Error fetching units:", err);
      }
    }

    fetchUnits();
  }, []);

  const handleChange = (e) => {
    const selected = e.target.value;
    onUnitChange(selected); // Update parent
    localStorage.setItem("selectedUnit", selected); // Store in localStorage
    if (selected) {
      navigate("/raise-request"); // Navigate
    }
  };

  return (
    <div className="unit-selector">
      <label htmlFor="unit-select">Select Unit:</label>
      <select id="unit-select" value={selectedUnit} onChange={handleChange}>
        <option value="">-- Select a unit --</option>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  );
}

export default UnitSelector;
