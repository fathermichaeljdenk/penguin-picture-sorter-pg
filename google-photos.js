// google-photos.js — Google Photos Library API integration
// Fetches all photos from a user-selected album using the Library API
// Uses Google Identity Services for client-side OAuth 2.0 auth (no backend needed)

(function (window) {
  'use strict';

  // ---- Configuration ----
  // Replace CLIENT_ID with your OAuth 2.0 client ID from Google Cloud Console
  // Enable the "Google Photos Library API" and "Google Identity Services"
  const CLIENT_ID = '[REDACTED].apps.googleusercontent.com';
  const API_BASE = 'https://photoslibrary.googleapis.com/v1';
  const SCOPES = [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata'
  ];

  // ---- Auth State ----
  let accessToken = null;
  let tokenExpiry = 0;
  let isInitialized = false;

  /**
   * Initialize Google Identity Services token client lazily.
   * Loads the required Google scripts and creates a token client.
   */
  function initGis() {
    if (isInitialized) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      // Load Google Identity Services script if not already loaded
      var gisScriptId = 'gapi-gis-script';
      if (!document.getElementById(gisScriptId)) {
        var script = document.createElement('script');
        script.id = gisScriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = function () {
          tryInitTokenClient(resolve, reject);
        };
        script.onerror = function () {
          reject(new Error('Failed to load Google Identity Services script'));
        };
        document.head.appendChild(script);
      } else if (typeof google !== 'undefined' && google.accounts) {
        tryInitTokenClient(resolve, reject);
      } else {
        // Script loaded but not ready yet
        var tries = 0;
        var MAX_TRIES = 20;
        var wait = function () {
          if (typeof google !== 'undefined' && google.accounts) {
            tryInitTokenClient(resolve, reject);
          } else {
            tries++;
            if (tries > MAX_TRIES) {
              reject(new Error('Google Identity Services failed to initialize'));
              return;
            }
            setTimeout(wait, 250);
          }
        };
        wait();
      }
    });
  }

  function tryInitTokenClient(resolve, reject) {
    try {
      var tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES.join(' '),
        callback: function (response) {
          accessToken = response.access_token;
          tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000;
          if (typeof resolve === 'function') resolve(response);
        }
      });
      window._gpTokenClient = tokenClient;
      isInitialized = true;
      resolve();
    } catch (err) {
      reject(new Error('Failed to initialize token client: ' + (err.message || String(err))));
    }
  }

  /**
   * Request OAuth token using Google Identity Services.
   * Must be called from a user gesture (e.g., button click).
   * Returns a Promise that resolves to the token response.
   */
  function authenticate() {
    return initGis().then(function () {
      // Return cached token if still valid
      if (accessToken && Date.now() < tokenExpiry) {
        return { access_token: accessToken, expires_in: (tokenExpiry - Date.now()) / 1000 };
      }

      // Prompt user via browser popup (requires user activation)
      var tc = window._gpTokenClient;
      if (!tc) {
        throw new Error('Token client not initialized');
      }

      return new Promise(function (resolve, reject) {
        // Clear any previous token to avoid resolving with stale data
        accessToken = null;

        // The token client callback will set accessToken when the user responds
        tc.requestAccessToken({ prompt: 'popup' });

        var startWait = Date.now();
        var checkToken = function () {
          if (accessToken) {
            resolve({ access_token: accessToken, expires_in: (tokenExpiry - Date.now()) / 1000 });
          } else if (Date.now() - startWait > 15000) {
            reject(new Error('Authentication timed out. Please try again.'));
          } else {
            setTimeout(checkToken, 250);
          }
        };
        checkToken();
      });
    });
  }

  /**
   * List all albums available in the user's Google Photos library.
   * Returns an array of album objects with id, title, and mediaItemsCount.
   * Automatically handles pagination.
   */
  function listAlbums() {
    return authenticate().then(function (token) {
      var headers = { 'Authorization': 'Bearer ' + token.access_token };
      var albums = [];
      var pageToken = null;

      function fetchPage(pageToken) {
        var params = new URLSearchParams({
          pageSize: '50'
        });
        if (pageToken) {
          params.set('pageToken', pageToken);
        }

        var url = API_BASE + '/albums?' + params.toString();
        return fetch(url, { headers: headers }).then(function (res) {
          if (!res.ok) {
            return res.text().then(function (errText) {
              throw new Error('Failed to list albums (' + res.status + '): ' + errText);
            });
          }
          return res.json();
        }).then(function (data) {
          albums = albums.concat(data.albums || []);
          if (data.nextPageToken) {
            return fetchPage(data.nextPageToken);
          }
          return albums;
        });
      }

      return fetchPage(pageToken);
    });
  }

  /**
   * Fetch ALL media items (photos) from a specific album.
   * Uses the mediaItems.search endpoint with automatic pagination
   * to retrieve every item — no artificial limit.
   *
   * @param {string} albumId - The Google Photos album ID
   * @param {function} onProgress - Optional progress callback (currentCount, totalCount)
   * @returns {Promise<Array>} Array of media item objects
   */
  function fetchAllPhotosFromAlbum(albumId, onProgress) {
    if (!albumId) {
      throw new Error('Album ID is required');
    }

    return authenticate().then(function (token) {
      var headers = { 'Authorization': 'Bearer ' + token.access_token };
      var allMediaItems = [];
      var nextPageToken = null;

      function fetchPage(nextPageToken) {
        var body = {
          albumId: albumId
        };
        if (nextPageToken) {
          body.pageToken = nextPageToken;
        }

        return fetch(API_BASE + '/mediaItems:search', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(function (res) {
          if (!res.ok) {
            return res.text().then(function (errText) {
              throw new Error('Failed to fetch photos from album (' + res.status + '): ' + errText);
            });
          }
          return res.json();
        }).then(function (data) {
          var items = data.mediaItems || [];

          // Only select actual photos (exclude videos — mimeType starts with 'image/')
          var photos = items.filter(function (item) {
            return item.mimeType && item.mimeType.indexOf('image/') === 0;
          });

          allMediaItems = allMediaItems.concat(photos);

          if (typeof onProgress === 'function') {
            onProgress(allMediaItems.length);
          }

          if (data.nextPageToken) {
            return fetchPage(data.nextPageToken);
          }
          return allMediaItems;
        });
      }

      return fetchPage(null);
    });
  }

  /**
   * Public API exposed on window.GooglePhotosAPI
   */
  window.GooglePhotosAPI = {
    CLIENT_ID: CLIENT_ID,
    authenticate: authenticate,
    listAlbums: listAlbums,
    fetchAllPhotosFromAlbum: fetchAllPhotosFromAlbum
  };

})(window);
