// ==== FILE: src/pages/DriverDashboard.jsx ====
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import "../styles/DriverDashboard.css"; // You'll need to create this CSS file

// Register Chart.js components
Chart.register(...registerables);

// Initialize with empty data - will be populated from database
const emptyEarnings = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    dailyData: [
        { day: "Mon", amount: 0 },
        { day: "Tue", amount: 0 },
        { day: "Wed", amount: 0 },
        { day: "Thu", amount: 0 },
        { day: "Fri", amount: 0 },
        { day: "Sat", amount: 0 },
        { day: "Sun", amount: 0 },
    ],
};

const emptyRideRequests = [];

const emptyDocuments = [];

const DriverDashboard = () => {
    const [isActive, setIsActive] = useState(true);
    const [queuePosition, setQueuePosition] = useState(3);
    const [fuelEfficiency, setFuelEfficiency] = useState(28); // km per liter

    // Chart data
    const chartData = {
        labels: emptyEarnings.dailyData.map(item => item.day),
        datasets: [
            {
                label: 'Daily Earnings (₹)',
                data: emptyEarnings.dailyData.map(item => item.amount),
                fill: false,
                backgroundColor: '#4CAF50',
                borderColor: '#4CAF50',
            },
        ],
    };

    const chartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Earnings (₹)'
                }
            }
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Weekly Earnings'
            }
        }
    };

    const toggleActiveStatus = () => {
        setIsActive(!isActive);
        // In production, send this status to your backend
    };

    const acceptRide = (rideId) => {
        alert(`Ride ${rideId} accepted!`);
        // In production, implement actual ride acceptance logic
    };

    const rejectRide = (rideId) => {
        alert(`Ride ${rideId} rejected!`);
        // In production, implement actual ride rejection logic
    };

    return (
        <div className="driver-dashboard-container">
            <div className="driver-header">
                <h2>Driver Dashboard</h2>
                <div className="status-toggle">
                    <span>Status:</span>
                    <button
                        className={`toggle-button ${isActive ? 'active' : 'inactive'}`}
                        onClick={toggleActiveStatus}
                    >
                        {isActive ? 'ONLINE' : 'OFFLINE'}
                    </button>
                </div>
            </div>

            <div className="driver-dashboard-grid">
                {/* Earnings Overview */}
                <div className="dashboard-card earnings-card">
                    <h3>Earnings Overview</h3>
                    <div className="earnings-summary">
                        <div className="earning-item">
                            <span>Today</span>
                            <span className="earning-amount">₹{emptyEarnings.daily}</span>
                        </div>
                        <div className="earning-item">
                            <span>This Week</span>
                            <span className="earning-amount">₹{emptyEarnings.weekly}</span>
                        </div>
                        <div className="earning-item">
                            <span>This Month</span>
                            <span className="earning-amount">₹{emptyEarnings.monthly}</span>
                        </div>
                    </div>
                    <div className="earnings-chart">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Queue Status */}
                <div className="dashboard-card queue-card">
                    <h3>Queue Status</h3>
                    <div className="queue-info">
                        <div className="queue-position">
                            <span>Your Position</span>
                            <span className="position-number">{queuePosition}</span>
                        </div>
                        <p>Estimated wait time: {queuePosition * 5} minutes</p>
                        <div className="queue-actions">
                            <button className="leave-queue-button">Leave Queue</button>
                        </div>
                    </div>
                </div>

                {/* Heat Map */}
                <div className="dashboard-card heatmap-card">
                    <h3>Demand Heat Map</h3>
                    <div className="heatmap-container">
                        <img src="https://via.placeholder.com/400x300?text=Delhi+Heat+Map" alt="Delhi Heat Map" className="heatmap-image" />
                        <div className="heatmap-legend">
                            <div className="legend-item">
                                <span className="legend-color high"></span>
                                <span>High Demand</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color medium"></span>
                                <span>Medium Demand</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color low"></span>
                                <span>Low Demand</span>
                            </div>
                        </div>
                    </div>
                    <button className="navigate-button">Navigate to Hotspot</button>
                </div>

                {/* Ride Requests */}
                <div className="dashboard-card requests-card">
                    <h3>Incoming Ride Requests</h3>
                    {isActive ? (
                        <div className="requests-list">
                            {emptyRideRequests.length > 0 ? (
                                emptyRideRequests.map((request) => (
                                    <div key={request.id} className="request-item">
                                        <div className="request-passenger">{request.passenger}</div>
                                        <div className="request-route">
                                            {request.pickup} → {request.dropoff}
                                        </div>
                                        <div className="request-details">
                                            <span>₹{request.fare}</span>
                                            <span>{request.distance}</span>
                                            <span>{request.time}</span>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="accept-button"
                                                onClick={() => acceptRide(request.id)}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="reject-button"
                                                onClick={() => rejectRide(request.id)}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-requests">No incoming requests at the moment</p>
                            )}
                        </div>
                    ) : (
                        <p className="offline-message">You are currently offline. Go online to receive ride requests.</p>
                    )}
                </div>

                {/* Fuel Efficiency */}
                <div className="dashboard-card fuel-card">
                    <h3>Fuel Efficiency Tracker</h3>
                    <div className="fuel-efficiency">
                        <span>Current Efficiency</span>
                        <span className="efficiency-value">{fuelEfficiency} km/L</span>
                    </div>
                    <div className="efficiency-tips">
                        <h4>Optimization Tips:</h4>
                        <ul>
                            <li>Maintain steady speed between 40-60 km/h</li>
                            <li>Check tire pressure regularly</li>
                            <li>Avoid rapid acceleration and braking</li>
                            <li>Service your auto-rickshaw regularly</li>
                        </ul>
                    </div>
                    <button className="log-refuel-button">Log Refueling</button>
                </div>

                {/* Document Expiry */}
                <div className="dashboard-card documents-card">
                    <h3>Document Expiry Alerts</h3>
                    <div className="documents-list">
                        {emptyDocuments.length > 0 ? (
                            emptyDocuments.map((doc) => {
                                const expiryDate = new Date(doc.expiryDate);
                                const today = new Date();
                                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                                return (
                                    <div
                                        key={doc.id}
                                        className={`document-item ${daysUntilExpiry <= 30 ? 'expiring-soon' : ''}`}
                                    >
                                        <div className="document-name">{doc.name}</div>
                                        <div className="document-expiry">
                                            Expires: {doc.expiryDate}
                                            {daysUntilExpiry <= 30 && (
                                                <span className="expiry-alert">
                            ({daysUntilExpiry} days left)
                          </span>
                                            )}
                                        </div>
                                        <button className="renew-button">Renew Now</button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-documents">No documents added yet. Add your documents for verification.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
