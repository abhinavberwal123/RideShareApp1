// ==== FILE: src/pages/EditProfile.jsx ====
import { useState, useRef, useEffect } from "react";
import "../styles/EditProfile.css";

const EditProfile = () => {
    const [activeTab, setActiveTab] = useState("basic");

    // Create refs for address inputs
    const homeAddressRef = useRef(null);
    const workAddressRef = useRef(null);

    const [formData, setFormData] = useState({
        // Basic Info
        name: "",
        email: "",
        profilePicture: null,
        phone: "",

        // Address Info
        homeAddress: "",
        workAddress: "",

        // Emergency Contacts
        emergencyName: "",
        emergencyPhone: "",

        // Language & Preferences
        language: "english",
        notifications: {
            email: false,
            sms: false,
            push: false
        },

        // ID Verification
        aadharNumber: "",
        driverLicense: "",

        // Vehicle Details (for drivers)
        vehicleRegistration: "",
        vehicleModel: "",
        vehiclePhoto: null,

        // Payment Methods
        upiId: "",
        cardNumber: "",
        cardExpiry: "",
        cardCvv: ""
    });

    // Initialize Google Places Autocomplete for address inputs
    useEffect(() => {
        // Check if Google Maps API is loaded and we're on the address tab
        if (window.google && window.google.maps && activeTab === "address") {
            // Initialize autocomplete for home address
            if (homeAddressRef.current) {
                const homeAutocomplete = new window.google.maps.places.Autocomplete(homeAddressRef.current, {
                    componentRestrictions: { country: "in" }, // Restrict to India
                    fields: ["address_components", "formatted_address", "geometry", "name"],
                    types: ["geocode", "establishment"]
                });

                // Add place_changed event listener
                homeAutocomplete.addListener("place_changed", () => {
                    const place = homeAutocomplete.getPlace();
                    if (place.formatted_address) {
                        setFormData({
                            ...formData,
                            homeAddress: place.formatted_address
                        });
                    }
                });
            }

            // Initialize autocomplete for work address
            if (workAddressRef.current) {
                const workAutocomplete = new window.google.maps.places.Autocomplete(workAddressRef.current, {
                    componentRestrictions: { country: "in" }, // Restrict to India
                    fields: ["address_components", "formatted_address", "geometry", "name"],
                    types: ["geocode", "establishment"]
                });

                // Add place_changed event listener
                workAutocomplete.addListener("place_changed", () => {
                    const place = workAutocomplete.getPlace();
                    if (place.formatted_address) {
                        setFormData({
                            ...formData,
                            workAddress: place.formatted_address
                        });
                    }
                });
            }
        }
    }, [activeTab, formData]); // Re-run if activeTab or formData changes

    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setFormData({
                ...formData,
                notifications: {
                    ...formData.notifications,
                    [name.split('.')[1]]: checked
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData({
                ...formData,
                [name]: files[0]
            });
        }
    };

    const handleSendOtp = () => {
        // In production, implement actual OTP sending logic
        setOtpSent(true);
        alert(`OTP sent to ${formData.phone}`);
    };

    const handleVerifyOtp = () => {
        // In production, implement actual OTP verification logic
        if (otp === "1234") { // Mock verification
            alert("Phone number verified successfully!");
        } else {
            alert("Invalid OTP. Please try again.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production, send updated profile info to backend
        console.log("Updated Profile:", formData);
        alert("Profile updated successfully!");
    };

    return (
        <div className="edit-profile-container">
            <h2>Edit Profile</h2>

            <div className="profile-tabs">
                <button
                    className={`tab-button ${activeTab === "basic" ? "active" : ""}`}
                    onClick={() => setActiveTab("basic")}
                >
                    Basic Info
                </button>
                <button
                    className={`tab-button ${activeTab === "address" ? "active" : ""}`}
                    onClick={() => setActiveTab("address")}
                >
                    Address
                </button>
                <button
                    className={`tab-button ${activeTab === "emergency" ? "active" : ""}`}
                    onClick={() => setActiveTab("emergency")}
                >
                    Emergency
                </button>
                <button
                    className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
                    onClick={() => setActiveTab("preferences")}
                >
                    Preferences
                </button>
                <button
                    className={`tab-button ${activeTab === "verification" ? "active" : ""}`}
                    onClick={() => setActiveTab("verification")}
                >
                    Verification
                </button>
                <button
                    className={`tab-button ${activeTab === "payment" ? "active" : ""}`}
                    onClick={() => setActiveTab("payment")}
                >
                    Payment
                </button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                    <div className="form-section">
                        <h3>Basic Information</h3>

                        <div className="profile-picture-section">
                            <div className="profile-picture">
                                {formData.profilePicture ? (
                                    <img
                                        src={URL.createObjectURL(formData.profilePicture)}
                                        alt="Profile"
                                    />
                                ) : (
                                    <div className="profile-placeholder">
                                        {formData.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="profile-picture-upload">
                                <label htmlFor="profilePicture" className="upload-button">
                                    Upload Photo
                                </label>
                                <input
                                    type="file"
                                    id="profilePicture"
                                    name="profilePicture"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="phone-verification">
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                                {!otpSent ? (
                                    <button
                                        type="button"
                                        className="verify-button"
                                        onClick={handleSendOtp}
                                    >
                                        Verify
                                    </button>
                                ) : (
                                    <span className="verification-status">OTP Sent</span>
                                )}
                            </div>
                        </div>

                        {otpSent && (
                            <div className="form-group">
                                <label>Enter OTP</label>
                                <div className="otp-verification">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={4}
                                        placeholder="Enter 4-digit OTP"
                                    />
                                    <button
                                        type="button"
                                        className="verify-button"
                                        onClick={handleVerifyOtp}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Address Tab */}
                {activeTab === "address" && (
                    <div className="form-section">
                        <h3>Address Information</h3>

                        <div className="form-group">
                            <label>Home Address</label>
                            <input
                                type="text"
                                name="homeAddress"
                                value={formData.homeAddress}
                                onChange={handleInputChange}
                                placeholder="Enter home address"
                                ref={homeAddressRef}
                            />
                        </div>

                        <div className="form-group">
                            <label>Work Address</label>
                            <input
                                type="text"
                                name="workAddress"
                                value={formData.workAddress}
                                onChange={handleInputChange}
                                placeholder="Enter work address"
                                ref={workAddressRef}
                            />
                        </div>
                    </div>
                )}

                {/* Emergency Contacts Tab */}
                {activeTab === "emergency" && (
                    <div className="form-section">
                        <h3>Emergency Contacts</h3>

                        <div className="form-group">
                            <label>Emergency Contact Name</label>
                            <input
                                type="text"
                                name="emergencyName"
                                value={formData.emergencyName}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Emergency Contact Phone</label>
                            <input
                                type="tel"
                                name="emergencyPhone"
                                value={formData.emergencyPhone}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                    <div className="form-section">
                        <h3>Language & Preferences</h3>

                        <div className="form-group">
                            <label>Preferred Language</label>
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleInputChange}
                            >
                                <option value="english">English</option>
                                <option value="hindi">Hindi</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notification Preferences</label>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="notifications.email"
                                        checked={formData.notifications.email}
                                        onChange={handleInputChange}
                                    />
                                    Email Notifications
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="notifications.sms"
                                        checked={formData.notifications.sms}
                                        onChange={handleInputChange}
                                    />
                                    SMS Notifications
                                </label>

                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="notifications.push"
                                        checked={formData.notifications.push}
                                        onChange={handleInputChange}
                                    />
                                    Push Notifications
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Tab */}
                {activeTab === "verification" && (
                    <div className="form-section">
                        <h3>ID Verification</h3>

                        <div className="form-group">
                            <label>Aadhar Number</label>
                            <input
                                type="text"
                                name="aadharNumber"
                                value={formData.aadharNumber}
                                onChange={handleInputChange}
                                placeholder="XXXX-XXXX-XXXX"
                            />
                        </div>

                        <div className="form-group">
                            <label>Driver&apos;s License Number</label>
                            <input
                                type="text"
                                name="driverLicense"
                                value={formData.driverLicense}
                                onChange={handleInputChange}
                                placeholder="DL-XXXXXXXXXX"
                            />
                        </div>

                        <div className="form-group">
                            <label>Upload ID Proof</label>
                            <input
                                type="file"
                                name="idProof"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Vehicle Details (for drivers) */}
                        <h3>Vehicle Details</h3>

                        <div className="form-group">
                            <label>Vehicle Registration Number</label>
                            <input
                                type="text"
                                name="vehicleRegistration"
                                value={formData.vehicleRegistration}
                                onChange={handleInputChange}
                                placeholder="DL-XX-XX-XXXX"
                            />
                        </div>

                        <div className="form-group">
                            <label>Vehicle Model</label>
                            <input
                                type="text"
                                name="vehicleModel"
                                value={formData.vehicleModel}
                                onChange={handleInputChange}
                                placeholder="e.g., Bajaj RE"
                            />
                        </div>

                        <div className="form-group">
                            <label>Upload Vehicle Photo</label>
                            <input
                                type="file"
                                name="vehiclePhoto"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                )}

                {/* Payment Methods Tab */}
                {activeTab === "payment" && (
                    <div className="form-section">
                        <h3>Payment Methods</h3>

                        <div className="form-group">
                            <label>UPI ID</label>
                            <input
                                type="text"
                                name="upiId"
                                value={formData.upiId}
                                onChange={handleInputChange}
                                placeholder="yourname@upi"
                            />
                        </div>

                        <div className="form-group">
                            <label>Card Number</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>Expiry Date</label>
                                <input
                                    type="text"
                                    name="cardExpiry"
                                    value={formData.cardExpiry}
                                    onChange={handleInputChange}
                                    placeholder="MM/YY"
                                />
                            </div>

                            <div className="form-group half">
                                <label>CVV</label>
                                <input
                                    type="password"
                                    name="cardCvv"
                                    value={formData.cardCvv}
                                    onChange={handleInputChange}
                                    maxLength={3}
                                    placeholder="XXX"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="save-button">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
