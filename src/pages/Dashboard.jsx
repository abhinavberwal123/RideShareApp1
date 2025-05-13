// ==== FILE: src/pages/Dashboard.jsx ====
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css"; // You'll need to create this CSS file
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Initialize with empty data - will be populated from database
const emptyRideStats = {
    totalRides: 0,
    balance: 0, // in rupees
};

const emptyRecentRides = [];

const emptyFavoriteRoutes = [];

// Mock data for available drivers
const availableDrivers = [
    { id: 1, name: "Rajesh Kumar", rating: 4.8, distance: "1.2 km", eta: "5 min" },
    { id: 2, name: "Amit Singh", rating: 4.6, distance: "2.5 km", eta: "8 min" },
    { id: 3, name: "Priya Sharma", rating: 4.9, distance: "3.1 km", eta: "12 min" },
];

function Dashboard() {
    const [weatherData, setWeatherData] = useState(null);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [currentBookings, setCurrentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);

    // Fetch bookings from Firestore
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                    console.log("User not logged in");
                    setLoading(false);
                    return;
                }

                const bookingsRef = collection(db, "bookings");
                const q = query(
                    bookingsRef,
                    where("userId", "==", user.uid),
                    where("status", "==", "upcoming"),
                    orderBy("createdAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                const allBookings = [];

                querySnapshot.forEach((doc) => {
                    allBookings.push({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().scheduledTime === "Now" 
                            ? "Today" 
                            : new Date(doc.data().scheduledTime).toLocaleDateString()
                    });
                });

                // Separate bookings into current and upcoming
                const current = [];
                const upcoming = [];

                allBookings.forEach(booking => {
                    if (booking.scheduledTime === "Now") {
                        current.push(booking);
                    } else {
                        upcoming.push(booking);
                    }
                });

                setCurrentBookings(current);
                setUpcomingBookings(upcoming);
                console.log("Fetched current bookings:", current);
                console.log("Fetched upcoming bookings:", upcoming);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);


    // Fetch wallet balance from Firestore
    useEffect(() => {
        const fetchWalletBalance = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                    console.log("User not logged in");
                    return;
                }

                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setWalletBalance(userData.walletBalance || 0);
                }
            } catch (error) {
                console.error("Error fetching wallet balance:", error);
            }
        };

        fetchWalletBalance();
    }, []);

    // Fetch real-time weather data from OpenWeatherMap API
    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                // Delhi coordinates
                const lat = 28.6139;
                const lon = 77.2090;

                // Use the OpenWeatherMap API key from our configuration
                const weatherApiKey = "AIzaSyAvcuVKQfKOpNMOEdWqUAQs8nGX7MsFs1A";

                console.log("Fetching weather data...");
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
                );

                if (!response.ok) {
                    throw new Error("Weather data fetch failed");
                }

                const data = await response.json();
                console.log("Weather data fetched successfully:", data);

                // Also fetch air quality data
                const airQualityApiKey = "AIzaSyDVoIX1qi3UHUF9EGEIGjkLkSPyz5HoFts";
                const aqiResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${airQualityApiKey}`
                );

                if (!aqiResponse.ok) {
                    throw new Error("AQI data fetch failed");
                }

                const aqiData = await aqiResponse.json();
                console.log("AQI data fetched successfully:", aqiData);

                setWeatherData({
                    temperature: Math.round(data.main.temp),
                    condition: data.weather[0].main,
                    humidity: data.main.humidity,
                    aqi: aqiData.list[0].main.aqi * 50, // Convert AQI scale (0-5) to approximate AQI value
                });
            } catch (error) {
                console.error("Error fetching weather data:", error);
                // Provide more meaningful fallback data
                setWeatherData({
                    temperature: 28,
                    condition: "Sunny",
                    humidity: 65,
                    aqi: 120,
                });
            }
        };

        fetchWeatherData();
    }, []);


    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <p>Welcome back! Manage your rides here.</p>

            <div className="book-ride-container">
                <Link to="/booking" className="book-ride-button">Book a Ride</Link>
            </div>

            <div className="dashboard-grid">
                {/* Ride Statistics */}
                <div className="dashboard-card stats-card">
                    <h2>Ride Statistics</h2>
                    <div className="stat-item">
                        <span>Total Rides</span>
                        <span className="stat-value">{emptyRideStats.totalRides}</span>
                    </div>
                </div>

                {/* Wallet Section */}
                <div className="dashboard-card wallet-card">
                    <h2>Wallet</h2>
                    <div className="wallet-balance">
                        <span>Current Balance</span>
                        <span className="balance-amount">₹{walletBalance.toFixed(2)}</span>
                    </div>
                    <Link to="/wallet-recharge" className="recharge-button">Recharge Wallet</Link>
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


                {/* Recent Rides */}
                <div className="dashboard-card rides-card">
                    <h2>Recent Rides</h2>
                    <div className="rides-list">
                        {emptyRecentRides.length > 0 ? (
                            emptyRecentRides.map((ride) => (
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
                            ))
                        ) : (
                            <p className="no-rides">No ride history yet. Book your first ride!</p>
                        )}
                        <Link to="/ride-history" className="view-all-link">
                            View All Rides
                        </Link>
                    </div>
                </div>

                {/* Favorite Routes */}
                <div className="dashboard-card favorites-card">
                    <h2>Favorite Routes</h2>
                    <div className="favorites-list">
                        {emptyFavoriteRoutes.length > 0 ? (
                            emptyFavoriteRoutes.map((route) => (
                                <div key={route.id} className="favorite-item">
                                    <div className="favorite-name">{route.name}</div>
                                    <div className="favorite-route">
                                        {route.pickup} → {route.dropoff}
                                    </div>
                                    <button className="book-again-button">Book Again</button>
                                </div>
                            ))
                        ) : (
                            <p className="no-favorites">No favorite routes yet. Save a route to see it here!</p>
                        )}
                    </div>
                </div>

                {/* Current Bookings */}
                <div className="dashboard-card current-card">
                    <h2>Current Bookings</h2>
                    <div className="current-list">
                        {loading ? (
                            <p>Loading your bookings...</p>
                        ) : currentBookings.length > 0 ? (
                            currentBookings.map((booking) => (
                                <div key={booking.id} className="current-item">
                                    <div className="current-date">{booking.date}</div>
                                    <div className="current-route">
                                        {booking.pickup} → {booking.dropoff}
                                    </div>
                                    <div className="current-fare">
                                        Fare: ₹{booking.fare}
                                    </div>
                                    <button className="cancel-button">Cancel</button>
                                </div>
                            ))
                        ) : (
                            <p>No current bookings</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="dashboard-card upcoming-card">
                    <h2>Upcoming Bookings</h2>
                    <div className="upcoming-list">
                        {loading ? (
                            <p>Loading your bookings...</p>
                        ) : upcomingBookings.length > 0 ? (
                            upcomingBookings.map((booking) => (
                                <div key={booking.id} className="upcoming-item">
                                    <div className="upcoming-date">{booking.date}</div>
                                    <div className="upcoming-route">
                                        {booking.pickup} → {booking.dropoff}
                                    </div>
                                    <div className="upcoming-fare">
                                        Fare: ₹{booking.fare}
                                    </div>
                                    <button className="cancel-button">Cancel</button>
                                </div>
                            ))
                        ) : (
                            <p>No upcoming bookings</p>
                        )}
                    </div>
                </div>

                {/* Available Drivers */}
                <div className="dashboard-card drivers-card">
                    <h2>Available Drivers Nearby</h2>
                    <div className="drivers-list">
                        {availableDrivers.length > 0 ? (
                            availableDrivers.map((driver) => (
                                <div key={driver.id} className="driver-item">
                                    <div className="driver-info">
                                        <div className="driver-name">{driver.name}</div>
                                        <div className="driver-rating">★ {driver.rating}</div>
                                    </div>
                                    <div className="driver-details">
                                        <span>{driver.distance} away</span>
                                        <span>ETA: {driver.eta}</span>
                                    </div>
                                    <Link to="/booking" className="request-driver-button">Request Ride</Link>
                                </div>
                            ))
                        ) : (
                            <p>No drivers available at the moment</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
