const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentUpdated, onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// Basic HTTP function (existing)
exports.helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
});

// Ride Matching function
exports.matchRideRequest = onDocumentCreated("rides/{rideId}", async (event) => {
    const rideData = event.data.data();
    logger.info("New ride request created", {rideId: event.params.rideId, rideData: rideData});

    // Only process rides in 'requested' status
    if (rideData.status !== 'requested') {
        logger.info("Ride not in requested status, skipping matching", {status: rideData.status});
        return;
    }

    try {
        // Get the admin SDK
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        const db = admin.firestore();

        // Get passenger location
        const passengerLocation = rideData.passengerLocation;
        if (!passengerLocation || !passengerLocation.latitude || !passengerLocation.longitude) {
            logger.error("Passenger location not available", {rideId: event.params.rideId});
            return;
        }

        // Query for available drivers
        const availableDriversSnapshot = await db.collection('drivers')
            .where('status', '==', 'active')
            .where('isAvailable', '==', true)
            .get();

        if (availableDriversSnapshot.empty) {
            logger.info("No available drivers found", {rideId: event.params.rideId});

            // Update ride status to 'no_drivers'
            await db.collection('rides').doc(event.params.rideId).update({
                status: 'no_drivers',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return;
        }

        // Calculate distance for each driver and find the closest one
        const drivers = [];
        availableDriversSnapshot.forEach(doc => {
            const driverData = doc.data();
            if (driverData.currentLocation && 
                driverData.currentLocation.latitude && 
                driverData.currentLocation.longitude) {

                // Calculate distance using Haversine formula
                const distance = calculateDistance(
                    passengerLocation.latitude,
                    passengerLocation.longitude,
                    driverData.currentLocation.latitude,
                    driverData.currentLocation.longitude
                );

                drivers.push({
                    id: doc.id,
                    distance: distance,
                    rating: driverData.rating || 0,
                    data: driverData
                });
            }
        });

        if (drivers.length === 0) {
            logger.info("No drivers with valid location data found", {rideId: event.params.rideId});

            // Update ride status to 'no_drivers'
            await db.collection('rides').doc(event.params.rideId).update({
                status: 'no_drivers',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return;
        }

        // Sort drivers by distance and rating
        drivers.sort((a, b) => {
            // Prioritize distance but also consider rating
            // Drivers within 20% distance of each other are sorted by rating
            if (Math.abs(a.distance - b.distance) / Math.min(a.distance, b.distance) < 0.2) {
                return b.rating - a.rating;
            }
            return a.distance - b.distance;
        });

        // Select the best driver
        const selectedDriver = drivers[0];

        // Calculate ETA based on distance (rough estimate: 2 minutes per km)
        const estimatedTimeInMinutes = Math.ceil(selectedDriver.distance * 2);

        // Update the ride document with the matched driver
        await db.collection('rides').doc(event.params.rideId).update({
            driverId: selectedDriver.id,
            driverName: selectedDriver.data.name || 'Driver',
            driverPhone: selectedDriver.data.phone || '',
            driverLocation: selectedDriver.data.currentLocation,
            estimatedPickupTime: new Date(Date.now() + estimatedTimeInMinutes * 60 * 1000),
            status: 'driver_assigned',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update driver's status to indicate they're on a ride
        await db.collection('drivers').doc(selectedDriver.id).update({
            isAvailable: false,
            currentRideId: event.params.rideId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info("Ride matching process completed for ride", {
            rideId: event.params.rideId,
            driverId: selectedDriver.id,
            distance: selectedDriver.distance,
            estimatedTime: estimatedTimeInMinutes
        });
    } catch (error) {
        logger.error("Error matching ride with driver", {error: error.message, rideId: event.params.rideId});
    }
});

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Ride Status Notification function
exports.notifyRideStatusChange = onDocumentUpdated("rides/{rideId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only process if status has changed
    if (beforeData.status !== afterData.status) {
        logger.info("Ride status changed", {
            rideId: event.params.rideId,
            oldStatus: beforeData.status,
            newStatus: afterData.status
        });

        try {
            // Get the admin SDK
            const admin = require('firebase-admin');
            if (!admin.apps.length) {
                admin.initializeApp();
            }
            const db = admin.firestore();

            // Get user data to retrieve FCM tokens
            const passengerId = afterData.passengerId;
            const driverId = afterData.driverId;

            if (!passengerId) {
                logger.error("Passenger ID not found in ride data", {rideId: event.params.rideId});
                return;
            }

            // Get passenger data
            const passengerDoc = await db.collection('users').doc(passengerId).get();
            if (!passengerDoc.exists) {
                logger.error("Passenger document not found", {passengerId, rideId: event.params.rideId});
                return;
            }
            const passengerData = passengerDoc.data();
            const passengerFcmToken = passengerData.fcmToken;

            // Prepare notification for passenger
            let passengerNotificationTitle = 'Ride Update';
            let passengerNotificationBody = '';

            // Customize notification based on status
            switch (afterData.status) {
                case 'driver_assigned':
                    passengerNotificationTitle = 'Driver Assigned';
                    passengerNotificationBody = `${afterData.driverName} is on the way. ETA: ${formatETA(afterData.estimatedPickupTime)}`;
                    break;
                case 'driver_arrived':
                    passengerNotificationTitle = 'Driver Arrived';
                    passengerNotificationBody = `${afterData.driverName} has arrived at your pickup location`;
                    break;
                case 'in_progress':
                    passengerNotificationTitle = 'Ride Started';
                    passengerNotificationBody = 'Your ride has started';
                    break;
                case 'completed':
                    passengerNotificationTitle = 'Ride Completed';
                    passengerNotificationBody = `Your ride has been completed. Total fare: ₹${afterData.fare}`;
                    break;
                case 'cancelled':
                    passengerNotificationTitle = 'Ride Cancelled';
                    passengerNotificationBody = 'Your ride has been cancelled';
                    break;
                case 'no_drivers':
                    passengerNotificationTitle = 'No Drivers Available';
                    passengerNotificationBody = 'No drivers are currently available. Please try again later';
                    break;
                default:
                    passengerNotificationTitle = 'Ride Status Update';
                    passengerNotificationBody = `Your ride status has changed to ${afterData.status}`;
            }

            // Send notification to passenger if FCM token exists
            if (passengerFcmToken) {
                const passengerMessage = {
                    notification: {
                        title: passengerNotificationTitle,
                        body: passengerNotificationBody
                    },
                    data: {
                        rideId: event.params.rideId,
                        status: afterData.status,
                        type: 'ride_update'
                    },
                    token: passengerFcmToken
                };

                try {
                    await admin.messaging().send(passengerMessage);
                    logger.info("Notification sent to passenger", {passengerId, rideId: event.params.rideId});
                } catch (fcmError) {
                    logger.error("Error sending FCM to passenger", {
                        error: fcmError.message,
                        passengerId,
                        rideId: event.params.rideId
                    });
                }
            } else {
                logger.info("Passenger FCM token not found, notification not sent", {passengerId});
            }

            // Store notification in Firestore for in-app notification center
            await db.collection('notifications').add({
                userId: passengerId,
                title: passengerNotificationTitle,
                message: passengerNotificationBody,
                rideId: event.params.rideId,
                status: afterData.status,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // If driver is assigned, send notification to driver as well
            if (driverId) {
                const driverDoc = await db.collection('drivers').doc(driverId).get();
                if (!driverDoc.exists) {
                    logger.error("Driver document not found", {driverId, rideId: event.params.rideId});
                } else {
                    const driverData = driverDoc.data();
                    const driverFcmToken = driverData.fcmToken;

                    // Prepare notification for driver
                    let driverNotificationTitle = 'Ride Update';
                    let driverNotificationBody = '';

                    // Customize notification based on status
                    switch (afterData.status) {
                        case 'driver_assigned':
                            driverNotificationTitle = 'New Ride Assigned';
                            driverNotificationBody = `New ride request from ${afterData.passengerName || 'a passenger'}`;
                            break;
                        case 'cancelled':
                            driverNotificationTitle = 'Ride Cancelled';
                            driverNotificationBody = 'The ride has been cancelled';
                            break;
                        case 'completed':
                            driverNotificationTitle = 'Ride Completed';
                            driverNotificationBody = `Ride completed. Earnings: ₹${afterData.fare}`;
                            break;
                        default:
                            driverNotificationTitle = 'Ride Status Update';
                            driverNotificationBody = `Ride status has changed to ${afterData.status}`;
                    }

                    // Send notification to driver if FCM token exists
                    if (driverFcmToken) {
                        const driverMessage = {
                            notification: {
                                title: driverNotificationTitle,
                                body: driverNotificationBody
                            },
                            data: {
                                rideId: event.params.rideId,
                                status: afterData.status,
                                type: 'ride_update'
                            },
                            token: driverFcmToken
                        };

                        try {
                            await admin.messaging().send(driverMessage);
                            logger.info("Notification sent to driver", {driverId, rideId: event.params.rideId});
                        } catch (fcmError) {
                            logger.error("Error sending FCM to driver", {
                                error: fcmError.message,
                                driverId,
                                rideId: event.params.rideId
                            });
                        }
                    } else {
                        logger.info("Driver FCM token not found, notification not sent", {driverId});
                    }

                    // Store notification in Firestore for in-app notification center
                    await db.collection('notifications').add({
                        userId: driverId,
                        title: driverNotificationTitle,
                        message: driverNotificationBody,
                        rideId: event.params.rideId,
                        status: afterData.status,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

        } catch (error) {
            logger.error("Error sending ride status notification", {
                error: error.message,
                rideId: event.params.rideId
            });
        }
    }
});

// Helper function to format estimated time of arrival
function formatETA(timestamp) {
    if (!timestamp) return 'Unknown';

    // If timestamp is a Firestore Timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    // Format time as HH:MM AM/PM
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Payment Processing function
exports.processRidePayment = onDocumentUpdated("rides/{rideId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Only process if status changed to 'completed'
    if (beforeData.status !== 'completed' && afterData.status === 'completed') {
        logger.info("Processing payment for completed ride", {rideId: event.params.rideId});

        try {
            // Get the admin SDK
            const admin = require('firebase-admin');
            if (!admin.apps.length) {
                admin.initializeApp();
            }
            const db = admin.firestore();

            // Get ride details
            const rideId = event.params.rideId;
            const passengerId = afterData.passengerId;
            const driverId = afterData.driverId;

            if (!passengerId || !driverId) {
                logger.error("Missing passenger or driver ID", {
                    rideId,
                    passengerId,
                    driverId
                });
                return;
            }

            // Calculate final fare
            let finalFare = afterData.estimatedFare || 0;

            // If we have start and end time, calculate actual duration
            if (afterData.startTime && afterData.endTime) {
                const startTime = afterData.startTime.toDate ? 
                    afterData.startTime.toDate() : new Date(afterData.startTime);
                const endTime = afterData.endTime.toDate ? 
                    afterData.endTime.toDate() : new Date(afterData.endTime);

                // Calculate ride duration in minutes
                const durationMinutes = Math.ceil((endTime - startTime) / (1000 * 60));

                // Get base fare and per minute rate from ride data or use defaults
                const baseFare = afterData.baseFare || 25;
                const perMinuteRate = afterData.perMinuteRate || 2;

                // Calculate fare based on duration
                const durationFare = baseFare + (durationMinutes * perMinuteRate);

                // If we have distance, calculate fare based on distance as well
                if (afterData.distance) {
                    const perKmRate = afterData.perKmRate || 8;
                    const distanceFare = baseFare + (afterData.distance * perKmRate);

                    // Use the higher of duration-based or distance-based fare
                    finalFare = Math.max(durationFare, distanceFare);
                } else {
                    finalFare = durationFare;
                }

                // Apply surge pricing if applicable
                if (afterData.surgeFactor && afterData.surgeFactor > 1) {
                    finalFare = finalFare * afterData.surgeFactor;
                }

                // Round to nearest integer
                finalFare = Math.round(finalFare);
            }

            // Get passenger payment method
            const passengerDoc = await db.collection('users').doc(passengerId).get();
            if (!passengerDoc.exists) {
                logger.error("Passenger document not found", {passengerId, rideId});
                return;
            }

            const passengerData = passengerDoc.data();
            const paymentMethod = passengerData.defaultPaymentMethod || afterData.paymentMethod;

            if (!paymentMethod) {
                logger.error("No payment method found", {passengerId, rideId});

                // Update ride with payment failure
                await db.collection('rides').doc(rideId).update({
                    paymentStatus: 'failed',
                    paymentError: 'No payment method found',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                return;
            }

            // Generate a unique transaction ID
            const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

            // In a real implementation, you would integrate with Stripe or another payment processor
            // This is a simulation of a successful payment

            // Create a transaction record
            await db.collection('transactions').add({
                transactionId: transactionId,
                rideId: rideId,
                passengerId: passengerId,
                driverId: driverId,
                amount: finalFare,
                currency: 'inr',
                paymentMethod: paymentMethod,
                status: 'completed',
                type: 'ride_payment',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update the ride with payment information
            await db.collection('rides').doc(rideId).update({
                fare: finalFare,
                paymentStatus: 'completed',
                transactionId: transactionId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update driver's earnings
            // Typically the platform takes a commission, let's say 20%
            const platformCommissionPercentage = 0.20;
            const platformCommission = finalFare * platformCommissionPercentage;
            const driverEarnings = finalFare - platformCommission;

            await db.collection('drivers').doc(driverId).update({
                earnings: admin.firestore.FieldValue.increment(driverEarnings),
                totalRides: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update platform earnings
            await db.collection('platform').doc('earnings').update({
                total: admin.firestore.FieldValue.increment(platformCommission),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }).catch(err => {
                // If document doesn't exist, create it
                if (err.code === 'not-found') {
                    return db.collection('platform').doc('earnings').set({
                        total: platformCommission,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                throw err;
            });

            // Update user's ride history
            await db.collection('users').doc(passengerId).update({
                totalRides: admin.firestore.FieldValue.increment(1),
                totalSpent: admin.firestore.FieldValue.increment(finalFare),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            logger.info("Payment processed successfully", {
                rideId,
                transactionId,
                amount: finalFare,
                driverEarnings,
                platformCommission
            });

        } catch (error) {
            logger.error("Error processing payment", {
                error: error.message,
                rideId: event.params.rideId
            });

            // Update ride with payment failure
            try {
                const admin = require('firebase-admin');
                if (!admin.apps.length) {
                    admin.initializeApp();
                }
                const db = admin.firestore();

                await db.collection('rides').doc(event.params.rideId).update({
                    paymentStatus: 'failed',
                    paymentError: error.message,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (updateError) {
                logger.error("Error updating ride with payment failure", {
                    error: updateError.message,
                    rideId: event.params.rideId
                });
            }
        }
    }
});

// Scheduled cleanup function
exports.cleanupOldRideData = onSchedule({schedule: "every 24 hours"}, async () => {
    logger.info("Running scheduled cleanup of old ride data");

    try {
        // Get the admin SDK
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        const db = admin.firestore();

        // Define cutoff dates for different operations
        const now = new Date();

        // Rides older than 90 days will be archived
        const archiveCutoffDate = new Date(now);
        archiveCutoffDate.setDate(now.getDate() - 90);

        // Temporary data older than 7 days will be deleted
        const deleteTempDataCutoffDate = new Date(now);
        deleteTempDataCutoffDate.setDate(now.getDate() - 7);

        // Notifications older than 30 days will be deleted
        const deleteNotificationsCutoffDate = new Date(now);
        deleteNotificationsCutoffDate.setDate(now.getDate() - 30);

        logger.info("Cleanup parameters", {
            archiveCutoffDate: archiveCutoffDate.toISOString(),
            deleteTempDataCutoffDate: deleteTempDataCutoffDate.toISOString(),
            deleteNotificationsCutoffDate: deleteNotificationsCutoffDate.toISOString()
        });

        // 1. Archive old rides
        const oldRidesSnapshot = await db.collection('rides')
            .where('createdAt', '<', archiveCutoffDate)
            .where('archived', '==', false)
            .limit(500) // Process in batches to avoid timeout
            .get();

        if (!oldRidesSnapshot.empty) {
            logger.info(`Found ${oldRidesSnapshot.size} old rides to archive`);

            const archiveBatch = db.batch();
            const archivePromises = [];

            oldRidesSnapshot.forEach(doc => {
                const rideData = doc.data();

                // Add to archive collection
                const archiveRef = db.collection('archivedRides').doc(doc.id);
                archivePromises.push(
                    archiveRef.set({
                        ...rideData,
                        archivedAt: admin.firestore.FieldValue.serverTimestamp()
                    })
                );

                // Mark as archived in original collection
                archiveBatch.update(doc.ref, { 
                    archived: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            // Wait for all archive operations to complete
            await Promise.all(archivePromises);
            await archiveBatch.commit();

            logger.info(`Successfully archived ${oldRidesSnapshot.size} rides`);
        } else {
            logger.info("No old rides to archive");
        }

        // 2. Delete temporary location data older than 7 days
        const oldLocationDataSnapshot = await db.collection('locationUpdates')
            .where('timestamp', '<', deleteTempDataCutoffDate)
            .limit(500)
            .get();

        if (!oldLocationDataSnapshot.empty) {
            logger.info(`Found ${oldLocationDataSnapshot.size} old location updates to delete`);

            const deleteTempDataBatch = db.batch();

            oldLocationDataSnapshot.forEach(doc => {
                deleteTempDataBatch.delete(doc.ref);
            });

            await deleteTempDataBatch.commit();

            logger.info(`Successfully deleted ${oldLocationDataSnapshot.size} old location updates`);
        } else {
            logger.info("No old location updates to delete");
        }

        // 3. Delete old read notifications
        const oldNotificationsSnapshot = await db.collection('notifications')
            .where('createdAt', '<', deleteNotificationsCutoffDate)
            .where('read', '==', true)
            .limit(500)
            .get();

        if (!oldNotificationsSnapshot.empty) {
            logger.info(`Found ${oldNotificationsSnapshot.size} old notifications to delete`);

            const deleteNotificationsBatch = db.batch();

            oldNotificationsSnapshot.forEach(doc => {
                deleteNotificationsBatch.delete(doc.ref);
            });

            await deleteNotificationsBatch.commit();

            logger.info(`Successfully deleted ${oldNotificationsSnapshot.size} old notifications`);
        } else {
            logger.info("No old notifications to delete");
        }

        // 4. Generate monthly report
        const today = new Date();
        const isFirstDayOfMonth = today.getDate() === 1;

        if (isFirstDayOfMonth) {
            // Calculate previous month
            const previousMonth = new Date(today);
            previousMonth.setDate(0); // Last day of previous month
            const year = previousMonth.getFullYear();
            const month = previousMonth.getMonth() + 1; // JavaScript months are 0-indexed

            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

            logger.info("Generating monthly report", {
                year,
                month,
                startOfMonth: startOfMonth.toISOString(),
                endOfMonth: endOfMonth.toISOString()
            });

            // Get all rides for the month
            const monthlyRidesSnapshot = await db.collection('rides')
                .where('createdAt', '>=', startOfMonth)
                .where('createdAt', '<=', endOfMonth)
                .get();

            // Calculate statistics
            let totalRides = 0;
            let completedRides = 0;
            let cancelledRides = 0;
            let totalRevenue = 0;
            let totalDistance = 0;

            monthlyRidesSnapshot.forEach(doc => {
                const ride = doc.data();
                totalRides++;

                if (ride.status === 'completed') {
                    completedRides++;
                    totalRevenue += ride.fare || 0;
                    totalDistance += ride.distance || 0;
                } else if (ride.status === 'cancelled') {
                    cancelledRides++;
                }
            });

            // Create monthly report
            await db.collection('reports').doc(`${year}_${month}`).set({
                year,
                month,
                totalRides,
                completedRides,
                cancelledRides,
                totalRevenue,
                totalDistance,
                completionRate: totalRides > 0 ? (completedRides / totalRides) * 100 : 0,
                averageFare: completedRides > 0 ? totalRevenue / completedRides : 0,
                averageDistance: completedRides > 0 ? totalDistance / completedRides : 0,
                generatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            logger.info("Monthly report generated", {
                year,
                month,
                totalRides,
                completedRides,
                totalRevenue
            });
        }

        logger.info("Cleanup process completed successfully");
    } catch (error) {
        logger.error("Error during scheduled cleanup", {error: error.message});
    }
});
