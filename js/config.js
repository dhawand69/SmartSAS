// ============================================
// config.js - Firebase Configuration
// ============================================

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD...", // Replace with your config
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "attendance-system.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://attendance-system.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "attendance-system",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "attendance-system.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcd1234efgh5678"
};

// Admin Password (stored in Netlify env vars)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "GecKaimur@148";

// Branch Map
const branchMap = {
  101: "Civil",
  102: "Mechanical",
  103: "Electrical",
  104: "ECE",
  152: "CSE(Cyber Security)",
  156: "CSE(Networks)"
};

// Global Variables
let db; // Firebase Database instance
let currentUser = null;

// Filters
let activeStudentFilter = {
  year: "all",
  semester: null,
  branch: "all"
};

let activeClassFilter = {
  year: "all",
  semester: null
};

// UI State
let displayedStudents = [];
let selectedStudentIds = new Set();
let pendingAction = null;
let parsedBatchClasses = [];

// ============================================
// Firebase Initialization
// ============================================

async function initFirebase() {
  try {
    // Import Firebase modules
    const app = window.firebase.initializeApp(firebaseConfig);
    db = window.firebase.database(app);
    
    console.log("✅ Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showToast("Failed to initialize Firebase. Check console.", "error");
    return false;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, ADMIN_PASSWORD, branchMap };
}
