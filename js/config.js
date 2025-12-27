// ============================================
// config.js - Firebase Configuration
// ============================================

// Firebase Configuration
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

const ADMIN_PASSWORD = "GecKaimur@148";


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
let db;
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
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.database(app);
    
    console.log("✅ Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showToast("Failed to initialize Firebase. Check console.", "error");
    return false;
  }
}
