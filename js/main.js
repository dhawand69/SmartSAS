// ============================================
// main.js - Firebase + Netlify Main Entry Point
// ============================================

let appReady = false;

/**
 * Initialize the entire application
 */
async function initializeApp() {
  try {
    console.log("🚀 Starting application initialization...");
    
    // Step 1: Wait for Firebase SDK to load
    await waitForFirebaseSDK();
    console.log("✅ Firebase SDK loaded");
    
    // Step 2: Initialize Firebase
    const firebaseInit = await initFirebase();
    if (!firebaseInit) {
      throw new Error("Firebase initialization failed");
    }
    console.log("✅ Firebase initialized");
    
    // Step 3: Initialize Database layer
    await initDB();
    console.log("✅ Database initialized");
    
    // Step 4: Setup UI
    setupEventListeners();
    console.log("✅ Event listeners setup");
    
    // Step 5: Check for active session
    checkActiveSession();
    
    appReady = true;
    console.log("✅ Application ready!");
    
  } catch (error) {
    console.error("❌ Application initialization failed:", error);
    showToast("Failed to initialize application. Check console.", "error");
  }
}

/**
 * Wait for Firebase SDK to be available
 * (loads from CDN)
 */
function waitForFirebaseSDK() {
  return new Promise((resolve) => {
    const checkSDK = setInterval(() => {
      if (window.firebase && window.firebase.database) {
        clearInterval(checkSDK);
        resolve();
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkSDK);
      resolve();
    }, 10000);
  });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Login form event listeners
  const adminLoginForm = document.getElementById("adminLoginForm");
  const facultyLoginForm = document.getElementById("facultyLoginForm");
  const studentLoginForm = document.getElementById("studentLoginForm");
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", handleAdminLogin);
  }
  
  if (facultyLoginForm) {
    facultyLoginForm.addEventListener("submit", handleFacultyLogin);
  }
  
  if (studentLoginForm) {
    studentLoginForm.addEventListener("submit", handleStudentLogin);
  }
  
  // Login tab switches
  const loginTabs = document.querySelectorAll(".login-tab");
  loginTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const role = e.target.dataset.role;
      if (role) switchLoginTab(role);
    });
  });
  
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  
  // Password change button
  const passwordChangeBtn = document.getElementById("passwordChangeBtn");
  if (passwordChangeBtn) {
    passwordChangeBtn.addEventListener("click", openPasswordChangeModal);
  }
}

/**
 * Check if user has an active session
 */
function checkActiveSession() {
  try {
    const sessionData = sessionStorage.getItem("currentUser");
    if (sessionData) {
      const user = JSON.parse(sessionData);
      currentUser = user;
      document.getElementById("loginOverlay").style.display = "none";
      document.getElementById("mainContainer").style.display = "block";
      
      // Load user-specific data
      if (user.role === "faculty") {
        populateFacultyClassDropdown();
      } else if (user.role === "student") {
        populateStudentDashboard(user);
      } else if (user.role === "admin") {
        populateFacultyClassDropdown();
        populateAdminClassFilter("all", "all");
      }
      
      console.log("✅ Session restored for:", user.role);
    }
  } catch (error) {
    console.log("No active session found");
  }
}

/**
 * Save session to sessionStorage
 */
function saveSession(user) {
  try {
    sessionStorage.setItem("currentUser", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

/**
 * Clear session from sessionStorage
 */
function clearSession() {
  try {
    sessionStorage.removeItem("currentUser");
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

// ============================================
// Auto-initialize when DOM is ready
// ============================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
