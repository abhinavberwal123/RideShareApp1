// ==== FILE: src/App.jsx ====
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles.css";

// Lazy load components
const Home = lazy(() => import("./pages/Home"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const PassengerHome = lazy(() => import("./pages/PassengerHome"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BookingForm = lazy(() => import("./components/BookingForm"));
const WalletRecharge = lazy(() => import("./pages/WalletRecharge"));

function App() {
    return (
        <div className="phone-container">
            <Router>
                <Navbar />
                <div className="main-content">
                    <Suspense fallback={<div className="loading">Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/signin" element={<SignIn />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route path="/dashboard" element={
                                <ProtectedRoute allowedRoles={['consumer']}>
                                    <Dashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/driver-dashboard" element={
                                <ProtectedRoute allowedRoles={['driver']}>
                                    <DriverDashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/edit-profile" element={
                                <ProtectedRoute>
                                    <EditProfile />
                                </ProtectedRoute>
                            } />
                            <Route path="/passenger-home" element={
                                <ProtectedRoute allowedRoles={['consumer']}>
                                    <PassengerHome />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin-panel" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminPanel />
                                </ProtectedRoute>
                            } />
                            <Route path="/booking" element={
                                <ProtectedRoute allowedRoles={['consumer']}>
                                    <BookingForm />
                                </ProtectedRoute>
                            } />
                            <Route path="/wallet-recharge" element={
                                <ProtectedRoute allowedRoles={['consumer']}>
                                    <WalletRecharge />
                                </ProtectedRoute>
                            } />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </div>
                <Footer />
            </Router>
        </div>
    );
}

export default App;
