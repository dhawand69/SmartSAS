// ============================================
// migrateData.js - Export/Import IndexedDB to Firebase
// ============================================

/**
 * Export all IndexedDB data as JSON
 * Run this in browser console before migration
 */
async function exportIndexedDBData() {
  try {
    console.log("📥 Exporting IndexedDB data...");
    
    const db = window.indexedDB.open("AdvancedAttendanceDB", 2);
    
    return new Promise((resolve, reject) => {
      db.onsuccess = () => {
        const idb = db.result;
        const stores = ["students", "faculty", "classes", "attendance", "settings", "years"];
        const exportData = {};
        
        Promise.all(
          stores.map((storeName) => {
            return new Promise((resolveStore) => {
              const transaction = idb.transaction([storeName], "readonly");
              const objectStore = transaction.objectStore(storeName);
              const getAllRequest = objectStore.getAll();
              
              getAllRequest.onsuccess = () => {
                exportData[storeName] = getAllRequest.result;
                resolveStore();
              };
            });
          })
        ).then(() => {
          const json = JSON.stringify(exportData, null, 2);
          console.log("✅ Export complete. Copy the JSON below:");
          console.log(json);
          
          // Auto-download file
          downloadJSON(json, "attendance-backup.json");
          resolve(exportData);
        });
      };
      
      db.onerror = () => reject(db.error);
    });
  } catch (error) {
    console.error("❌ Export failed:", error);
  }
}

/**
 * Download JSON data as file
 */
function downloadJSON(data, filename) {
  const dataStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📥 File downloaded: ${filename}`);
}

/**
 * Import data to Firebase (run AFTER exporting)
 * Paste the exported JSON and call: importToFirebase(exportedData)
 */
async function importToFirebase(data) {
  try {
    console.log("📤 Importing data to Firebase...");
    
    const stores = Object.keys(data);
    
    for (const storeName of stores) {
      const records = data[storeName];
      console.log(`\n⏳ Importing ${records.length} records to ${storeName}...`);
      
      for (const record of records) {
        try {
          const recordWithoutId = { ...record };
          const oldId = recordWithoutId.id;
          delete recordWithoutId.id;
          
          // Use old ID as Firebase key for consistency
          await firebase
            .database()
            .ref(`${storeName}/${oldId}`)
            .set(recordWithoutId);
          
          console.log(`  ✅ Added ${storeName}/${oldId}`);
        } catch (error) {
          console.error(`  ❌ Failed to add record:`, error);
        }
      }
    }
    
    console.log("\n✅ All data imported successfully!");
    return true;
  } catch (error) {
    console.error("❌ Import failed:", error);
    return false;
  }
}

/**
 * Verify data integrity
 */
async function verifyFirebaseData() {
  try {
    console.log("🔍 Verifying Firebase data...");
    
    const stores = ["students", "faculty", "classes", "attendance", "settings", "years"];
    
    for (const storeName of stores) {
      const snapshot = await firebase.database().ref(storeName).once("value");
      const count = snapshot.numChildren();
      console.log(`✅ ${storeName}: ${count} records`);
    }
    
    console.log("\n✅ Data verification complete!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

/**
 * Clear Firebase data (WARNING: Destructive!)
 */
async function clearFirebaseData() {
  if (!confirm("⚠️ WARNING: This will DELETE ALL Firebase data! Are you sure?")) {
    return false;
  }
  
  try {
    const stores = ["students", "faculty", "classes", "attendance", "settings", "years"];
    
    for (const storeName of stores) {
      await firebase.database().ref(storeName).remove();
      console.log(`✅ Cleared ${storeName}`);
    }
    
    console.log("\n✅ All Firebase data cleared!");
    return true;
  } catch (error) {
    console.error("❌ Clear operation failed:", error);
    return false;
  }
}

/**
 * Migration helper function
 * Combines export and import steps
 */
async function migrateData() {
  try {
    console.log("\n🚀 Starting data migration...\n");
    
    // Step 1: Export from IndexedDB
    console.log("Step 1️⃣: Exporting from IndexedDB...");
    const exportedData = await exportIndexedDBData();
    
    // Step 2: Show success and wait
    console.log("\n✅ Export complete!");
    console.log("📋 Data ready for Firebase import.");
    console.log("\n⏳ Copy the exported JSON and run:");
    console.log("importToFirebase(YOUR_JSON_DATA)\n");
    
    return exportedData;
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

/**
 * Full migration with confirmation
 */
async function fullMigration() {
  try {
    // Step 1: Export
    const exportedData = await exportIndexedDBData();
    
    if (!confirm("✅ Data exported. Ready to import to Firebase?")) {
      console.log("Migration cancelled.");
      return;
    }
    
    // Step 2: Import
    const imported = await importToFirebase(exportedData);
    
    if (imported) {
      // Step 3: Verify
      await verifyFirebaseData();
      console.log("\n🎉 Migration complete!");
    }
  } catch (error) {
    console.error("❌ Full migration failed:", error);
  }
}

// ============================================
// USAGE INSTRUCTIONS (Copy to browser console)
// ============================================

/*
// STEP 1: Export data from IndexedDB
exportIndexedDBData();
// This will download a JSON file automatically

// STEP 2: Wait for Firebase to be initialized on your app

// STEP 3: Import the data
// Copy the exported JSON data and paste it:
importToFirebase({
  "students": [...],
  "faculty": [...],
  "classes": [...],
  "attendance": [...],
  "settings": [...],
  "years": [...]
});

// STEP 4: Verify the import
verifyFirebaseData();

// OR use the automated migration:
fullMigration();
*/
