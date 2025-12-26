// ============================================
// auth.js - Firebase Authentication (Updated)
// ============================================

/**
 * Switch between login tabs (Admin, Faculty, Student)
 */
function switchLoginTab(role) {
  document.querySelectorAll(".login-tab").forEach((t) => {
    t.classList.remove("active");
  });
  
  document.querySelector(`.login-tab[data-role="${role}"]`)?.classList.add("active");
  
  document.querySelectorAll(".login-form").forEach((f) => {
    f.classList.remove("active");
  });
  
  document.getElementById(role + "LoginForm")?.classList.add("active");
  
  // Clear error messages
  document.querySelectorAll(".alert-error").forEach((e) => {
    e.style.display = "none";
    e.textContent = "";
  });
}

/**
 * Handle Admin Login
 */
async function handleAdminLogin(event) {
  event.preventDefault();
  
  const password = document.getElementById("adminPassword").value;
  const errorDiv = document.getElementById("adminLoginError");
  
  if (!password) {
    errorDiv.textContent = "❌ Password required";
    errorDiv.style.display = "block";
    return;
  }
  
  if (password === ADMIN_PASSWORD) {
    const adminUser = {
      id: "admin-001",
      role: "admin",
      name: "Admin User",
      firstName: "Admin",
      lastName: "User"
    };
    
    completeLogin("admin", adminUser);
  } else {
    errorDiv.textContent = "❌ Incorrect Admin Password";
    errorDiv.style.display = "block";
  }
}

/**
 * Handle Faculty Login
 */
async function handleFacultyLogin(event) {
  event.preventDefault();
  
  const facultyId = document.getElementById("loginFacultyId").value;
  const password = document.getElementById("loginFacultyPassword").value;
  const errorDiv = document.getElementById("facultyLoginError");
  
  if (!facultyId || !password) {
    errorDiv.textContent = "❌ Faculty ID and password required";
    errorDiv.style.display = "block";
    return;
  }
  
  try {
    // Query Firebase for faculty
    const allFaculty = await getAll("faculty");
    const facultyMember = allFaculty.find(
      (f) => f.facultyId === facultyId || f.id === facultyId
    );
    
    if (!facultyMember) {
      errorDiv.textContent = "❌ Faculty ID not found";
      errorDiv.style.display = "block";
      return;
    }
    
    // Check password
    const storedPassword = facultyMember.password || "password123";
    if (password === storedPassword) {
      completeLogin("faculty", facultyMember);
    } else {
      errorDiv.textContent = "❌ Incorrect Password";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Faculty login error:", error);
    errorDiv.textContent = "❌ Login failed. Try again.";
    errorDiv.style.display = "block";
  }
}

/**
 * Handle Student Login
 */
async function handleStudentLogin(event) {
  event.preventDefault();
  
  const rollNo = document.getElementById("loginStudentId").value;
  const errorDiv = document.getElementById("studentLoginError");
  
  if (!rollNo) {
    errorDiv.textContent = "❌ Roll Number required";
    errorDiv.style.display = "block";
    return;
  }
  
  try {
    // Query Firebase for student
    const allStudents = await getAll("students");
    const student = allStudents.find((s) => s.rollNo === rollNo);
    
    if (student) {
      completeLogin("student", student);
    } else {
      errorDiv.textContent = "❌ Student Roll No not found";
      errorDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Student login error:", error);
    errorDiv.textContent = "❌ Login failed. Try again.";
    errorDiv.style.display = "block";
  }
}

/**
 * Complete the login process
 */
function completeLogin(role, userData) {
  currentUser = {
    role,
    ...userData
  };
  
  // Save to sessionStorage for session persistence
  saveSession(currentUser);
  
  // Hide login overlay
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
  
  // Update UI
  const firstName = userData.firstName || "User";
  const lastName = userData.lastName || "";
  const displayName = role === "admin" ? "Admin User" : `${firstName} ${lastName}`;
  
  document.getElementById("loggedInUser").textContent = displayName;
  document.getElementById("roleBadge").textContent = role.toUpperCase();
  
  // Clear previous panels
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.remove("active");
  });
  
  // Show password change button for admin/faculty
  const passwordChangeBtn = document.getElementById("passwordChangeBtn");
  if (passwordChangeBtn) {
    passwordChangeBtn.style.display = role === "admin" || role === "faculty" ? "inline-block" : "none";
  }
  
  // Load role-specific content
  document.getElementById(role + "Panel").classList.add("active");
  
  if (role === "faculty") {
    populateFacultyClassDropdown();
    setTimeout(addMultiSessionButton, 500);
  } else if (role === "student") {
    populateStudentDashboard(userData);
  } else if (role === "admin") {
    populateFacultyClassDropdown();
    populateAdminClassFilter("all", "all");
  }
  
  // Clear form fields
  document.getElementById("adminPassword").value = "";
  document.getElementById("loginFacultyId").value = "";
  document.getElementById("loginFacultyPassword").value = "";
  document.getElementById("loginStudentId").value = "";
  
  showToast(`Welcome back, ${firstName}!`, "success");
}

