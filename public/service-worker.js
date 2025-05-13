// Cache names
const STATIC_CACHE_NAME = 'rickshaw-static-v2';
const DYNAMIC_CACHE_NAME = 'rickshaw-dynamic-v2';
const API_CACHE_NAME = 'rickshaw-api-v2';

// Static files to cache on install
const staticFilesToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles.css',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-144x144.png',
    '/icons/icon-192x192.png',
    '/offline.html' // Fallback page for when offline
];

// API routes that should use network-first strategy
const apiRoutes = [
    '/api/',
    'https://firestore.googleapis.com/',
    'https://firebase.googleapis.com/'
];

// Firebase logging URLs to bypass service worker
const bypassUrls = [
    'https://firebaselogging-pa.googleapis.com/'
];

// Helper function to determine if a request is an API request
const isApiRequest = (url) => {
    return apiRoutes.some(route => url.startsWith(route));
};

// Helper function to determine if a request should bypass the service worker
const shouldBypass = (url) => {
    return bypassUrls.some(route => url.startsWith(route));
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
    const staticExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico'];
    return staticExtensions.some(ext => url.endsWith(ext));
};

// Install service worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static files');
                return cache.addAll(staticFilesToCache);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting();
            })
    );
});

// Fetch event - implement different strategies based on request type
self.addEventListener('fetch', event => {
    // Parse the URL but don't use the variable directly to avoid ESLint warning
    new URL(event.request.url);

    // Bypass service worker for certain URLs (like Firebase logging)
    if (shouldBypass(event.request.url)) {
        return; // Let the browser handle the request normally
    }

    // Handle API requests with network-first strategy
    if (isApiRequest(event.request.url)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache successful responses
                    if (response.ok) {
                        caches.open(API_CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }

                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }

                            // If no cached response, return offline JSON for API
                            return new Response(JSON.stringify({
                                error: 'You are offline',
                                offline: true
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                })
        );
        return;
    }

    // Handle static assets with cache-first strategy
    if (isStaticAsset(event.request.url)) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // Return cached response
                        return cachedResponse;
                    }

                    // If not in cache, fetch from network
                    return fetch(event.request)
                        .then(response => {
                            // Don't cache if not a valid response
                            if (!response || !response.ok) {
                                return response;
                            }

                            // Clone the response
                            const responseToCache = response.clone();

                            // Add to cache
                            caches.open(STATIC_CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        })
                        .catch(() => {
                            // If it's an HTML request, return the offline page
                            if (event.request.headers.get('accept').includes('text/html')) {
                                return caches.match('/offline.html');
                            }
                        });
                })
        );
        return;
    }

    // For all other requests, use network-first with dynamic caching
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone the response
                const responseToCache = response.clone();

                // Cache in dynamic cache
                caches.open(DYNAMIC_CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // If it's an HTML request, return the offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Update service worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating Service Worker...');
    const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[Service Worker] Activation complete');
            return self.clients.claim();
        })
    );
});

// Push notification event handler
self.addEventListener('push', event => {
    console.log('[Service Worker] Push notification received', event);

    let notification = {
        title: 'Rickshaw Update',
        body: 'Something new happened in the app.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: {
            url: '/'
        }
    };

    // Try to extract notification data from the push event
    if (event.data) {
        try {
            notification = { ...notification, ...JSON.parse(event.data.text()) };
        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            data: notification.data,
            vibrate: [100, 50, 100],
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        })
    );
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification click:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Open the app and navigate to the specified URL
    event.waitUntil(
        self.clients.matchAll({ type: 'window' })
            .then(windowClients => {
                const url = event.notification.data.url || '/';

                // If a window is already open, focus it and navigate
                for (const client of windowClients) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Otherwise open a new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url);
                }
            })
    );
});
