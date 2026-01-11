/**
 * ============================================================
 * DELAYED MIRROR - Service Worker
 * ============================================================
 * 
 * This service worker enables Progressive Web App (PWA) functionality:
 * 1. Offline capability - App works without internet connection
 * 2. Install prompt - Users can add to home screen
 * 3. Background caching - Resources are cached for fast loading
 * 
 * CACHING STRATEGY:
 * -----------------
 * We use a "Cache First, Network Fallback" strategy:
 * 1. Try to serve from cache first (fast)
 * 2. If not in cache, fetch from network
 * 3. Cache network responses for future use
 * 
 * This is ideal for a camera app because:
 * - All app resources are static
 * - Camera functionality works offline (local device)
 * - No server-side features needed
 * 
 * ============================================================
 */

/**
 * ADJUSTMENT: CACHE_NAME
 * ----------------------
 * Change this version string when you update the app.
 * This triggers cache invalidation and forces users to get new files.
 * 
 * Naming convention: 'app-name-v{major}.{minor}.{patch}'
 * - major: Breaking changes
 * - minor: New features
 * - patch: Bug fixes
 */
const CACHE_NAME = 'delayed-mirror-v1.0.0';

/**
 * ADJUSTMENT: FILES_TO_CACHE
 * --------------------------
 * List all files that should be cached for offline use.
 * Add any new HTML, CSS, JS, or asset files here.
 * 
 * Important: Include ALL necessary files, including:
 * - HTML pages
 * - CSS files (if external)
 * - JavaScript files (if external)
 * - Images and icons
 * - Fonts (if self-hosted)
 */
const FILES_TO_CACHE = [
    '/',                        // Root URL (serves index.html)
    '/index.html',              // Main HTML file
    '/manifest.json',           // PWA manifest
    '/icons/icon-72.png',       // App icons (various sizes)
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png'
];

/**
 * ============================================================
 * INSTALL EVENT
 * ============================================================
 * 
 * Triggered when the service worker is first installed.
 * This is the perfect time to cache all static resources.
 * 
 * The install event only fires once per service worker version.
 * When you change the service worker file, a new version is installed.
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    
    /**
     * event.waitUntil() keeps the install event active until
     * the Promise inside resolves. This ensures all files are
     * cached before the service worker is considered "installed".
     */
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                /**
                 * addAll() fetches all URLs and stores responses in cache.
                 * If ANY file fails to cache, the entire install fails.
                 * 
                 * ADJUSTMENT: If you have optional resources that might fail,
                 * use individual cache.add() calls with try/catch instead.
                 */
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                /**
                 * skipWaiting() forces this service worker to become active
                 * immediately, without waiting for all tabs to close.
                 * 
                 * ADJUSTMENT: Remove this if you need to ensure all tabs
                 * are on the same version before updating.
                 */
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Install failed:', error);
            })
    );
});

/**
 * ============================================================
 * ACTIVATE EVENT
 * ============================================================
 * 
 * Triggered when the service worker becomes active.
 * This is the ideal time to clean up old caches.
 * 
 * The activate event fires after install, but may be delayed
 * until all pages using the old service worker are closed
 * (unless skipWaiting() was called).
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                /**
                 * Delete all caches that aren't the current version.
                 * This cleans up storage from old app versions.
                 * 
                 * ADJUSTMENT: If you need to keep multiple cache versions
                 * (e.g., for A/B testing), modify this filter.
                 */
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Keep only caches that match our app name pattern
                            // but aren't the current version
                            return cacheName.startsWith('delayed-mirror-') 
                                && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                /**
                 * clients.claim() makes this service worker take control
                 * of all open pages immediately, without requiring a reload.
                 * 
                 * Combined with skipWaiting(), this ensures the new
                 * service worker is active and controlling pages ASAP.
                 */
                return self.clients.claim();
            })
    );
});

/**
 * ============================================================
 * FETCH EVENT
 * ============================================================
 * 
 * Triggered for every network request made by pages this
 * service worker controls. This is where caching magic happens.
 * 
 * STRATEGY: Cache First, Network Fallback
 * 1. Check if request is in cache
 * 2. If yes, return cached response (fast!)
 * 3. If no, fetch from network
 * 4. Cache the network response for future use
 * 5. If network fails, show offline fallback
 */
self.addEventListener('fetch', (event) => {
    /**
     * Only handle GET requests.
     * POST, PUT, DELETE etc. should always go to network.
     */
    if (event.request.method !== 'GET') {
        return;
    }

    /**
     * Skip caching for certain requests:
     * - Chrome extensions
     * - Analytics/tracking
     * - API calls (if you add any)
     */
    const url = new URL(event.request.url);
    
    // Skip non-http(s) requests (e.g., chrome-extension://)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    console.log('[ServiceWorker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                console.log('[ServiceWorker] Fetching:', event.request.url);
                
                return fetch(event.request)
                    .then((networkResponse) => {
                        /**
                         * Only cache successful responses (status 200)
                         * and responses of type 'basic' (same-origin)
                         * 
                         * ADJUSTMENT: Modify these conditions to cache
                         * cross-origin resources or other status codes.
                         */
                        if (!networkResponse || 
                            networkResponse.status !== 200 || 
                            networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        /**
                         * Clone the response before caching.
                         * Response bodies can only be read once, so we need
                         * one copy for the cache and one to return.
                         */
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        /**
                         * Network request failed (offline or server error)
                         * Return a fallback response.
                         * 
                         * For this app, the main HTML is in cache,
                         * so this mainly catches missing assets.
                         */
                        console.error('[ServiceWorker] Fetch failed:', error);
                        
                        // For navigation requests, try to return cached index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return nothing (let browser handle error)
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

/**
 * ============================================================
 * MESSAGE EVENT (Optional)
 * ============================================================
 * 
 * Handle messages from the main app.
 * Useful for:
 * - Triggering cache updates from the app
 * - Skipping waiting on demand
 * - Communicating service worker status
 */
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    /**
     * ADJUSTMENT: Add custom message handlers here.
     * Example: Force update when user clicks "Update Available" button
     */
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[ServiceWorker] Cache cleared');
        });
    }
});

/**
 * ============================================================
 * BACKGROUND SYNC (Optional - for future features)
 * ============================================================
 * 
 * If you add features that need to sync data when online,
 * you can use Background Sync API here.
 * 
 * Example: Save recorded clips to cloud storage when connection restored
 */
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    // ADJUSTMENT: Add sync handlers for specific tags
    // if (event.tag === 'sync-recordings') {
    //     event.waitUntil(syncRecordings());
    // }
});

/**
 * ============================================================
 * PUSH NOTIFICATIONS (Optional - for future features)
 * ============================================================
 * 
 * If you add push notification support, handle incoming
 * push messages here.
 * 
 * Example: Notify user of new app features
 */
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received');
    
    // ADJUSTMENT: Add push notification handling
    // const data = event.data.json();
    // event.waitUntil(
    //     self.registration.showNotification(data.title, {
    //         body: data.body,
    //         icon: '/icons/icon-192.png'
    //     })
    // );
});
