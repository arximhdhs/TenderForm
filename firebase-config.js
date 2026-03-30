// =============================================================================
// Firebase Configuration for Tender Landing Page
// =============================================================================
//
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use an existing one)
// 3. Enable these Firebase products:
//    - Firestore Database (create in production mode, then add rules)
//    - Analytics (enabled by default)
// 4. Go to Project Settings > General > Your apps > Add web app
// 5. Copy the config values below and replace the placeholders
//
// FIRESTORE RULES (paste in Firestore > Rules):
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /submissions/{document} {
//         allow create: if true;
//         allow read, update, delete: if false;
//       }
//     }
//   }
//
// =============================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDbfax70HvEd_IGwsdC43lzlahMKPo5zxY",
    authDomain: "tendervalidationsite.firebaseapp.com",
    projectId: "tendervalidationsite",
    storageBucket: "tendervalidationsite.firebasestorage.app",
    messagingSenderId: "819603673424",
    appId: "1:819603673424:web:0d0b73f1fb34b41932dc55",
    measurementId: "G-1ZDM11L90S"
  };

// Export for use in script.js
window.TENDER_FIREBASE_CONFIG = firebaseConfig;
