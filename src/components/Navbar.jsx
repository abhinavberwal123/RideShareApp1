// ==== FILE: src/components/Navbar.jsx ====
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/rickshaw-logo.png"; // Import your logo file

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <nav className="navbar">
            <Link to="/" className="logo-container">
                <img src={logo} alt="E-Rickshaw Logo" className="logo-image" />
                <span className="logo-text">E-Rickshaw</span>
            </Link>
            <div className="menu-icon" onClick={toggleMenu}>
                {menuOpen ? "✖" : "☰"}
            </div>
            <div className={`nav-links ${menuOpen ? "active" : ""}`}>
                <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link to="/signin" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/driver-dashboard" onClick={() => setMenuOpen(false)}>Driver Dashboard</Link>
                <Link to="/edit-profile" onClick={() => setMenuOpen(false)}>Edit Profile</Link>
                <Link to="/admin-panel" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
            </div>
        </nav>
    );
};

export default Navbar;