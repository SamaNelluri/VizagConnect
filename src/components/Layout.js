import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import axios from 'axios';
import './Layout.css';

function Layout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (userId) {
      axios.get(`http://localhost:5000/api/auth/${userId}`)
        .then(response => {
          if (response.data.success) {
            setUser(response.data.user);
            console.log("✅ User fetched:", response.data.user);
          } else {
            console.error("⚠️ Failed to fetch user");
          }
        })
        .catch(err => {
          console.error("❌ Error fetching user:", err);
        });
    } else {
      console.warn("⚠️ No userId found in localStorage");
    }
  }, []);

  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : "No recent login";

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="app-title">Vizag Connect</span>
        </div>

        <div className="navbar-center">
          <NavLink to="/unit-selector" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Unit Selector
          </NavLink>
          <NavLink to="/assigned-to-me" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Assigned To Me
          </NavLink>
          <NavLink to="/my-requests" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            My Requests
          </NavLink>
        </div>

        <div className="navbar-right">
          <div className="user-info">
            <div className="user-name">
              Hello, <strong>{user?.firstName || 'User'} {user?.lastName || ''}</strong>
            </div>
            <div className="last-login" title={lastLogin}>
              Last logged in: {lastLogin}
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
