// Firebase Configuration
// Your actual Firebase credentials

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFbxV129SYgkMro-i4lcCQKP9WesuzQZ4",
  authDomain: "attendance-system-produc-c869a.firebaseapp.com",
  databaseURL: "https://attendance-system-produc-c869a-default-rtdb.firebaseio.com",
  projectId: "attendance-system-produc-c869a",
  storageBucket: "attendance-system-produc-c869a.firebasestorage.app",
  messagingSenderId: "564725590338",
  appId: "1:564725590338:web:11d297823e7f15920340db",
  measurementId: "G-6WRXV7QPG6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);

console.log('✅ Firebase initialized successfully');
console.log('🗄️ Database URL:', firebaseConfig.databaseURL);
console.log('🔐 Project ID:', firebaseConfig.projectId);
