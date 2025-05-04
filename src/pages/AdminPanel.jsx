// ==== FILE: src/pages/AdminPanel.jsx ====
import { useState, useEffect } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
import "../styles/AdminPanel.css";
import { useCollection } from "../hooks/useFirestore";
import { useFirestoreOperations } from "../hooks/useFirestore";

// Register Chart.js components
Chart.register(...registerables);

// Initial state for stats
const initialStats = {
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    activeComplaints: 0
};

// We'll use real data from Firestore instead of mock data

// We'll use real data from Firestore instead of mock complaints

// Default zones in case Firestore doesn't have any
const defaultZones = [
    { id: "zone1", name: "Central Delhi", baseFare: 25, perKmRate: 8, peakMultiplier: 1.5 },
    { id: "zone2", name: "North Delhi", baseFare: 20, perKmRate: 7, peakMultiplier: 1.4 },
    { id: "zone3", name: "South Delhi", baseFare: 30, perKmRate: 9, peakMultiplier: 1.6 },
    { id: "zone4", name: "East Delhi", baseFare: 20, perKmRate: 7, peakMultiplier: 1.4 },
    { id: "zone5", name: "West Delhi", baseFare: 25, perKmRate: 8, peakMultiplier: 1.5 },
];

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedZone, setSelectedZone] = useState(1);
    const [zoneRates, setZoneRates] = useState([]);
    const [stats, setStats] = useState(initialStats);
    const [revenueData, setRevenueData] = useState(null);
    const [rideData, setRideData] = useState(null);
    const [peakHoursData, setPeakHoursData] = useState(null);
    const [popularRoutesData, setPopularRoutesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use Firestore hooks to fetch data
    const { documents: users, loading: usersLoading } = useCollection('users');
    const { documents: drivers, loading: driversLoading } = useCollection('drivers', {
        filters: [{ field: 'status', operator: '==', value: 'active' }]
    });
    const { documents: pendingDrivers, loading: pendingDriversLoading } = useCollection('drivers', {
        filters: [{ field: 'status', operator: '==', value: 'pending' }]
    });
    const { documents: rides, loading: ridesLoading } = useCollection('rides');
    const { documents: complaints, loading: complaintsLoading } = useCollection('complaints', {
        filters: [{ field: 'status', operator: '!=', value: 'resolved' }]
    });
    const { documents: zones, loading: zonesLoading } = useCollection('zones');

    // Firestore operations for updating data
    const { updateDocument } = useFirestoreOperations();

    // Calculate stats from Firestore data
    useEffect(() => {
        if (!usersLoading && !driversLoading && !pendingDriversLoading && !ridesLoading && !complaintsLoading) {
            // Calculate total revenue
            const totalRevenue = rides?.reduce((sum, ride) => {
                return sum + (ride.fare || 0);
            }, 0) || 0;

            setStats({
                totalUsers: users?.length || 0,
                totalDrivers: drivers?.length || 0,
                totalRides: rides?.length || 0,
                totalRevenue,
                pendingVerifications: pendingDrivers?.length || 0,
                activeComplaints: complaints?.length || 0
            });

            setLoading(false);
        }
    }, [users, drivers, pendingDrivers, rides, complaints, usersLoading, driversLoading, pendingDriversLoading, ridesLoading, complaintsLoading]);

    // Prepare chart data
    useEffect(() => {
        if (!ridesLoading && rides?.length > 0) {
            // Group rides by month for revenue and ride count charts
            const monthlyData = groupRidesByMonth(rides);

            // Revenue data
            setRevenueData({
                labels: Object.keys(monthlyData),
                datasets: [
                    {
                        label: 'Revenue (₹)',
                        data: Object.values(monthlyData).map(month => month.revenue),
                        fill: false,
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                    },
                ],
            });

            // Ride data
            setRideData({
                labels: Object.keys(monthlyData),
                datasets: [
                    {
                        label: 'Rides Completed',
                        data: Object.values(monthlyData).map(month => month.count),
                        backgroundColor: '#2196F3',
                    },
                ],
            });

            // Peak hours data
            const hourlyData = groupRidesByHour(rides);
            setPeakHoursData({
                labels: Object.keys(hourlyData),
                datasets: [
                    {
                        label: 'Ride Requests',
                        data: Object.values(hourlyData),
                        backgroundColor: '#FF9800',
                    },
                ],
            });

            // Popular routes data
            const routesData = getPopularRoutes(rides);
            setPopularRoutesData({
                labels: routesData.map(route => route.name),
                datasets: [
                    {
                        label: 'Popularity',
                        data: routesData.map(route => route.count),
                        backgroundColor: [
                            '#4CAF50',
                            '#2196F3',
                            '#FF9800',
                            '#F44336',
                            '#9C27B0',
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        }
    }, [rides, ridesLoading]);

    // Load zone rates
    useEffect(() => {
        if (!zonesLoading) {
            if (zones?.length > 0) {
                setZoneRates(zones);
                if (!selectedZone && zones.length > 0) {
                    setSelectedZone(zones[0].id);
                }
            } else {
                // If no zones in Firestore, use default zones
                console.log("No zones found in Firestore, using default zones");
                setZoneRates(defaultZones);
                if (!selectedZone && defaultZones.length > 0) {
                    setSelectedZone(defaultZones[0].id);
                }
            }
        }
    }, [zones, zonesLoading, selectedZone, defaultZones]);

    // Helper function to group rides by month
    const groupRidesByMonth = (rides) => {
        const months = {};

        rides.forEach(ride => {
            if (!ride.createdAt) return;

            const date = new Date(ride.createdAt.seconds ? ride.createdAt.seconds * 1000 : ride.createdAt);
            const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            if (!months[monthYear]) {
                months[monthYear] = { count: 0, revenue: 0 };
            }

            months[monthYear].count += 1;
            months[monthYear].revenue += (ride.fare || 0);
        });

        return months;
    };

    // Helper function to group rides by hour
    const groupRidesByHour = (rides) => {
        const hours = {
            '6-8 AM': 0,
            '8-10 AM': 0,
            '10-12 PM': 0,
            '12-2 PM': 0,
            '2-4 PM': 0,
            '4-6 PM': 0,
            '6-8 PM': 0,
            '8-10 PM': 0
        };

        rides.forEach(ride => {
            if (!ride.createdAt) return;

            const date = new Date(ride.createdAt.seconds ? ride.createdAt.seconds * 1000 : ride.createdAt);
            const hour = date.getHours();

            if (hour >= 6 && hour < 8) hours['6-8 AM']++;
            else if (hour >= 8 && hour < 10) hours['8-10 AM']++;
            else if (hour >= 10 && hour < 12) hours['10-12 PM']++;
            else if (hour >= 12 && hour < 14) hours['12-2 PM']++;
            else if (hour >= 14 && hour < 16) hours['2-4 PM']++;
            else if (hour >= 16 && hour < 18) hours['4-6 PM']++;
            else if (hour >= 18 && hour < 20) hours['6-8 PM']++;
            else if (hour >= 20 && hour < 22) hours['8-10 PM']++;
        });

        return hours;
    };

    // Helper function to get popular routes
    const getPopularRoutes = (rides) => {
        const routes = {};

        rides.forEach(ride => {
            if (!ride.pickup || !ride.destination) return;

            const routeName = `${ride.pickup} → ${ride.destination}`;

            if (!routes[routeName]) {
                routes[routeName] = 0;
            }

            routes[routeName]++;
        });

        // Convert to array and sort by count
        return Object.entries(routes)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 routes
    };

    // Filter users based on search term
    const filteredUsers = users?.filter(user =>
        (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || '').includes(searchTerm)
    ) || [];

    const handleZoneRateChange = (id, field, value) => {
        const updatedZones = zoneRates.map(zone =>
            zone.id === id ? { ...zone, [field]: parseFloat(value) } : zone
        );
        setZoneRates(updatedZones);
    };

    const handleSaveRates = async () => {
        try {
            // Find the selected zone
            const selectedZoneData = zoneRates.find(zone => zone.id === selectedZone);

            if (!selectedZoneData) {
                setError("Selected zone not found");
                return;
            }

            // Update the zone in Firestore
            await updateDocument('zones', selectedZoneData.id, {
                baseFare: selectedZoneData.baseFare,
                perKmRate: selectedZoneData.perKmRate,
                peakMultiplier: selectedZoneData.peakMultiplier,
                updatedAt: new Date()
            });

            alert("Fare rates updated successfully!");
        } catch (err) {
            console.error("Error updating fare rates:", err);
            setError(`Failed to update fare rates: ${err.message}`);
        }
    };

    const handleVerifyDriver = async (userId) => {
        try {
            // Update driver status in Firestore
            await updateDocument('drivers', userId, {
                status: 'active',
                verifiedAt: new Date(),
                updatedAt: new Date()
            });

            alert(`Driver ID ${userId} verified successfully!`);
        } catch (err) {
            console.error("Error verifying driver:", err);
            setError(`Failed to verify driver: ${err.message}`);
        }
    };

    const handleRejectDriver = async (userId) => {
        try {
            // Update driver status in Firestore
            await updateDocument('drivers', userId, {
                status: 'rejected',
                rejectedAt: new Date(),
                updatedAt: new Date()
            });

            alert(`Driver ID ${userId} rejected successfully!`);
        } catch (err) {
            console.error("Error rejecting driver:", err);
            setError(`Failed to reject driver: ${err.message}`);
        }
    };

    const handleResolveComplaint = async (complaintId) => {
        try {
            // Update complaint status in Firestore
            await updateDocument('complaints', complaintId, {
                status: 'resolved',
                resolvedAt: new Date(),
                updatedAt: new Date()
            });

            alert(`Complaint ID ${complaintId} marked as resolved!`);
        } catch (err) {
            console.error("Error resolving complaint:", err);
            setError(`Failed to resolve complaint: ${err.message}`);
        }
    };

    // User management functions
    const handleViewUser = (userId) => {
        // In a real implementation, you might navigate to a user details page
        // or open a modal with user details
        alert(`Viewing user details for ID: ${userId}`);

        // For demonstration, we'll just log the user ID
        console.log(`Viewing user details for ID: ${userId}`);
    };

    const handleEditUser = (userId) => {
        // In a real implementation, you might navigate to a user edit page
        // or open a modal with a form to edit user details
        alert(`Editing user with ID: ${userId}`);

        // For demonstration, we'll just log the user ID
        console.log(`Editing user with ID: ${userId}`);
    };

    const handleToggleUserStatus = async (userId, activate) => {
        try {
            // Update user status in Firestore
            await updateDocument('users', userId, {
                status: activate ? 'active' : 'inactive',
                disabled: !activate,
                updatedAt: new Date()
            });

            alert(`User ${userId} ${activate ? 'activated' : 'deactivated'} successfully!`);
        } catch (err) {
            console.error(`Error ${activate ? 'activating' : 'deactivating'} user:`, err);
            setError(`Failed to ${activate ? 'activate' : 'deactivate'} user: ${err.message}`);
        }
    };

    return (
        <div className="admin-panel-container">
            <h2>Admin Panel</h2>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                >
                    Dashboard
                </button>
                <button
                    className={`tab-button ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    User Management
                </button>
                <button
                    className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
                    onClick={() => setActiveTab("analytics")}
                >
                    Ride Analytics
                </button>
                <button
                    className={`tab-button ${activeTab === "fares" ? "active" : ""}`}
                    onClick={() => setActiveTab("fares")}
                >
                    Fare Management
                </button>
                <button
                    className={`tab-button ${activeTab === "verification" ? "active" : ""}`}
                    onClick={() => setActiveTab("verification")}
                >
                    Driver Verification
                </button>
                <button
                    className={`tab-button ${activeTab === "complaints" ? "active" : ""}`}
                    onClick={() => setActiveTab("complaints")}
                >
                    Complaints
                </button>
                <button
                    className={`tab-button ${activeTab === "reports" ? "active" : ""}`}
                    onClick={() => setActiveTab("reports")}
                >
                    Reports
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
                <div className="admin-section">
                    <h3>Dashboard Overview</h3>

                    {loading ? (
                        <div className="loading-indicator">Loading dashboard data...</div>
                    ) : error ? (
                        <div className="error-message">Error loading data: {error}</div>
                    ) : (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{stats.totalUsers}</div>
                                    <div className="stat-label">Total Users</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-value">{stats.totalDrivers}</div>
                                    <div className="stat-label">Total Drivers</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-value">{stats.totalRides}</div>
                                    <div className="stat-label">Total Rides</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                                    <div className="stat-label">Total Revenue</div>
                                </div>

                                <div className="stat-card alert">
                                    <div className="stat-value">{stats.pendingVerifications}</div>
                                    <div className="stat-label">Pending Verifications</div>
                                </div>

                                <div className="stat-card alert">
                                    <div className="stat-value">{stats.activeComplaints}</div>
                                    <div className="stat-label">Active Complaints</div>
                                </div>
                            </div>

                            <div className="chart-grid">
                                <div className="chart-card">
                                    <h4>Revenue Trend</h4>
                                    {revenueData ? (
                                        <Line data={revenueData} />
                                    ) : (
                                        <div className="no-data-message">No revenue data available</div>
                                    )}
                                </div>

                                <div className="chart-card">
                                    <h4>Rides Completed</h4>
                                    {rideData ? (
                                        <Bar data={rideData} />
                                    ) : (
                                        <div className="no-data-message">No ride data available</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === "users" && (
                <div className="admin-section">
                    <h3>User Management</h3>

                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Rides</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usersLoading ? (
                                <tr>
                                    <td colSpan="8" className="loading-indicator">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => {
                                    // Determine if user is a driver or passenger
                                    const isDriver = user.isDriver || user.vehicleInfo;
                                    const userStatus = user.status || (user.disabled ? 'Inactive' : 'Active');
                                    const rideCount = user.totalRides || 0;

                                    return (
                                        <tr key={user.id}>
                                            <td>{user.id.substring(0, 8)}...</td>
                                            <td>{user.displayName || user.name || 'Unknown'}</td>
                                            <td>{user.email || 'No email'}</td>
                                            <td>{user.phone || 'No phone'}</td>
                                            <td>{isDriver ? 'Driver' : 'Passenger'}</td>
                                            <td>
                                                <span className={`status-badge ${userStatus.toLowerCase().replace(' ', '-')}`}>
                                                    {userStatus}
                                                </span>
                                            </td>
                                            <td>{rideCount}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="view-button"
                                                        onClick={() => handleViewUser(user.id)}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="edit-button"
                                                        onClick={() => handleEditUser(user.id)}
                                                    >
                                                        Edit
                                                    </button>
                                                    {userStatus === "Active" ? (
                                                        <button 
                                                            className="block-button"
                                                            onClick={() => handleToggleUserStatus(user.id, false)}
                                                        >
                                                            Block
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="activate-button"
                                                            onClick={() => handleToggleUserStatus(user.id, true)}
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="empty-message">No users found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ride Analytics Tab */}
            {activeTab === "analytics" && (
                <div className="admin-section">
                    <h3>Ride Analytics</h3>

                    {loading ? (
                        <div className="loading-indicator">Loading analytics data...</div>
                    ) : error ? (
                        <div className="error-message">Error loading data: {error}</div>
                    ) : (
                        <div className="chart-grid">
                            <div className="chart-card">
                                <h4>Peak Hours</h4>
                                {peakHoursData ? (
                                    <Bar data={peakHoursData} />
                                ) : (
                                    <div className="no-data-message">No peak hours data available</div>
                                )}
                            </div>

                            <div className="chart-card">
                                <h4>Popular Routes</h4>
                                {popularRoutesData ? (
                                    <Pie data={popularRoutesData} />
                                ) : (
                                    <div className="no-data-message">No popular routes data available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fare Management Tab */}
            {activeTab === "fares" && (
                <div className="admin-section">
                    <h3>Fare Management</h3>

                    <div className="zone-selector">
                        <label>Select Zone</label>
                        <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(parseInt(e.target.value))}
                        >
                            {zoneRates.map(zone => (
                                <option key={zone.id} value={zone.id}>{zone.name}</option>
                            ))}
                        </select>
                    </div>

                    {zoneRates
                        .filter(zone => zone.id === selectedZone)
                        .map(zone => (
                            <div key={zone.id} className="fare-form">
                                <div className="form-group">
                                    <label>Base Fare (₹)</label>
                                    <input
                                        type="number"
                                        value={zone.baseFare}
                                        onChange={(e) => handleZoneRateChange(zone.id, 'baseFare', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Per Kilometer Rate (₹)</label>
                                    <input
                                        type="number"
                                        value={zone.perKmRate}
                                        onChange={(e) => handleZoneRateChange(zone.id, 'perKmRate', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Peak Hour Multiplier</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={zone.peakMultiplier}
                                        onChange={(e) => handleZoneRateChange(zone.id, 'peakMultiplier', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}

                    <button className="save-button" onClick={handleSaveRates}>
                        Save Fare Changes
                    </button>
                </div>
            )}

            {/* Driver Verification Tab */}
            {activeTab === "verification" && (
                <div className="admin-section">
                    <h3>Driver Verification</h3>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Documents</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pendingDriversLoading ? (
                                <tr>
                                    <td colSpan="6" className="loading-indicator">Loading pending drivers...</td>
                                </tr>
                            ) : pendingDrivers && pendingDrivers.length > 0 ? (
                                pendingDrivers.map((driver) => (
                                    <tr key={driver.id}>
                                        <td>{driver.id}</td>
                                        <td>{driver.displayName || driver.name || 'Unknown'}</td>
                                        <td>{driver.phone || 'No phone'}</td>
                                        <td>
                                            <button 
                                                className="view-button"
                                                onClick={() => window.open(driver.documentUrl || '#', '_blank')}
                                                disabled={!driver.documentUrl}
                                            >
                                                View Documents
                                            </button>
                                        </td>
                                        <td>
                                            <span className="status-badge pending-verification">
                                                Pending Verification
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="verify-button"
                                                    onClick={() => handleVerifyDriver(driver.id)}
                                                >
                                                    Verify
                                                </button>
                                                <button 
                                                    className="reject-button"
                                                    onClick={() => handleRejectDriver(driver.id)}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-message">No pending driver verifications</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Complaints Tab */}
            {activeTab === "complaints" && (
                <div className="admin-section">
                    <h3>Complaint Resolution</h3>

                    <div className="complaints-list">
                        {complaintsLoading ? (
                            <div className="loading-indicator">Loading complaints...</div>
                        ) : complaints && complaints.length > 0 ? (
                            complaints.map((complaint) => (
                                <div key={complaint.id} className="complaint-item">
                                    <div className="complaint-header">
                                        <span className="complaint-user">{complaint.userName || 'Anonymous'}</span>
                                        <span className="complaint-date">
                                            {complaint.createdAt ? new Date(complaint.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                                        </span>
                                    </div>
                                    <div className="complaint-subject">{complaint.subject || complaint.title || 'No subject'}</div>
                                    <div className="complaint-message">{complaint.message || complaint.description || 'No description'}</div>
                                    <span className={`complaint-status ${(complaint.status || '').toLowerCase().replace(' ', '-')}`}>
                                        {complaint.status || 'Open'}
                                    </span>

                                    {complaint.status !== "resolved" && (
                                        <button
                                            className="resolve-button"
                                            onClick={() => handleResolveComplaint(complaint.id)}
                                        >
                                            Mark as Resolved
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="empty-message">No active complaints</div>
                        )}
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
                <div className="admin-section">
                    <h3>Revenue Reports</h3>

                    <div className="report-actions">
                        <div className="date-range">
                            <label>Date Range</label>
                            <select>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        <div className="report-buttons">
                            <button className="generate-button">Generate Report</button>
                            <button className="export-button">Export as CSV</button>
                        </div>
                    </div>

                    <div className="report-summary">
                        <div className="summary-card">
                            <div className="summary-value">₹{stats.totalRevenue.toLocaleString()}</div>
                            <div className="summary-label">Total Revenue</div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-value">{stats.totalRides.toLocaleString()}</div>
                            <div className="summary-label">Total Rides</div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-value">₹{stats.totalRides > 0 ? Math.round(stats.totalRevenue / stats.totalRides) : 0}</div>
                            <div className="summary-label">Average Fare</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
