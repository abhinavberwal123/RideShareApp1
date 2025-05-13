// ==== FILE: src/components/BookingForm.jsx ====
import { useState, useEffect, useRef } from "react";
import "../styles/BookingForm.css";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const BookingForm = () => {
    const navigate = useNavigate();
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropoffCoords, setDropoffCoords] = useState(null);
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

    // Create refs for the input elements
    const pickupInputRef = useRef(null);
    const dropoffInputRef = useRef(null);

    // Initialize Google Places Autocomplete
    useEffect(() => {
        // Check if Google Maps API is loaded
        if (window.google && window.google.maps && pickupInputRef.current && dropoffInputRef.current) {
            // Initialize autocomplete for pickup location
            const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
                componentRestrictions: { country: "in" }, // Restrict to India
                fields: ["address_components", "formatted_address", "geometry", "name"],
                types: ["geocode", "establishment"]
            });

            // Initialize autocomplete for dropoff location
            const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInputRef.current, {
                componentRestrictions: { country: "in" }, // Restrict to India
                fields: ["address_components", "formatted_address", "geometry", "name"],
                types: ["geocode", "establishment"]
            });

            // Add place_changed event listeners
            pickupAutocomplete.addListener("place_changed", () => {
                const place = pickupAutocomplete.getPlace();
                if (place.formatted_address) {
                    setPickup(place.formatted_address);
                    if (place.geometry && place.geometry.location) {
                        setPickupCoords({
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        });
                    }
                    // Fare will be calculated by the useEffect hook
                }
            });

            dropoffAutocomplete.addListener("place_changed", () => {
                const place = dropoffAutocomplete.getPlace();
                if (place.formatted_address) {
                    setDropoff(place.formatted_address);
                    if (place.geometry && place.geometry.location) {
                        setDropoffCoords({
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        });
                    }
                    // Fare will be calculated by the useEffect hook
                }
            });
        }
    }, [dropoff, pickup]); // Re-run if pickup or dropoff changes

    // Calculate fare whenever both pickup and dropoff are set
    useEffect(() => {
        const updateFare = async () => {
            if (pickup && dropoff) {
                await calculateFare();
            }
        };

        updateFare();
    }, [pickup, dropoff, rideType, promoCode]); // Also recalculate when ride type or promo code changes

    // Popular Delhi locations
    const popularLocations = [
        "India Gate",
        "Connaught Place",
        "Chandni Chowk",
        "Karol Bagh",
        "Lajpat Nagar",
    ];

    // Function to geocode an address and get coordinates
    const geocodeAddress = async (address) => {
        console.log("Attempting to geocode address:", address);

        // Check if Google Maps API is loaded
        if (!window.google) {
            console.error("Google Maps API not loaded (window.google is undefined)");
            return null;
        }

        if (!window.google.maps) {
            console.error("Google Maps API not loaded (window.google.maps is undefined)");
            return null;
        }

        if (!window.google.maps.Geocoder) {
            console.error("Google Maps Geocoder not available");
            return null;
        }

        try {
            console.log("Creating geocoder instance");
            const geocoder = new window.google.maps.Geocoder();

            console.log("Calling geocode with address:", address);
            const result = await new Promise((resolve, reject) => {
                geocoder.geocode({ address, region: 'in' }, (results, status) => {
                    console.log("Geocode response status:", status);
                    if (status === "OK" && results && results.length > 0) {
                        console.log("Geocode successful, found", results.length, "results");
                        resolve(results[0]);
                    } else {
                        console.error("Geocoding failed with status:", status);
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            });

            if (!result.geometry) {
                console.error("Geocode result missing geometry");
                return null;
            }

            if (!result.geometry.location) {
                console.error("Geocode result missing location");
                return null;
            }

            const coords = {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
            };

            console.log("Successfully geocoded address to coordinates:", coords);
            return coords;
        } catch (error) {
            console.error("Error geocoding address:", error);

            // If we're geocoding a popular location in Delhi, provide hardcoded coordinates as fallback
            if (popularLocations.includes(address)) {
                console.log("Using fallback coordinates for popular location:", address);

                // Hardcoded coordinates for popular Delhi locations
                const fallbackCoords = {
                    "India Gate": { lat: 28.612912, lng: 77.229510 },
                    "Connaught Place": { lat: 28.632735, lng: 77.219696 },
                    "Chandni Chowk": { lat: 28.650541, lng: 77.230003 },
                    "Karol Bagh": { lat: 28.652451, lng: 77.190997 },
                    "Lajpat Nagar": { lat: 28.570337, lng: 77.243513 }
                };

                if (fallbackCoords[address]) {
                    console.log("Using fallback coordinates:", fallbackCoords[address]);
                    return fallbackCoords[address];
                }
            }

            return null;
        }
    };

    const handleLocationSelect = async (location, type) => {
        if (type === "pickup") {
            setPickup(location);

            // Get coordinates for the selected location
            const coords = await geocodeAddress(location);
            if (coords) {
                setPickupCoords(coords);
                console.log("Pickup coordinates:", coords);
            }
        } else {
            setDropoff(location);

            // Get coordinates for the selected location
            const coords = await geocodeAddress(location);
            if (coords) {
                setDropoffCoords(coords);
                console.log("Dropoff coordinates:", coords);
            }
        }

        // Only calculate fare if both pickup and dropoff are set
        if ((type === "pickup" && dropoff) || (type === "dropoff" && pickup)) {
            await calculateFare();
        }
    };

    // Function to calculate distance between two points using Haversine formula
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return null;

        const R = 6371; // Radius of the earth in km
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    };

    // Function to get or create a price for a location pair
    const getLocationPrice = async (pickupLocation, dropoffLocation) => {
        try {
            console.log("Getting price for locations:", pickupLocation, dropoffLocation);
            console.log("Coordinates available:", 
                "Pickup:", pickupCoords ? `Lat: ${pickupCoords.lat}, Lng: ${pickupCoords.lng}` : "None", 
                "Dropoff:", dropoffCoords ? `Lat: ${dropoffCoords.lat}, Lng: ${dropoffCoords.lng}` : "None");

            // Normalize locations to handle slight differences in formatting
            const normalizedPickup = pickupLocation.toLowerCase().trim();
            const normalizedDropoff = dropoffLocation.toLowerCase().trim();

            // Check if we have a price for this location pair in the database
            const pricesRef = collection(db, "locationPrices");
            const q = query(
                pricesRef,
                where("normalizedPickup", "==", normalizedPickup),
                where("normalizedDropoff", "==", normalizedDropoff)
            );

            const querySnapshot = await getDocs(q);

            // If we found a price, return it along with the distance if available
            if (!querySnapshot.empty) {
                const priceData = querySnapshot.docs[0].data();
                console.log("Found existing price:", priceData);
                return {
                    price: priceData.price,
                    distance: priceData.distance || null
                };
            }

            // If no price exists, calculate based on distance
            const baseFare = 25; // Base fare in rupees
            const ratePerKm = 6; // Rate per km in rupees

            let distance = null;

            // Try to calculate distance using coordinates
            if (pickupCoords && dropoffCoords) {
                distance = calculateDistance(pickupCoords, dropoffCoords);
                console.log("Calculated distance:", distance, "km");
            } else {
                console.log("Cannot calculate distance: coordinates missing");
            }

            let price;

            if (distance !== null) {
                // Calculate price based on distance (6 rupees per km)
                const distanceFare = Math.round(distance * ratePerKm);
                price = baseFare + distanceFare;
                console.log("Price calculated from distance:", price);
            } else {
                // Fallback to a default calculation if distance calculation fails
                console.log("Distance calculation failed, using fallback method based on location names");
                // Create a deterministic hash from the location names
                let hash = 0;
                const combinedString = normalizedPickup + normalizedDropoff;
                for (let i = 0; i < combinedString.length; i++) {
                    hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
                    hash |= 0; // Convert to 32bit integer
                }

                // Use the hash to generate a deterministic price between 50 and 150
                const distanceFare = Math.abs(hash % 100) + 50;
                price = baseFare + distanceFare;
                console.log("Price calculated from location hash:", price, "hash value:", hash);
            }

            // Store this price in the database for future use
            try {
                await addDoc(pricesRef, {
                    pickup: pickupLocation,
                    dropoff: dropoffLocation,
                    normalizedPickup,
                    normalizedDropoff,
                    price,
                    distance: distance !== null ? distance : null,
                    createdAt: serverTimestamp()
                });
                console.log("Successfully stored price in database");
            } catch (dbError) {
                console.error("Failed to store price in database:", dbError);
                // Continue even if database storage fails
            }

            console.log("Created new price:", price, "with distance:", distance);
            return {
                price: price,
                distance: distance
            };
        } catch (error) {
            console.error("Error getting location price:", error);
            // Fallback to a variable price based on location names even in error case
            try {
                console.log("Using emergency fallback price calculation");
                const normalizedPickup = pickupLocation.toLowerCase().trim();
                const normalizedDropoff = dropoffLocation.toLowerCase().trim();

                // Create a deterministic hash from the location names
                let hash = 0;
                const combinedString = normalizedPickup + normalizedDropoff;
                for (let i = 0; i < combinedString.length; i++) {
                    hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
                    hash |= 0; // Convert to 32bit integer
                }

                // Generate a variable price between 75 and 175 based on the location names
                const baseFare = 25;
                const distanceFare = Math.abs(hash % 100) + 50;
                const price = baseFare + distanceFare;

                console.log("Emergency fallback price:", price, "for locations:", pickupLocation, dropoffLocation);
                return {
                    price: price,
                    distance: null
                };
            } catch (fallbackError) {
                console.error("Even fallback calculation failed:", fallbackError);
                // Absolute last resort - return a random price between 75 and 175
                const price = Math.floor(Math.random() * 100) + 75;
                console.log("Last resort random price:", price);
                return {
                    price: price,
                    distance: null
                };
            }
        }
    };

    const calculateFare = async () => {
        if (pickup && dropoff) {
            console.log("Calculating fare for pickup:", pickup, "dropoff:", dropoff);
            try {
                // Get the price and distance for this location pair
                console.log("Calling getLocationPrice...");
                const result = await getLocationPrice(pickup, dropoff);
                console.log("getLocationPrice returned:", result);

                const basePrice = result.price;
                const baseFare = 25;
                const distanceFare = basePrice - baseFare;

                console.log("Base price:", basePrice, "Base fare:", baseFare, "Distance fare:", distanceFare);

                // Use the distance from the result, or calculate it if not available
                let distance = result.distance;
                if (distance === null && pickupCoords && dropoffCoords) {
                    console.log("Distance not provided by getLocationPrice, calculating directly...");
                    distance = calculateDistance(pickupCoords, dropoffCoords);
                    console.log("Calculated distance:", distance);
                }

                // Apply different pricing based on ride type
                let total = basePrice;
                if (rideType === "private") {
                    // Private rides cost 20% more
                    const privateTotal = Math.round(basePrice * 1.2);
                    console.log(`Applying private ride multiplier: ${basePrice} * 1.2 = ${privateTotal}`);
                    total = privateTotal;
                } else if (rideType === "shared") {
                    // Shared rides are the base price (no adjustment needed)
                    console.log("Using base price for shared ride:", basePrice);
                }

                // Calculate discount if promo code is applied
                const discount = promoCode ? Math.floor(total * 0.1) : 0;
                const finalTotal = promoCode ? Math.floor(total * 0.9) : total;

                console.log("Final fare calculation:", {
                    baseFare,
                    distanceFare,
                    total,
                    distance: distance ? Math.round(distance * 10) / 10 : null,
                    rideType,
                    discount,
                    finalTotal
                });

                setFareEstimate({
                    baseFare,
                    distanceFare,
                    total,
                    distance: distance ? Math.round(distance * 10) / 10 : null, // Round to 1 decimal place
                    ratePerKm: 6,
                    discount,
                    finalTotal,
                });
            } catch (error) {
                console.error("Error calculating fare:", error);

                // Generate a variable fallback price based on location names
                try {
                    console.log("Using fallback fare calculation based on location names");
                    const normalizedPickup = pickup.toLowerCase().trim();
                    const normalizedDropoff = dropoff.toLowerCase().trim();

                    // Create a deterministic hash from the location names
                    let hash = 0;
                    const combinedString = normalizedPickup + normalizedDropoff;
                    for (let i = 0; i < combinedString.length; i++) {
                        hash = ((hash << 5) - hash) + combinedString.charCodeAt(i);
                        hash |= 0; // Convert to 32bit integer
                    }

                    const baseFare = 25;
                    const distanceFare = Math.abs(hash % 100) + 50;
                    let total = baseFare + distanceFare;

                    // Apply ride type multiplier
                    if (rideType === "private") {
                        total = Math.round(total * 1.2);
                    }

                    const discount = promoCode ? Math.floor(total * 0.1) : 0;
                    const finalTotal = promoCode ? Math.floor(total * 0.9) : total;

                    console.log("Fallback fare calculation:", {
                        baseFare,
                        distanceFare,
                        total,
                        rideType,
                        discount,
                        finalTotal
                    });

                    setFareEstimate({
                        baseFare,
                        distanceFare,
                        total,
                        distance: null,
                        ratePerKm: 6,
                        discount,
                        finalTotal,
                    });
                } catch (fallbackError) {
                    console.error("Even fallback fare calculation failed:", fallbackError);

                    // Absolute last resort - use a random but reasonable fare
                    const baseFare = 25;
                    const distanceFare = Math.floor(Math.random() * 100) + 50;
                    const total = baseFare + distanceFare;
                    const discount = promoCode ? Math.floor(total * 0.1) : 0;
                    const finalTotal = promoCode ? Math.floor(total * 0.9) : total;

                    console.log("Last resort random fare:", {
                        baseFare,
                        distanceFare,
                        total,
                        discount,
                        finalTotal
                    });

                    setFareEstimate({
                        baseFare,
                        distanceFare,
                        total,
                        distance: null,
                        ratePerKm: 6,
                        discount,
                        finalTotal,
                    });
                }
            }
        } else {
            console.log("Cannot calculate fare: pickup or dropoff location missing");
        }
    };

    const handlePromoApply = async () => {
        if (promoCode) {
            // Mock promo code validation
            alert("Promo code applied successfully!");
            if (pickup && dropoff) {
                await calculateFare();
            }
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                alert("You must be logged in to book a ride.");
                return;
            }

            // Create booking object
            const bookingData = {
                userId: user.uid,
                pickup,
                dropoff,
                rideType,
                paymentMethod,
                promoCode,
                fare: fareEstimate ? fareEstimate.finalTotal : 0,
                fareDetails: fareEstimate,
                scheduledTime: isScheduled ? scheduledTime : "Now",
                specialRequirements,
                preferredDriver,
                status: "upcoming",
                createdAt: serverTimestamp(),
                bookingDate: new Date().toISOString()
            };

            // Save to Firestore
            const bookingsRef = collection(db, "bookings");
            await addDoc(bookingsRef, bookingData);

            console.log("Booking saved to database:", bookingData);
            alert("Booking confirmed! Your ride is on the way.");

            // Redirect to dashboard
            navigate("/dashboard");

            // Reset form
            setPickup("");
            setDropoff("");
            setFareEstimate(null);
        } catch (error) {
            console.error("Error saving booking:", error);
            alert("There was an error booking your ride. Please try again.");
        }
    };

    return (
        <div className="page-container booking-container">
            <h2>Book a Ride</h2>

            {/* Google Maps Integration */}
            <div className="map-container">
                <iframe
                    title="Google Map"
                    width="100%"
                    height="300"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBhGwsycoisCNmWOaDB4Wpb4KQyykhPLNE&q=${encodeURIComponent(pickup || 'Delhi, India')}`}
                    allowFullScreen
                ></iframe>
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
                            // Fare will be calculated by the useEffect hook
                        }}
                        placeholder="Enter pickup location"
                        required
                        ref={pickupInputRef}
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
                            // Fare will be calculated by the useEffect hook
                        }}
                        placeholder="Enter drop-off location"
                        required
                        ref={dropoffInputRef}
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
                        <h3>Ride Price Summary</h3>
                        <div className="fare-details">
                            <div>Base Fare: ₹{fareEstimate.baseFare}</div>
                            <div>Distance Fare: ₹{fareEstimate.distanceFare}</div>
                            {fareEstimate.discount > 0 && (
                                <div>Discount: -₹{fareEstimate.discount}</div>
                            )}
                            <div className="fare-amount">Total Ride Price: ₹{fareEstimate.finalTotal}</div>
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
