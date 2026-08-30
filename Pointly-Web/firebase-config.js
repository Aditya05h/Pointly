/**
 * Pointly Firebase Configuration & Authentication Service
 * ─────────────────────────────────────────────────────────
 * Connected to Firebase project: pointlyapp
 */

(function () {
  'use strict';

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyBmcM7Bu9JWauttrPClZivRRzbzn_YgOac",
    authDomain: "pointlyapp.firebaseapp.com",
    projectId: "pointlyapp",
    storageBucket: "pointlyapp.firebasestorage.app",
    messagingSenderId: "560996752819",
    appId: "1:560996752819:web:7b4850a65b5a2be6ab3fc6"
  };

  window.firebaseConfig = firebaseConfig;

  // Initialize Firebase App & Auth with Google Auth Provider
  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      window.auth = firebase.auth();
      window.googleProvider = new firebase.auth.GoogleAuthProvider();
      window.googleProvider.setCustomParameters({ prompt: 'select_account' });
      window.isFirebaseConfigured = true;
      console.info('[Pointly Auth] Firebase initialized successfully with project pointlyapp.');
    } catch (err) {
      console.warn('[Pointly Auth] Firebase initialization error:', err.message);
      window.isFirebaseConfigured = false;
    }
  } else {
    console.warn('[Pointly Auth] Firebase SDK loading issue.');
    window.isFirebaseConfigured = false;
  }
})();