/**
 * Handle Logout
 */
function handleLogout() {
  showConfirm("Are you sure you want to logout?", function () {
    currentUser = null;
    clearSession();
    
    // Clear UI
    document.getElementById("facultyClassSelect").innerHTML = "";
    document.getElementById("studentGrid").innerHTML = "";
    document.getElementById("studentGridContainer").style.display = "none";
    
    // Show login overlay
    document.getElementById("loginOverlay").style.display = "flex";
    document.getElementById("mainContainer").style.display = "none";
    
    showToast("Logged out successfully", "info");
  });
}

/**
 * Open password change modal
 */
function openPasswordChangeModal() {
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordChangeError").style.display = "none";
  
  openModal("passwordChangeModal");
  
  // Add password strength indicator
  const newPasswordInput = document.getElementById("newPassword");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", checkPasswordStrength);
  }
}

/**
 * Check password strength
 */
function checkPasswordStrength() {
  const password = document.getElementById("newPassword").value;
  const strengthDiv = document.getElementById("passwordStrength") || createPasswordStrengthIndicator();
  
  if (password.length === 0) {
    strengthDiv.className = "password-strength";
    return;
  }
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 1) {
    strengthDiv.className = "password-strength weak";
  } else if (strength <= 3) {
    strengthDiv.className = "password-strength medium";
  } else {
    strengthDiv.className = "password-strength strong";
  }
}

/**
 * Handle password change
 */
async function handlePasswordChange(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorDiv = document.getElementById("passwordChangeError");
  
  errorDiv.style.display = "none";
  
  // Validate
  if (!currentPassword) {
    showError("Current password is required");
    return;
  }
  
  if (newPassword.length < 6) {
    showError("New password must be at least 6 characters");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showError("New passwords do not match");
    return;
  }
  
  try {
    if (currentUser.role === "admin") {
      if (currentPassword !== ADMIN_PASSWORD) {
        showError("Current admin password is incorrect");
        return;
      }
      showError("Admin password change requires updating environment variable");
      return;
    }
    
    if (currentUser.role === "faculty") {
      // Get current faculty record
      const faculty = await getRecord("faculty", currentUser.id);
      if (!faculty) {
        showError("Faculty member not found");
        return;
      }
      
      const storedPassword = faculty.password || "password123";
      if (currentPassword !== storedPassword) {
        showError("Current password is incorrect");
        return;
      }
      
      // Update password in Firebase
      faculty.password = newPassword;
      await updateRecord("faculty", faculty);
      
      showToast("Password changed successfully!", "success");
      closeModal("passwordChangeModal");
    }
  } catch (error) {
    console.error("Password change error:", error);
    showError("An error occurred. Please try again.");
  }
  
  function showError(message) {
    errorDiv.textContent = "❌ " + message;
    errorDiv.style.display = "block";
  }
}
