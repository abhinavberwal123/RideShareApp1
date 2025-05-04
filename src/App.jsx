// ==== FILE: src/App.jsx ====
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn"; // Fixed case: Signin → SignIn
import SignUp from "./pages/Signup"; // Fixed case: SignUp → Signup
import Dashboard from "./pages/Dashboard";
import DriverDashboard from "./pages/DriverDashboard";
import EditProfile from "./pages/EditProfile";
import PassengerHome from "./pages/PassengerHome";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import BookingForm from "./components/BookingForm";
import "./styles.css";

function App() {
    return (
        <div className="phone-container">
            <Router>
                <Navbar />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/driver-dashboard" element={<DriverDashboard />} />
                        <Route path="/edit-profile" element={<EditProfile />} />
                        <Route path="/passenger-home" element={<PassengerHome />} />
                        <Route path="/admin-panel" element={<AdminPanel />} />
                        <Route path="/booking" element={<BookingForm />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </div>
                <Footer />
            </Router>
        </div>
    );
}

export default App;