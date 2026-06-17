// ============================================================
//  SERVICE WORKER - OFFLINE MAP CACHING
// ============================================================

var CACHE_NAME = 'athos-map-v1';

// Εγκατάσταση - αποθήκευση βασικών αρχείων
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                '/',
                '/PloigisiR.html',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
                'https://cdn.jsdelivr.net/npm/@mapbox/togeojson@0.16.0/togeojson.min.js'
            ]);
        })
    );
});

// Ενεργοποίηση
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Αναχαίτιση αιτημάτων
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);
    
    // Αναχαίτιση αιτημάτων για tiles του OpenStreetMap
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.match(event.request).then(function(response) {
                // Αν βρεθεί στην cache, επέστρεψέ το
                if (response) {
                    return response;
                }
                // Αλλιώς κάνε fetch και αποθήκευσε
                return fetch(event.request).then(function(response) {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                }).catch(function() {
                    // Αν αποτύχει και το fetch, επιστρέφω ένα placeholder tile
                    return new Response(
                        '<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="256" height="256" fill="#ddd"/><text x="50%" y="50%" font-family="Arial" font-size="20" fill="#999" text-anchor="middle" dy=".3em">Offline</text></svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                });
            })
        );
        return;
    }
    
    // Για άλλα αιτήματα, προσπάθησε από cache πρώτα
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
