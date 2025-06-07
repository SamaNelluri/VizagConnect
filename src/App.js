// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import VerifyOtp from "./components/VerifyOtp";
import RaiseRequestForm from "./components/RaiseRequestForm";
import UnitSelectorPage from "./pages/UnitSelectorPage";
import AssignedToMeTab from "./components/AssignedToMeTab";
import MyRequestsTab from "./components/MyRequestsTab";
import Layout from "./components/Layout";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

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

        {/* Layout-protected routes */}
        <Route path="/" element={<Layout user={user} />}>
          <Route path="unit-selector" element={<UnitSelectorPage />} />
          <Route path="raise-request" element={<RaiseRequestForm />} />
          
          {/* Tabs for Assigned to Me and My Requests */}
          <Route path="assigned-to-me" element={<AssignedToMeTab />} />
          <Route path="my-requests" element={<MyRequestsTab />} />
        </Route>

        {/* Catch-all unknown routes redirect to register */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
