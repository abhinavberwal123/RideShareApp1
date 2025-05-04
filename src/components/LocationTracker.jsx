import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFirestoreOperations, useDocument } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';

const LocationTracker = ({ 
  rideId, 
  userType, // 'driver' or 'passenger'
  trackingInterval = 5000, // Update location every 5 seconds by default
  highAccuracy = true, // Whether to use high accuracy mode
  batteryOptimization = false, // Whether to optimize for battery life
  onLocationUpdate,
  onDistanceUpdate,
  onETAUpdate,
  onError 
}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [heading, setHeading] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const watchIdRef = useRef(null);
  const locationHistoryRef = useRef([]);
  const maxRetries = 3;

  const { user } = useAuth();
  const { updateDocument, addDocument } = useFirestoreOperations();

  // Get the ride document to access the other party's location
  const { document: rideDoc } = useDocument('rides', rideId);

  // Get the other party's location from the ride document
  const otherPartyLocation = userType === 'driver' 
    ? rideDoc?.passengerLocation 
    : rideDoc?.driverLocation;

  // Start tracking location
  const startTracking = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      setError(errorMsg);
      setFallbackMode(true);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    setIsTracking(true);
    setRetryCount(0);
  };

  // Stop tracking location
  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Update location in Firestore
  const updateLocationInFirestore = async (position) => {
    if (!rideId || !user?.uid) return;

    const { latitude, longitude, accuracy: posAccuracy, heading: posHeading, speed: posSpeed } = position.coords;
    const timestamp = new Date().toISOString();
    const locationData = { 
      latitude, 
      longitude, 
      accuracy: posAccuracy,
      heading: posHeading || null,
      speed: posSpeed || null,
      timestamp 
    };

    try {
      // Update the ride document with the new location
      const locationField = userType === 'driver' ? 'driverLocation' : 'passengerLocation';

      await updateDocument('rides', rideId, {
        [locationField]: locationData,
        updatedAt: new Date()
      });

      // Also update the user's location in their own document
      await updateDocument(userType === 'driver' ? 'drivers' : 'users', user.uid, {
        currentLocation: locationData,
        updatedAt: new Date()
      });

      // Store location update in history collection for analytics and troubleshooting
      await addDocument('locationUpdates', {
        userId: user.uid,
        rideId,
        userType,
        location: locationData,
        createdAt: new Date()
      });

      if (onLocationUpdate) onLocationUpdate(locationData);

      // Reset retry count on successful update
      setRetryCount(0);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('Error updating location:', err);
      setError(`Failed to update location: ${err.message}`);

      // Increment retry count
      setRetryCount(prev => prev + 1);

      if (onError) onError(err);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Calculate ETA based on distance and speed
  const calculateETA = (distanceInKm, speedInKmh) => {
    if (!speedInKmh || speedInKmh <= 0) {
      // If no speed data, estimate based on average urban speed (20 km/h)
      speedInKmh = 20;
    }

    // Calculate time in minutes
    const timeInHours = distanceInKm / speedInKmh;
    const timeInMinutes = Math.ceil(timeInHours * 60);

    // Return ETA as Date object
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + timeInMinutes);
    return eta;
  };

  // Get current position
  const getCurrentPosition = () => {
    const options = {
      enableHighAccuracy: highAccuracy && !batteryOptimization,
      timeout: 10000,
      maximumAge: batteryOptimization ? 60000 : 30000 // Use cached position for longer if battery optimization is on
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: posAccuracy, heading: posHeading, speed: posSpeed } = position.coords;
        const newLocation = { 
          latitude, 
          longitude, 
          accuracy: posAccuracy,
          heading: posHeading || null,
          speed: posSpeed || null,
          timestamp: new Date().toISOString() 
        };

        // Add to location history
        locationHistoryRef.current.push(newLocation);
        if (locationHistoryRef.current.length > 10) {
          locationHistoryRef.current.shift(); // Keep only the last 10 locations
        }

        setLocation(newLocation);
        setAccuracy(posAccuracy);
        setHeading(posHeading);
        setSpeed(posSpeed);

        // Calculate distance and ETA if we have the other party's location
        if (otherPartyLocation && otherPartyLocation.latitude && otherPartyLocation.longitude) {
          const distanceInKm = calculateDistance(
            latitude,
            longitude,
            otherPartyLocation.latitude,
            otherPartyLocation.longitude
          );

          setDistance(distanceInKm);

          // Calculate ETA
          const etaTime = calculateETA(distanceInKm, posSpeed);
          setEta(etaTime);

          if (onDistanceUpdate) onDistanceUpdate(distanceInKm);
          if (onETAUpdate) onETAUpdate(etaTime);
        }

        updateLocationInFirestore(position);
        setError(null);
        setFallbackMode(false);
      },
      (err) => {
        console.error('Error getting location:', err);
        setError(`Location error: ${err.message}`);

        // Increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        // If we've exceeded max retries, switch to fallback mode
        if (newRetryCount >= maxRetries) {
          setFallbackMode(true);

          // In fallback mode, we'll use the last known location if available
          if (locationHistoryRef.current.length > 0) {
            const lastLocation = locationHistoryRef.current[locationHistoryRef.current.length - 1];
            console.log('Using fallback location:', lastLocation);

            // We don't update Firestore here to avoid storing potentially stale data
            // But we do notify the app that we're using fallback data
            if (onLocationUpdate) {
              onLocationUpdate({
                ...lastLocation,
                isFallback: true
              });
            }
          }
        }

        if (onError) onError(err);
      },
      options
    );
  };

  // Watch position continuously
  const watchPosition = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options = {
      enableHighAccuracy: highAccuracy && !batteryOptimization,
      timeout: 10000,
      maximumAge: batteryOptimization ? 60000 : 30000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: posAccuracy, heading: posHeading, speed: posSpeed } = position.coords;
        const newLocation = { 
          latitude, 
          longitude, 
          accuracy: posAccuracy,
          heading: posHeading || null,
          speed: posSpeed || null,
          timestamp: new Date().toISOString() 
        };

        // Add to location history
        locationHistoryRef.current.push(newLocation);
        if (locationHistoryRef.current.length > 10) {
          locationHistoryRef.current.shift(); // Keep only the last 10 locations
        }

        setLocation(newLocation);
        setAccuracy(posAccuracy);
        setHeading(posHeading);
        setSpeed(posSpeed);

        // Calculate distance and ETA if we have the other party's location
        if (otherPartyLocation && otherPartyLocation.latitude && otherPartyLocation.longitude) {
          const distanceInKm = calculateDistance(
            latitude,
            longitude,
            otherPartyLocation.latitude,
            otherPartyLocation.longitude
          );

          setDistance(distanceInKm);

          // Calculate ETA
          const etaTime = calculateETA(distanceInKm, posSpeed);
          setEta(etaTime);

          if (onDistanceUpdate) onDistanceUpdate(distanceInKm);
          if (onETAUpdate) onETAUpdate(etaTime);
        }

        updateLocationInFirestore(position);
        setError(null);
        setFallbackMode(false);
        setRetryCount(0);
      },
      (err) => {
        console.error('Error watching location:', err);
        setError(`Location watch error: ${err.message}`);

        // Increment retry count
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        // If we've exceeded max retries, switch to fallback mode and try getCurrentPosition instead
        if (newRetryCount >= maxRetries) {
          setFallbackMode(true);
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;

          // Try to get position once
          getCurrentPosition();
        }

        if (onError) onError(err);
      },
      options
    );
  };

  // Effect for tracking location
  useEffect(() => {
    if (isTracking) {
      if (batteryOptimization) {
        // In battery optimization mode, we use setInterval instead of watchPosition
        getCurrentPosition(); // Get location immediately
        const intervalId = setInterval(getCurrentPosition, trackingInterval);

        // Cleanup function
        return () => {
          clearInterval(intervalId);
        };
      } else {
        // In normal mode, we use watchPosition for more accurate tracking
        watchPosition();

        // Cleanup function
        return () => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        };
      }
    }
  }, [isTracking, trackingInterval, batteryOptimization, highAccuracy]);

  // Effect to check if we haven't received updates for a while
  useEffect(() => {
    if (isTracking && lastUpdateTime) {
      const checkStaleInterval = setInterval(() => {
        const now = new Date();
        const timeSinceLastUpdate = now - new Date(lastUpdateTime);

        // If it's been more than 2 minutes since the last update, try to restart tracking
        if (timeSinceLastUpdate > 120000) {
          console.log('Location tracking appears stale, restarting...');
          stopTracking();
          setTimeout(() => {
            startTracking();
          }, 1000);
        }
      }, 60000); // Check every minute

      return () => {
        clearInterval(checkStaleInterval);
      };
    }
  }, [isTracking, lastUpdateTime]);

  return {
    location,
    error,
    isTracking,
    distance,
    eta,
    speed,
    heading,
    accuracy,
    fallbackMode,
    startTracking,
    stopTracking,
    calculateDistance
  };
};

LocationTracker.propTypes = {
  rideId: PropTypes.string.isRequired,
  userType: PropTypes.oneOf(['driver', 'passenger']).isRequired,
  trackingInterval: PropTypes.number,
  highAccuracy: PropTypes.bool,
  batteryOptimization: PropTypes.bool,
  onLocationUpdate: PropTypes.func,
  onDistanceUpdate: PropTypes.func,
  onETAUpdate: PropTypes.func,
  onError: PropTypes.func
};

export default LocationTracker;
