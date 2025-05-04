// ==== FILE: src/pages/Dashboard.jsx ====
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css"; // You'll need to create this CSS file

// Mock data - replace with actual API calls in production
const mockRideStats = {
    totalRides: 27,
    balance: 500, // in rupees
};

const mockRecentRides = [
    { id: 1, date: "2023-05-01", pickup: "Connaught Place", dropoff: "India Gate", fare: 120, status: "Completed" },
    { id: 2, date: "2023-04-28", pickup: "Karol Bagh", dropoff: "Chandni Chowk", fare: 150, status: "Completed" },
    { id: 3, date: "2023-04-25", pickup: "Lajpat Nagar", dropoff: "Saket", fare: 200, status: "Cancelled" },
];

const mockFavoriteRoutes = [
    { id: 1, name: "Home to Office", pickup: "Dwarka", dropoff: "Cyber City" },
    { id: 2, name: "Home to Market", pickup: "Dwarka", dropoff: "Saket Mall" },
];

const mockUpcomingBookings = [
    { id: 1, date: "2023-05-10 09:00 AM", pickup: "Home", dropoff: "Office" },
];

function Dashboard() {
    const [weatherData, setWeatherData] = useState(null);
    const [fareEstimate, setFareEstimate] = useState("");
    const [pickupLocation, setPickupLocation] = useState("");
    const [dropoffLocation, setDropoffLocation] = useState("");

    // Fetch weather data - in production, replace with actual API call
    useEffect(() => {
        // Simulating API call
        setTimeout(() => {
            setWeatherData({
                temperature: 32,
                condition: "Sunny",
                humidity: 65,
                aqi: 156, // Air Quality Index
            });
        }, 1000);
    }, []);

    const calculateFare = () => {
        if (pickupLocation && dropoffLocation) {
            // This is a mock calculation - replace with actual logic
            const baseFare = 25;
            const distanceFare = Math.floor(Math.random() * 100) + 50;
            setFareEstimate(`₹${baseFare + distanceFare}`);
        } else {
            alert("Please enter both pickup and drop-off locations");
        }
    };

    const addToFavorites = () => {
        alert("Route added to favorites!");
        // In production, implement actual saving logic
    };

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <p>Welcome back! Manage your rides here.</p>

            <div className="dashboard-grid">
                {/* Ride Statistics */}
                <div className="dashboard-card stats-card">
                    <h2>Ride Statistics</h2>
                    <div className="stat-item">
                        <span>Total Rides</span>
                        <span className="stat-value">{mockRideStats.totalRides}</span>
                    </div>
                </div>

                {/* Wallet Section */}
                <div className="dashboard-card wallet-card">
                    <h2>Wallet</h2>
                    <div className="wallet-balance">
                        <span>Current Balance</span>
                        <span className="balance-amount">₹{mockRideStats.balance}</span>
                    </div>
                    <button className="recharge-button">Recharge Wallet</button>
                </div>

                {/* Weather Widget */}
                <div className="dashboard-card weather-card">
                    <h2>Delhi Weather</h2>
                    {weatherData ? (
                        <div className="weather-info">
                            <div className="weather-main">
                                <span className="temperature">{weatherData.temperature}°C</span>
                                <span className="condition">{weatherData.condition}</span>
                            </div>
                            <div className="weather-details">
                                <div>Humidity: {weatherData.humidity}%</div>
                                <div className={`aqi ${weatherData.aqi > 150 ? 'aqi-poor' : 'aqi-moderate'}`}>
                                    AQI: {weatherData.aqi} {weatherData.aqi > 150 ? '(Mask Recommended)' : ''}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Loading weather data...</p>
                    )}
                </div>

                {/* Fare Estimator */}
                <div className="dashboard-card fare-card">
                    <h2>Fare Estimator</h2>
                    <div className="fare-form">
                        <input
                            type="text"
                            placeholder="Pickup Location"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Drop-off Location"
                            value={dropoffLocation}
                            onChange={(e) => setDropoffLocation(e.target.value)}
                        />
                        <div className="fare-actions">
                            <button onClick={calculateFare}>Calculate Fare</button>
                            <button onClick={addToFavorites} disabled={!pickupLocation || !dropoffLocation}>
                                Save Route
                            </button>
                        </div>
                        {fareEstimate && (
                            <div className="fare-result">
                                Estimated Fare: <span>{fareEstimate}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Rides */}
                <div className="dashboard-card rides-card">
                    <h2>Recent Rides</h2>
                    <div className="rides-list">
                        {mockRecentRides.map((ride) => (
                            <div key={ride.id} className={`ride-item ${ride.status.toLowerCase()}`}>
                                <div className="ride-date">{ride.date}</div>
                                <div className="ride-route">
                                    {ride.pickup} → {ride.dropoff}
                                </div>
                                <div className="ride-details">
                                    <span className="ride-fare">₹{ride.fare}</span>
                                    <span className="ride-status">{ride.status}</span>
                                </div>
                            </div>
                        ))}
                        <Link to="/ride-history" className="view-all-link">
                            View All Rides
                        </Link>
                    </div>
                </div>

                {/* Favorite Routes */}
                <div className="dashboard-card favorites-card">
                    <h2>Favorite Routes</h2>
                    <div className="favorites-list">
                        {mockFavoriteRoutes.map((route) => (
                            <div key={route.id} className="favorite-item">
                                <div className="favorite-name">{route.name}</div>
                                <div className="favorite-route">
                                    {route.pickup} → {route.dropoff}
                                </div>
                                <button className="book-again-button">Book Again</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="dashboard-card upcoming-card">
                    <h2>Upcoming Bookings</h2>
                    <div className="upcoming-list">
                        {mockUpcomingBookings.length > 0 ? (
                            mockUpcomingBookings.map((booking) => (
                                <div key={booking.id} className="upcoming-item">
                                    <div className="upcoming-date">{booking.date}</div>
                                    <div className="upcoming-route">
                                        {booking.pickup} → {booking.dropoff}
                                    </div>
                                    <button className="cancel-button">Cancel</button>
                                </div>
                            ))
                        ) : (
                            <p>No upcoming bookings</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;