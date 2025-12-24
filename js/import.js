// import.js - Data Import Functions with Sanitization

// ========== COLUMN SANITIZATION FUNCTION ==========
function sanitizeRecord(store, record) {
  const validColumns = {
    students: ['id', 'rollNo', 'firstName', 'lastName', 'email', 'department', 'year', 'semester'],
    faculty: ['id', 'facultyId', 'firstName', 'lastName', 'email', 'department', 'specialization', 'password'],
    classes: ['id', 'code', 'name', 'department', 'semester', 'faculty', 'year', 'credits'],
    attendance: ['id', 'classId', 'studentId', 'date', 'session', 'status', 'notes'],
    academic_years: ['id', 'year', 'startDate', 'endDate', 'type'],
    settings: ['id', 'key', 'value']
  };

  const cleanedRecord = {};
  const columns = validColumns[store] || [];

  columns.forEach(column => {
    if (record.hasOwnProperty(column) && record[column] !== undefined) {
      cleanedRecord[column] = record[column];
    }
  });

  return Object.keys(cleanedRecord).length > 0 ? cleanedRecord : record;
}

// ========== FUNCTION 1: importStructuredData ==========
async function importStructuredData(zipContent, progressBar) {
  const stores = ['students', 'faculty', 'classes', 'attendance', 'academic_years', 'settings'];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const file = zipContent.file(store + '.json');

    if (file) {
      try {
        const text = await file.async('text');
        const data = JSON.parse(text);

        await clearStore(store);

        for (const item of data) {
          const cleanedItem = sanitizeRecord(store, item);
          await addRecord(store, cleanedItem);
        }

        console.log(`✅ Imported ${data.length} records to ${store}`);
      } catch (error) {
        console.error(`Error importing ${store}:`, error);
      }
    }

    const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
}

// ========== FUNCTION 2: importIndividualFiles ==========
async function importIndividualFiles(zipContent, progressBar) {
  const fileMappings = {
    students: ['students.json', 'students.csv'],
    faculty: ['faculty.json', 'faculty.csv'],
    classes: ['classes.json', 'classes.csv'],
    attendance: ['attendance.json', 'attendance.csv'],
    academic_years: ['academic_years.json', 'years.json'],
    settings: ['settings.json']
  };

  let processed = 0;
  const total = Object.keys(fileMappings).length;

  for (const [store, possibleFiles] of Object.entries(fileMappings)) {
    for (const fileName of possibleFiles) {
      const file = zipContent.file(fileName);

      if (file) {
        try {
          const text = await file.async('text');
          let data;

          if (fileName.endsWith('.json')) {
            data = JSON.parse(text);
          } else if (fileName.endsWith('.csv')) {
            data = parseCSVToObjects(text);
          }

          if (data && data.length > 0) {
            await clearStore(store);

            for (const item of data) {
              const cleanedItem = sanitizeRecord(store, item);
              await addRecord(store, cleanedItem);
            }

            console.log(`✅ Imported ${data.length} records to ${store}`);
            break;
          }
        } catch (error) {
          console.error(`Error importing from ${fileName}:`, error);
        }
      }
    }

    processed++;
    const percent = 60 + Math.round((processed / total) * 30);
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
}

// ========== FUNCTION 3: importFromStructuredJSON ==========
async function importFromStructuredJSON(completeData, progressBar) {
  const stores = ['students', 'faculty', 'classes', 'attendance', 'academic_years', 'settings'];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const data = completeData.data[store];

    if (data && Array.isArray(data)) {
      try {
        await clearStore(store);

        for (const item of data) {
          const cleanedItem = sanitizeRecord(store, item);
          await addRecord(store, cleanedItem);
        }

        console.log(`✅ Imported ${data.length} records to ${store}`);
      } catch (error) {
        console.error(`Error importing ${store}:`, error);
      }
    }

    const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
}

// ========== FUNCTION 4: importFromLegacyJSON ==========
async function importFromLegacyJSON(data, progressBar) {
  const stores = ['students', 'faculty', 'classes', 'attendance', 'academic_years', 'settings'];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];

    if (data[store] && Array.isArray(data[store])) {
      try {
        await clearStore(store);

        for (const item of data[store]) {
          const cleanedItem = sanitizeRecord(store, item);
          await addRecord(store, cleanedItem);
        }

        console.log(`✅ Imported ${data[store].length} records to ${store}`);
      } catch (error) {
        console.error(`Error importing ${store}:`, error);
      }
    }

    const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
}

// ========== CSV PARSER ==========
function parseCSVToObjects(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const objects = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    objects.push(obj);
  }

  return objects;
}

// ========== MAIN IMPORT HANDLER ==========
async function handleCompleteDbUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const progressDiv = document.getElementById('importProgress');
  const progressBar = document.querySelector('.progress-fill');

  progressDiv.style.display = 'block';
  progressBar.style.width = '10%';
  progressBar.textContent = '10%';

  try {
    if (file.name.endsWith('.zip')) {
      const JSZip = window.JSZip;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const hasStructuredFiles = await Promise.all(
        ['students.json', 'faculty.json', 'classes.json', 'attendance.json'].map(
          name => zipContent.file(name)
        )
      ).then(files => files.some(f => f !== null));

      if (hasStructuredFiles) {
        await importStructuredData(zipContent, progressBar);
      } else {
        await importIndividualFiles(zipContent, progressBar);
      }
    } else if (file.name.endsWith('.json')) {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.data && typeof data.data === 'object') {
        await importFromStructuredJSON(data, progressBar);
      } else {
        await importFromLegacyJSON(data, progressBar);
      }
    }

    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
    showToast('✅ Database imported successfully!', 'success');

    await loadStudents();
    await loadFaculty();
    await loadClasses();
    await loadAcademicYears();
    await updateDashboard();

    setTimeout(() => {
      progressDiv.style.display = 'none';
    }, 2000);
  } catch (error) {
    console.error('❌ Import error:', error);
    showToast('❌ Import failed: ' + error.message, 'error');
    progressDiv.style.display = 'none';
  }

  event.target.value = '';
}
