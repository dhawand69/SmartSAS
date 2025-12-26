// Firebase Realtime Database Wrapper
// Replace IndexedDB with real-time sync capabilities

import { 
  ref, 
  set, 
  get, 
  push, 
  remove, 
  onValue, 
  update,
  query,
  orderByChild,
  equalTo,
  limitToLast
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

import { realtimeDb } from './firebase-config.js';

// Store active listeners for cleanup
const activeListeners = new Map();

/**
 * Initialize Firebase Database
 * Replaces initDB() from old database.js
 */
async function initDB() {
  try {
    console.log('✅ Firebase Realtime Database initialized');
    return Promise.resolve(true);
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return Promise.reject(error);
  }
}

/**
 * Add new record with auto-ID
 * @param {string} storeName - Collection name (students, faculty, classes, etc.)
 * @param {object} data - Record data
 * @returns {Promise<string>} - Document ID
 */
async function addRecord(storeName, data) {
  try {
    const newRef = push(ref(realtimeDb, storeName));
    const recordData = {
      ...data,
      id: newRef.key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(newRef, recordData);
    console.log(`✅ Record added to ${storeName}:`, newRef.key);
    return newRef.key;
  } catch (error) {
    console.error(`❌ Error adding record to ${storeName}:`, error);
    throw error;
  }
}

/**
 * Update existing record
 * @param {string} storeName - Collection name
 * @param {object} data - Record data with id
 * @returns {Promise<string>} - Document ID
 */
async function updateRecord(storeName, data) {
  try {
    if (!data.id) {
      throw new Error('Record must have an id property');
    }
    
    const recordRef = ref(realtimeDb, `${storeName}/${data.id}`);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await update(recordRef, updateData);
    console.log(`✅ Record updated in ${storeName}:`, data.id);
    return data.id;
  } catch (error) {
    console.error(`❌ Error updating record in ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get all records with real-time listener
 * @param {string} storeName - Collection name
 * @param {function} onUpdate - Callback when data changes
 * @returns {Promise<array>} - Initial data
 */
async function getAll(storeName, onUpdate = null) {
  try {
    const dbRef = ref(realtimeDb, storeName);
    
    return new Promise((resolve, reject) => {
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          const data = [];
          snapshot.forEach((childSnapshot) => {
            data.push(childSnapshot.val());
          });
          
          // If callback provided, notify on every change (real-time sync)
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate(data);
          }
          
          resolve(data);
        },
        (error) => {
          console.error(`❌ Error getting data from ${storeName}:`, error);
          reject(error);
        }
      );
      
      // Store listener for cleanup
      if (!activeListeners.has(storeName)) {
        activeListeners.set(storeName, []);
      }
      activeListeners.get(storeName).push(unsubscribe);
    });
  } catch (error) {
    console.error(`❌ Error in getAll for ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get single record by ID
 * @param {string} storeName - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<object>} - Record data
 */
async function getRecord(storeName, id) {
  try {
    const recordRef = ref(realtimeDb, `${storeName}/${id}`);
    const snapshot = await get(recordRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn(`⚠️ Record not found: ${storeName}/${id}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error getting record from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Delete record by ID
 * @param {string} storeName - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
async function deleteRecord(storeName, id) {
  try {
    const recordRef = ref(realtimeDb, `${storeName}/${id}`);
    await remove(recordRef);
    console.log(`✅ Record deleted from ${storeName}:`, id);
  } catch (error) {
    console.error(`❌ Error deleting record from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Clear entire collection
 * @param {string} storeName - Collection name
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  try {
    const storeRef = ref(realtimeDb, storeName);
    await remove(storeRef);
    console.log(`✅ Collection cleared: ${storeName}`);
  } catch (error) {
    console.error(`❌ Error clearing ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get records by field value (e.g., students by department)
 * @param {string} storeName - Collection name
 * @param {string} field - Field name
 * @param {any} value - Field value to match
 * @param {function} onUpdate - Callback for real-time updates
 * @returns {Promise<array>} - Matching records
 */
async function getRecordsByField(storeName, field, value, onUpdate = null) {
  try {
    const dbRef = ref(realtimeDb, storeName);
    
    return new Promise((resolve, reject) => {
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          const data = [];
          snapshot.forEach((childSnapshot) => {
            const record = childSnapshot.val();
            if (record[field] === value) {
              data.push(record);
            }
          });
          
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate(data);
          }
          
          resolve(data);
        },
        (error) => reject(error)
      );
      
      if (!activeListeners.has(storeName)) {
        activeListeners.set(storeName, []);
      }
      activeListeners.get(storeName).push(unsubscribe);
    });
  } catch (error) {
    console.error(`❌ Error in getRecordsByField:`, error);
    throw error;
  }
}

/**
 * Setup real-time listener for attendance changes
 * @param {string} classId - Class ID to listen to
 * @param {function} callback - Function called when attendance changes
 * @returns {function} - Unsubscribe function
 */
function listenToAttendance(classId, callback) {
  try {
    const attendanceRef = ref(realtimeDb, `attendance/${classId}`);
    
    const unsubscribe = onValue(attendanceRef, (snapshot) => {
      const attendanceRecords = [];
      snapshot.forEach((childSnapshot) => {
        attendanceRecords.push(childSnapshot.val());
      });
      callback(attendanceRecords);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up attendance listener:', error);
    throw error;
  }
}

/**
 * Batch update multiple records
 * @param {string} storeName - Collection name
 * @param {array} records - Array of records to update
 * @returns {Promise<void>}
 */
async function batchUpdateRecords(storeName, records) {
  try {
    const updates = {};
    
    records.forEach(record => {
      if (!record.id) {
        throw new Error('All records must have an id property');
      }
      updates[`${storeName}/${record.id}`] = {
        ...record,
        updatedAt: new Date().toISOString()
      };
    });
    
    // Update all records simultaneously
    await update(ref(realtimeDb), updates);
    console.log(`✅ Batch update completed for ${storeName}`);
  } catch (error) {
    console.error(`❌ Error in batch update:`, error);
    throw error;
  }
}

/**
 * Cleanup all listeners for memory management
 */
function cleanupAllListeners() {
  activeListeners.forEach((listeners, storeName) => {
    listeners.forEach(unsubscribe => unsubscribe());
    console.log(`🧹 Cleaned up listeners for ${storeName}`);
  });
  activeListeners.clear();
}

/**
 * Get database statistics
 * @returns {Promise<object>} - Stats object
 */
async function getDatabaseStats() {
  try {
    const stats = {};
    const stores = ['students', 'faculty', 'classes', 'attendance', 'years'];
    
    for (const store of stores) {
      const data = await getAll(store);
      stats[store] = data.length;
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    throw error;
  }
}

// Export all functions
export {
  initDB,
  addRecord,
  updateRecord,
  getAll,
  getRecord,
  deleteRecord,
  clearStore,
  getRecordsByField,
  listenToAttendance,
  batchUpdateRecords,
  cleanupAllListeners,
  getDatabaseStats
};
