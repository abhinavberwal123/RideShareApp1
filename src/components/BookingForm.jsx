// ==== FILE: src/components/BookingForm.jsx ====
import React, { useState } from "react";
import "../styles/BookingForm.css";

const BookingForm = () => {
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [rideType, setRideType] = useState("shared");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [promoCode, setPromoCode] = useState("");
    const [fareEstimate, setFareEstimate] = useState(null);
    const [scheduledTime, setScheduledTime] = useState("");
    const [isScheduled, setIsScheduled] = useState(false);
    const [specialRequirements, setSpecialRequirements] = useState({
        luggage: false,
        accessibility: false,
    });
    const [preferredDriver, setPreferredDriver] = useState(false);

    // Popular Delhi locations
    const popularLocations = [
        "India Gate",
        "Connaught Place",
        "Chandni Chowk",
        "Karol Bagh",
        "Lajpat Nagar",
    ];

    const handleLocationSelect = (location, type) => {
        if (type === "pickup") {
            setPickup(location);
        } else {
            setDropoff(location);
        }
        calculateFare();
    };

    const calculateFare = () => {
        if (pickup && dropoff) {
            // This is a mock calculation - replace with actual logic
            const baseFare = 25;
            const distanceFare = Math.floor(Math.random() * 100) + 50;
            const total = baseFare + distanceFare;

            setFareEstimate({
                baseFare,
                distanceFare,
                total,
                discount: promoCode ? Math.floor(total * 0.1) : 0,
                finalTotal: promoCode ? Math.floor(total * 0.9) : total,
            });
        }
    };

    const handlePromoApply = () => {
        if (promoCode) {
            // Mock promo code validation
            alert("Promo code applied successfully!");
            calculateFare();
        } else {
            alert("Please enter a promo code");
        }
    };

    const handleRequirementChange = (requirement) => {
        setSpecialRequirements({
            ...specialRequirements,
            [requirement]: !specialRequirements[requirement],
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In production, send booking info to backend
        console.log("Booking:", {
            pickup,
            dropoff,
            rideType,
            paymentMethod,
            promoCode,
            fareEstimate,
            scheduledTime: isScheduled ? scheduledTime : "Now",
            specialRequirements,
            preferredDriver
        });
        alert("Booking confirmed! Your ride is on the way.");
    };

    return (
        <div className="page-container booking-container">
            <h2>Book a Ride</h2>

            {/* Map placeholder */}
            <div className="map-container">
                <p>Map will be displayed here</p>
                {/* In production, integrate with react-map-gl or Google Maps */}
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
                {/* Pickup location */}
                <div className="form-group">
                    <label>Pickup Location</label>
                    <input
                        type="text"
                        value={pickup}
                        onChange={(e) => {
                            setPickup(e.target.value);
                            if (dropoff) calculateFare();
                        }}
                        placeholder="Enter pickup location"
                        required
                    />
                    <div className="popular-locations">
                        <span>Popular: </span>
                        {popularLocations.slice(0, 3).map((location) => (
                            <button
                                key={location}
                                type="button"
                                className="location-button"
                                onClick={() => handleLocationSelect(location, "pickup")}
                            >
                                {location}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dropoff location */}
                <div className="form-group">
                    <label>Drop-off Location</label>
                    <input
                        type="text"
                        value={dropoff}
                        onChange={(e) => {
                            setDropoff(e.target.value);
                            if (pickup) calculateFare();
                        }}
                        placeholder="Enter drop-off location"
                        required
                    />
                    <div className="popular-locations">
                        <span>Popular: </span>
                        {popularLocations.slice(2, 5).map((location) => (
                            <button
                                key={location}
                                type="button"
                                className="location-button"
                                onClick={() => handleLocationSelect(location, "dropoff")}
                            >
                                {location}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fare estimate */}
                {fareEstimate && (
                    <div className="fare-estimate">
                        <h3>Fare Estimate</h3>
                        <div className="fare-details">
                            <div>Base Fare: ₹{fareEstimate.baseFare}</div>
                            <div>Distance Fare: ₹{fareEstimate.distanceFare}</div>
                            {fareEstimate.discount > 0 && (
                                <div>Discount: -₹{fareEstimate.discount}</div>
                            )}
                            <div className="fare-amount">Total: ₹{fareEstimate.finalTotal}</div>
                        </div>
                    </div>
                )}

                {/* Ride type selection */}
                <div className="form-group">
                    <label>Ride Type</label>
                    <div className="ride-options">
                        <div
                            className={`ride-option ${rideType === "shared" ? "selected" : ""}`}
                            onClick={() => setRideType("shared")}
                        >
                            <div className="ride-option-name">Shared</div>
                            <div className="ride-option-price">Lowest Price</div>
                        </div>
                        <div
                            className={`ride-option ${rideType === "private" ? "selected" : ""}`}
                            onClick={() => setRideType("private")}
                        >
                            <div className="ride-option-name">Private</div>
                            <div className="ride-option-price">Comfort</div>
                        </div>
                    </div>
                </div>

                {/* Scheduled ride */}
                <div className="form-group">
                    <label className="option-checkbox">
                        <input
                            type="checkbox"
                            checked={isScheduled}
                            onChange={() => setIsScheduled(!isScheduled)}
                        />
                        Schedule for later
                    </label>

                    {isScheduled && (
                        <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            required={isScheduled}
                        />
                    )}
                </div>

                {/* Special requirements */}
                <div className="form-group">
                    <label>Special Requirements</label>
                    <div className="additional-options">
                        <label className="option-checkbox">
                            <input
                                type="checkbox"
                                checked={specialRequirements.luggage}
                                onChange={() => handleRequirementChange("luggage")}
                            />
                            Extra luggage space
                        </label>
                        <label className="option-checkbox">
                            <input
                                type="checkbox"
                                checked={specialRequirements.accessibility}
                                onChange={() => handleRequirementChange("accessibility")}
                            />
                            Accessibility needs
                        </label>
                        <label className="option-checkbox">
                            <input
                                type="checkbox"
                                checked={preferredDriver}
                                onChange={() => setPreferredDriver(!preferredDriver)}
                            />
                            Request preferred driver
                        </label>
                    </div>
                </div>

                {/* Payment method */}
                <div className="form-group">
                    <label>Payment Method</label>
                    <div className="payment-methods">
                        <div
                            className={`payment-method ${paymentMethod === "cash" ? "selected" : ""}`}
                            onClick={() => setPaymentMethod("cash")}
                        >
                            Cash
                        </div>
                        <div
                            className={`payment-method ${paymentMethod === "upi" ? "selected" : ""}`}
                            onClick={() => setPaymentMethod("upi")}
                        >
                            UPI
                        </div>
                        <div
                            className={`payment-method ${paymentMethod === "card" ? "selected" : ""}`}
                            onClick={() => setPaymentMethod("card")}
                        >
                            Card
                        </div>
                    </div>
                </div>

                {/* Promo code */}
                <div className="form-group">
                    <label>Promo Code</label>
                    <div className="promo-code">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter promo code"
                        />
                        <button
                            type="button"
                            className="apply-button"
                            onClick={handlePromoApply}
                        >
                            Apply
                        </button>
                    </div>
                </div>

                <button type="submit" className="confirm-button">Confirm Booking</button>
            </form>
        </div>
    );
};

export default BookingForm;