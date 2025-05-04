// ==== FILE: src/pages/PassengerHome.jsx ====
import React from "react";  // Correct
import { Link } from "react-router-dom";

const PassengerHome = () => {
    return (
        <div className="page-container">
            <h2>Welcome, Passenger!</h2>
            <p>Need a ride? Book your e-rickshaw in just a few taps.</p>

            <Link to="/booking">
                <button className="cta-button">Book a Ride</button>
            </Link>

            <Link to="/history">
                <button className="cta-button">View Ride History</button>
            </Link>
        </div>
    );
};

export default PassengerHome;
 