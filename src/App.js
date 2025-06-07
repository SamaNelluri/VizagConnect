// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import VerifyOtp from "./components/VerifyOtp";
import RaiseRequestForm from "./components/RaiseRequestForm";
import UnitSelectorPage from "./pages/UnitSelectorPage";

function App() {
  const [selectedUnit, setSelectedUnit] = useState("");

  return (
    <Router>
      <Routes>
        {/* Default route: Redirect to Register */}
        <Route path="/" element={<Navigate to="/register" replace />} />

        {/* Registration and Login */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* OTP Verification */}
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Unit Selector page */}
        <Route
          path="/unit-selector"
          element={
            <UnitSelectorPage
              selectedUnit={selectedUnit}
              onUnitChange={setSelectedUnit}
            />
          }
        />

        {/* Raise request form */}
        <Route path="/raise-request" element={<RaiseRequestForm />} />

        {/* Catch-all unknown routes redirect to register */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
