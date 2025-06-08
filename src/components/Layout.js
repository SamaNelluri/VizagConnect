import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Layout.css';
import accountIcon from './account.png';

function Layout() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate(); // ✅ for redirect

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      axios.get(`http://localhost:5000/api/auth/${userId}`)
        .then(res => {
          if (res.data.success) setUser(res.data.user);
          else console.error('Failed to fetch user');
        })
        .catch(err => console.error('Error fetching user:', err));
    }
  }, []);

  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : "No recent login";

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout'); // ✅ optional backend call
      localStorage.clear(); // ✅ remove user data
      navigate('/login');   // ✅ redirect to login
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { to: "/unit-selector", label: "Unit Selector" },
    { to: "/assigned-to-me", label: "Assigned To Me" },
    { to: "/my-requests", label: "My Requests" }
  ];

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="app-title">TaskBridge</span>
        </div>

        <div className="navbar-right">
          <img
            src={accountIcon}
            alt="Account"
            className="account-icon"
            onClick={toggleMenu}
          />

          {menuOpen && (
            <div className="user-details-dropdown animated-dropdown">
              <div className="hello-user">
                Hello, <strong>{user ? `${user.firstName} ${user.lastName}` : 'User'}</strong>
              </div>

              <div className="last-login">
                Last logged in: <strong>{lastLogin}</strong>
              </div>

              <nav className="dropdown-nav-links">
                {navLinks.map(({ to, label }, i) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      "dropdown-nav-link" + (isActive ? " active" : "")
                    }
                    style={{ animationDelay: `${0.15 * i}s` }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* ✅ Logout button */}
              <button
                className="logout-button"
                onClick={handleLogout}
                style={{ animationDelay: `${0.15 * navLinks.length}s` }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
