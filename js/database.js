// ============================================
// database.js - Firebase Database Wrapper
// Replaces IndexedDB operations
// ============================================

/**
 * Add a new record to Firebase
 * @param {string} storeName - Collection name (students, faculty, classes, etc)
 * @param {object} data - Data to add
 * @returns {Promise<string>} - Record key
 */
async function addRecord(storeName, data) {
  try {
    const ref = window.firebase.database().ref(storeName);
    const newRef = ref.push();
    
    // Add timestamp and ID
    data.id = newRef.key;
    data.createdAt = new Date().toISOString();
    
    await newRef.set(data);
    console.log(`✅ Added to ${storeName}:`, data.id);
    return data.id;
  } catch (error) {
    console.error(`❌ Error adding record to ${storeName}:`, error);
    throw error;
  }
}

/**
 * Update an existing record in Firebase
 * @param {string} storeName - Collection name
 * @param {object} data - Data object with 'id' property
 * @returns {Promise<void>}
 */
async function updateRecord(storeName, data) {
  try {
    if (!data.id) throw new Error("Record must have an 'id' property");
    
    const recordId = data.id;
    const updateData = { ...data };
    delete updateData.id; // Remove id from update
    
    updateData.updatedAt = new Date().toISOString();
    
    await window.firebase
      .database()
      .ref(`${storeName}/${recordId}`)
      .update(updateData);
    
    console.log(`✅ Updated ${storeName}/${recordId}`);
  } catch (error) {
    console.error(`❌ Error updating record in ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get all records from a collection
 * @param {string} storeName - Collection name
 * @returns {Promise<Array>} - Array of records with id
 */
async function getAll(storeName) {
  try {
    const snapshot = await window.firebase
      .database()
      .ref(storeName)
      .once("value");
    
    const records = [];
    snapshot.forEach((childSnapshot) => {
      const record = childSnapshot.val();
      if (record) {
        record.id = childSnapshot.key;
        records.push(record);
      }
    });
    
    console.log(`✅ Fetched ${records.length} records from ${storeName}`);
    return records;
  } catch (error) {
    console.error(`❌ Error fetching all records from ${storeName}:`, error);
    return [];
  }
}

/**
 * Get a single record by ID
 * @param {string} storeName - Collection name
 * @param {string} id - Record ID
 * @returns {Promise<object|null>}
 */
async function getRecord(storeName, id) {
  try {
    const snapshot = await window.firebase
      .database()
      .ref(`${storeName}/${id}`)
      .once("value");
    
    const record = snapshot.val();
    if (record) {
      record.id = id;
      console.log(`✅ Fetched record ${storeName}/${id}`);
      return record;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error fetching record ${storeName}/${id}:`, error);
    return null;
  }
}

/**
 * Delete a record from Firebase
 * @param {string} storeName - Collection name
 * @param {string} id - Record ID
 * @returns {Promise<void>}
 */
async function deleteRecord(storeName, id) {
  try {
    await window.firebase
      .database()
      .ref(`${storeName}/${id}`)
      .remove();
    
    console.log(`✅ Deleted ${storeName}/${id}`);
  } catch (error) {
    console.error(`❌ Error deleting record from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Clear all records from a collection
 * @param {string} storeName - Collection name
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  try {
    await window.firebase
      .database()
      .ref(storeName)
      .remove();
    
    console.log(`✅ Cleared ${storeName}`);
  } catch (error) {
    console.error(`❌ Error clearing ${storeName}:`, error);
    throw error;
  }
}

/**
 * Query records with a filter
 * @param {string} storeName - Collection name
 * @param {string} field - Field to filter by
 * @param {*} value - Value to match
 * @returns {Promise<Array>}
 */
async function queryRecords(storeName, field, value) {
  try {
    const snapshot = await window.firebase
      .database()
      .ref(storeName)
      .orderByChild(field)
      .equalTo(value)
      .once("value");
    
    const records = [];
    snapshot.forEach((childSnapshot) => {
      const record = childSnapshot.val();
      if (record) {
        record.id = childSnapshot.key;
        records.push(record);
      }
    });
    
    console.log(`✅ Found ${records.length} records in ${storeName} where ${field}=${value}`);
    return records;
  } catch (error) {
    console.error(`❌ Error querying ${storeName}:`, error);
    return [];
  }
}

/**
 * Listen to real-time changes in a collection
 * @param {string} storeName - Collection name
 * @param {Function} callback - Called when data changes
 * @returns {Function} - Unsubscribe function
 */
function listenToCollection(storeName, callback) {
  try {
    const ref = window.firebase.database().ref(storeName);
    
    ref.on("value", (snapshot) => {
      const records = [];
      snapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        if (record) {
          record.id = childSnapshot.key;
          records.push(record);
        }
      });
      callback(records);
    });
    
    // Return unsubscribe function
    return () => {
      ref.off("value");
      console.log(`✅ Stopped listening to ${storeName}`);
    };
  } catch (error) {
    console.error(`❌ Error setting up listener for ${storeName}:`, error);
    return () => {};
  }
}

/**
 * Batch update multiple records
 * @param {string} storeName - Collection name
 * @param {Array<object>} records - Records to update
 * @returns {Promise<void>}
 */
async function batchUpdate(storeName, records) {
  try {
    const updates = {};
    
    records.forEach((record) => {
      const recordId = record.id;
      const updateData = { ...record };
      delete updateData.id;
      updates[`${storeName}/${recordId}`] = updateData;
    });
    
    await window.firebase.database().ref().update(updates);
    console.log(`✅ Batch updated ${records.length} records in ${storeName}`);
  } catch (error) {
    console.error(`❌ Error in batch update:`, error);
    throw error;
  }
}

/**
 * Delete class and cleanup
 * @param {string} id - Class ID
 * @returns {Promise<void>}
 */
async function deleteClass(id) {
  showConfirm("Delete this class?", async function () {
    try {
      await deleteRecord("classes", id);
      showToast("Class deleted successfully", "info");
      loadClasses();
      loadFaculty();
    } catch (error) {
      showToast("Error deleting class", "error");
    }
  });
}

/**
 * Delete academic year
 * @param {string} id - Year ID
 * @returns {Promise<void>}
 */
async function deleteYear(id) {
  showConfirm("Delete this academic year?", async function () {
    try {
      await deleteRecord("years", id);
      showToast("Academic year deleted", "info");
      loadYears();
    } catch (error) {
      showToast("Error deleting year", "error");
    }
  });
}

/**
 * Load and display student dashboard
 * @param {object} student - Student object
 * @returns {Promise<void>}
 */
async function populateStudentDashboard(student) {
  try {
    document.getElementById("studentNameDisplay").textContent = 
      `${student.firstName} ${student.lastName}`;
    document.getElementById("studentRollDisplay").textContent = 
      `Roll No: ${student.rollNo}`;
    document.getElementById("studentEmailDisplay").textContent = 
      student.email || "N/A";
    document.getElementById("studentDeptDisplay").textContent = 
      student.department;
    document.getElementById("studentSemDisplay").textContent = 
      student.semester;
    document.getElementById("studentYearDisplay").textContent = 
      student.year;
    
    await loadStudentStats(student.id);
  } catch (error) {
    console.error("Error populating student dashboard:", error);
  }
}

// Database initialization function (called from main.js)
async function initDB() {
  try {
    // Firebase initialization happens in config.js via initFirebase()
    console.log("✅ Database layer initialized with Firebase");
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    return false;
  }
}
