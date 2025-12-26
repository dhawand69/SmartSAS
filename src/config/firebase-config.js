// Firebase Configuration
// IMPORTANT: Replace the values below with your actual Firebase project credentials

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// ========================================
// STEP 1: Get these values from Firebase Console
// https://console.firebase.google.com/
// ========================================
// 
// Instructions:
// 1. Go to Firebase Console
// 2. Select your project
// 3. Click gear icon (⚙️) in top left
// 4. Go to "Project Settings"
// 5. Scroll down to "Your Apps" section
// 6. Find your Web app, click on config
// 7. Copy each value and paste below
//

const firebaseConfig = {
  // 🔑 REPLACE THESE WITH YOUR FIREBASE CREDENTIALS
  
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",              // ← CHANGE THIS
  authDomain: "your-project-id.firebaseapp.com",   // ← CHANGE THIS
  projectId: "your-project-id",                     // ← CHANGE THIS
  storageBucket: "your-project-id.appspot.com",     // ← CHANGE THIS
  messagingSenderId: "123456789",                   // ← CHANGE THIS
  appId: "1:123456789:web:abcdef1234567890",        // ← CHANGE THIS
  databaseURL: "https://your-project-id.firebaseio.com"  // ← CHANGE THIS (IMPORTANT!)
};

// ========================================
// STEP 2: Initialize Firebase
// ========================================

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);

console.log('✅ Firebase initialized successfully');

// ========================================
// OPTIONAL: Enable offline persistence
// (uncomment if you want offline support)
// ========================================

// import { enableLogging } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
// enableLogging(true); // Set to true for debugging, false for production
