function toAsciiText(text) {
  if (!text) return "";

  // Replace Unicode box-drawing characters with ASCII equivalents
  const replacements = {
    "─": "-", // horizontal line
    "│": "|", // vertical line
    "┌": "+", // top-left corner
    "┐": "+", // top-right corner
    "└": "+", // bottom-left corner
    "┘": "+", // bottom-right corner
    "├": "+", // left tee
    "┤": "+", // right tee
    "┬": "+", // top tee
    "┴": "+", // bottom tee
    "┼": "+", // cross
    "═": "=", // double horizontal line
    "║": "|", // double vertical line
    "╔": "+", // double top-left corner
    "╗": "+", // double top-right corner
    "╚": "+", // double bottom-left corner
    "╝": "+", // double bottom-right corner
    "╠": "+", // double left tee
    "╣": "+", // double right tee
    "╦": "+", // double top tee
    "╩": "+", // double bottom tee
    "╬": "+", // double cross
    "📊": " [Chart] ",
    "📋": " [Clipboard] ",
    "📅": " [Calendar] ",
    "👥": " [People] ",
    "👨‍🏫": " [Teacher] ",
    "📚": " [Books] ",
    "✅": " [Yes] ",
    "❌": " [No] ",
    ℹ️: " [Info] ",
    "📁": " [Folder] ",
    "📂": " [Open Folder] ",
    "📄": " [Document] ",
    "📤": " [Upload] ",
    "📥": " [Download] ",
    "⚙️": " [Settings] ",
    "🗑️": " [Trash] ",
    "🔍": " [Search] ",
    "💾": " [Save] ",
    "📦": " [Package] ",
    "🔁": " [Repeat] ",
    "⚠️": " [Warning] ",
    "👤": " [Person] ",
    "📈": " [Chart Up] ",
    "🔄": " [Refresh] ",
    "🧹": " [Broom] ",
    "📭": " [Mailbox] ",
    "⏳": " [Hourglass] ",
    "🚀": " [Rocket] ",
    "🎓": " [Graduation] ",
    "🏫": " [School] ",
    "📅": " [Calendar] ",
    "🏢": " [Building] ",
  };

  let result = text;
  for (const [unicode, ascii] of Object.entries(replacements)) {
    result = result.replace(new RegExp(unicode, "g"), ascii);
  }

  return result;
}

function downloadCSV(content, filename) {
  // Convert content to ASCII-only text
  const asciiContent = toAsciiText(content);

  // Add UTF-8 BOM for compatibility
  const BOM = "\uFEFF";
  const csvContent = BOM + asciiContent;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(data, type) {
  if (!data || data.length === 0) return "No data";

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        // Handle special cases for CSV formatting
        if (typeof value === "object" && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function parseCSVToObjects(csvText) {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;

    const values = [];
    let current = "";
    let inQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        let value = values[index].replace(/^"|"$/g, "").trim();

        // Try to parse numbers and dates
        if (!isNaN(value) && value !== "") {
          value = Number(value);
        } else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          // ISO date format
          value = new Date(value).toISOString();
        }

        obj[header] = value;
      }
    });

    result.push(obj);
  }

  return result;
}

// ========== CLEAR STORE FUNCTION - REQUIRED FOR IMPORTS ==========
async function clearStore(storeName) {
  try {
    const allRecords = await getAll(storeName);

    for (const record of allRecords) {
      await deleteRecord(storeName, record.id);
    }

    console.log(`✅ Cleared store: ${storeName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing store ${storeName}:`, error);
    return false;
  }
}
// ========== COLUMN SANITIZATION FUNCTION ==========
function sanitizeRecord(store, record) {
  // Define valid columns for each store based on your actual schema
  const validColumns = {
    students: ['id', 'rollNo', 'firstName', 'lastName', 'email', 'department', 'year', 'semester'],
    faculty: ['id', 'facultyId', 'firstName', 'lastName', 'email', 'department', 'specialization', 'password'],
    classes: ['id', 'code', 'name', 'department', 'semester', 'faculty', 'year', 'credits'],
    attendance: ['id', 'classId', 'studentId', 'date', 'session', 'status', 'notes'],
    years: ['id', 'year', 'startDate', 'endDate', 'type'],
    settings: ['id', 'key', 'value']
  };
  
  const cleanedRecord = {};
  const columns = validColumns[store] || [];
  
  columns.forEach(column => {
    if (record.hasOwnProperty(column) && record[column] !== undefined) {
      cleanedRecord[column] = record[column];
    }
  });
  
  // If no valid columns found, return the record as-is (let Supabase handle it)
  return Object.keys(cleanedRecord).length > 0 ? cleanedRecord : record;
}

async function exportAllInOne() {
  showToast("Preparing bulk export...", "info");

  try {
    // Get all data
    const students = await getAll("students");
    const faculty = await getAll("faculty");
    const classes = await getAll("classes");

    if (students.length === 0 && faculty.length === 0 && classes.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    // Create CSV for each type
    const timestamp = new Date().getTime();
    const files = [];

    // Students CSV
    if (students.length > 0) {
      let studentCSV =
        "Roll No,First Name,Last Name,Email,Department,Year,Semester,Created Date\n";
      students.forEach((student) => {
        studentCSV +=
          [
            `"${student.rollNo || ""}"`,
            `"${student.firstName || ""}"`,
            `"${student.lastName || ""}"`,
            `"${student.email || ""}"`,
            `"${student.department || ""}"`,
            student.year || "",
            student.semester || "",
            `"${new Date(student.createdAt).toLocaleDateString()}"`,
          ].join(",") + "\n";
      });
      files.push({ name: `students_${timestamp}.csv`, content: studentCSV });
    }

    // Faculty CSV
    if (faculty.length > 0) {
      let facultyCSV =
        "Faculty ID,First Name,Last Name,Email,Department,Specialization,Created Date\n";
      faculty.forEach((fac) => {
        facultyCSV +=
          [
            `"${fac.facultyId || ""}"`,
            `"${fac.firstName || ""}"`,
            `"${fac.lastName || ""}"`,
            `"${fac.email || ""}"`,
            `"${fac.department || ""}"`,
            `"${fac.specialization || ""}"`,
            `"${new Date(fac.createdAt).toLocaleDateString()}"`,
          ].join(",") + "\n";
      });
      files.push({ name: `faculty_${timestamp}.csv`, content: facultyCSV });
    }

    // Classes CSV
    if (classes.length > 0) {
      let classCSV =
        "Class Code,Course Name,Department,Semester,Faculty,Year,Credits,Created Date\n";
      classes.forEach((cls) => {
        classCSV +=
          [
            `"${cls.code || ""}"`,
            `"${cls.name || ""}"`,
            `"${cls.department || ""}"`,
            cls.semester || "",
            `"${cls.faculty || ""}"`,
            cls.year || "",
            cls.credits || "3",
            `"${new Date(cls.createdAt).toLocaleDateString()}"`,
          ].join(",") + "\n";
      });
      files.push({ name: `classes_${timestamp}.csv`, content: classCSV });
    }

    // If only one file, download it directly
    if (files.length === 1) {
      downloadCSV(files[0].content, files[0].name);
      showToast(`Exported ${files[0].name}`, "success");
      return;
    }

    // For multiple files, create a zip using JSZip
    if (typeof JSZip === "undefined") {
      // If JSZip not available, download files separately
      files.forEach((file) => {
        downloadCSV(file.content, file.name);
      });
      showToast(`Exported ${files.length} files separately`, "success");
    } else {
      // Create ZIP with JSZip
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(file.name, file.content);
      });

      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        const url = URL.createObjectURL(content);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `attendance_system_export_${timestamp}.zip`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Exported ${files.length} files in ZIP`, "success");
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    showToast("Error during export", "error");
  }
}

async function exportCompleteDatabase() {
  showToast("Preparing complete database export...", "info");

  try {
    // Get all data from all stores
    const students = await getAll("students");
    const faculty = await getAll("faculty");
    const classes = await getAll("classes");
    const attendance = await getAll("attendance");
    const years = await getAll("years");
    const settings = await getAll("settings");

    // Create metadata
    const metadata = {
      exportType: "Complete Database Backup",
      exportDate: new Date().toISOString(),
      records: {
        students: students.length,
        faculty: faculty.length,
        classes: classes.length,
        attendance: attendance.length,
        years: years.length,
        settings: settings.length,
      },
      systemInfo: {
        dbName: DB_NAME,
        dbVersion: DB_VERSION,
        appName: "Advanced Attendance System",
        version: "1.0",
      },
    };

    // Create structured data object
    const completeData = {
      metadata: metadata,
      data: {
        students: students,
        faculty: faculty,
        classes: classes,
        attendance: attendance,
        years: years,
        settings: settings,
      },
    };

    // Convert to JSON
    const jsonData = JSON.stringify(completeData, null, 2);

    // Check if JSZip is available
    if (typeof JSZip === "undefined") {
      // If JSZip not available, download as JSON
      downloadFile(
        jsonData,
        `attendance_complete_backup_${new Date().getTime()}.json`,
        "application/json"
      );
      showToast("Complete database exported as JSON!", "success");
    } else {
      // Create ZIP with multiple files for better organization
      const zip = new JSZip();

      // Add metadata file
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Add data files organized by type
      zip.file("students.json", JSON.stringify(students, null, 2));
      zip.file("faculty.json", JSON.stringify(faculty, null, 2));
      zip.file("classes.json", JSON.stringify(classes, null, 2));
      zip.file("attendance.json", JSON.stringify(attendance, null, 2));
      zip.file("years.json", JSON.stringify(years, null, 2));
      zip.file("settings.json", JSON.stringify(settings, null, 2));

      // Also create CSV versions for easy viewing
      zip.file("students.csv", convertToCSV(students, "students"));
      zip.file("faculty.csv", convertToCSV(faculty, "faculty"));
      zip.file("classes.csv", convertToCSV(classes, "classes"));
      zip.file("attendance.csv", convertToCSV(attendance, "attendance"));
      zip.file(
        "README.txt",
        `COMPLETE DATABASE BACKUP
=========================
Exported: ${new Date().toLocaleString()}
Total Records: ${students.length} students, ${faculty.length} faculty, ${
          classes.length
        } classes, ${attendance.length} attendance records

Files included:
1. students.json - All student records
2. faculty.json - All faculty records
3. classes.json - All class records
4. attendance.json - All attendance records (date-wise)
5. years.json - Academic years
6. settings.json - System settings
7. *.csv - CSV versions for easy viewing

To import: Use the "Complete Database Import" feature in the Bulk Import tab.`
      );

      // Generate ZIP
      zip.generateAsync({ type: "blob" }).then((content) => {
        downloadFile(
          content,
          `attendance_complete_backup_${new Date().getTime()}.zip`,
          "application/zip"
        );
        showToast(
          `Complete database exported with ${Object.values(
            metadata.records
          ).reduce((a, b) => a + b, 0)} total records!`,
          "success"
        );
      });
    }
  } catch (error) {
    console.error("Complete database export error:", error);
    showToast("Error during complete database export", "error");
  }
}

async function handleCompleteDbUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const progress = document.getElementById("completeDbProgress");
  const progressBar = document.getElementById("completeDbProgressBar");
  progress.style.display = "block";
  progressBar.style.width = "10%";
  progressBar.textContent = "10%";

  try {
    let completeData;

    // Check file type
    if (file.name.toLowerCase().endsWith(".zip")) {
      // Handle ZIP file
      if (typeof JSZip === "undefined") {
        throw new Error("JSZip library not loaded. Cannot process ZIP files.");
      }

      progressBar.style.width = "20%";
      progressBar.textContent = "20%";

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      progressBar.style.width = "40%";
      progressBar.textContent = "40%";

      // Check for metadata file first
      let metadataFile = zipContent.file("metadata.json");
      if (!metadataFile) {
        // Try to find any JSON file
        const jsonFiles = Object.keys(zipContent.files).filter((name) =>
          name.endsWith(".json")
        );
        if (jsonFiles.length === 0) {
          throw new Error("No JSON files found in ZIP");
        }
        metadataFile = zipContent.file(jsonFiles[0]);
      }

      const metadataText = await metadataFile.async("text");
      const metadata = JSON.parse(metadataText);

      progressBar.style.width = "60%";
      progressBar.textContent = "60%";

      // Import data based on metadata
      if (metadata.exportType === "Complete Database Backup") {
        // This is a structured export
        await importStructuredData(zipContent, progressBar);
      } else {
        // This might be individual files
        await importIndividualFiles(zipContent, progressBar);
      }
    } else if (file.name.toLowerCase().endsWith(".json")) {
      // Handle JSON file
      progressBar.style.width = "30%";
      progressBar.textContent = "30%";

      const text = await file.text();
      completeData = JSON.parse(text);

      progressBar.style.width = "60%";
      progressBar.textContent = "60%";

      // Check if this is our structured format
      if (
        completeData.metadata &&
        completeData.metadata.exportType === "Complete Database Backup"
      ) {
        await importFromStructuredJSON(completeData, progressBar);
      } else {
        // Assume this is an old-style backup
        await importFromLegacyJSON(completeData, progressBar);
      }
    } else {
      throw new Error("Unsupported file format. Please use ZIP or JSON.");
    }

    progressBar.style.width = "100%";
    progressBar.textContent = "100%";

    // Show success message
    setTimeout(() => {
      progress.style.display = "none";
      showToast(
        "Complete database imported successfully! Refreshing data...",
        "success"
      );

      // Refresh all data displays
      loadStudents();
      loadFaculty();
      loadClasses();
      loadYears();
      updateDashboard();
      updateExportStats();

      // If admin is viewing attendance history, refresh it too
      if (
        document
          .getElementById("adminAttendanceHistory")
          .classList.contains("active")
      ) {
        loadAdminAttendanceHistory();
      }
    }, 1000);
  } catch (error) {
    console.error("Complete database import error:", error);
    progress.style.display = "none";
    showToast(`Import failed: ${error.message}`, "error");
  }

  event.target.value = "";
}

async function exportBulkData(type) {
  switch (type) {
    case "students":
      await exportStudentsYearWise();
      break;
    case "classes":
      await exportClassesYearWise();
      break;
    case "faculty":
      await exportAllFaculty();
      break;
  }
}

async function exportStudentsYearWise() {
  const allStudents = await getAll("students");
  if (allStudents.length === 0) {
    showToast("No students to export", "error");
    return;
  }

  // Group by year
  const studentsByYear = {};
  allStudents.forEach((student) => {
    const year = student.year || Math.ceil(student.semester / 2);
    if (!studentsByYear[year]) {
      studentsByYear[year] = [];
    }
    studentsByYear[year].push(student);
  });

  let csvContent = "";

  // Export each year separately
  for (const year in studentsByYear) {
    const yearStudents = studentsByYear[year];

    const headers = [
      "Roll No",
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Year",
      "Semester",
      "Created Date",
    ];

    csvContent += `--- Year ${year} Students (${yearStudents.length} records) ---\n`;
    csvContent += headers.join(",") + "\n";

    yearStudents.forEach((student) => {
      const row = [
        `"${student.rollNo || ""}"`,
        `"${student.firstName || ""}"`,
        `"${student.lastName || ""}"`,
        `"${student.email || ""}"`,
        `"${student.department || ""}"`,
        student.year || "",
        student.semester || "",
        `"${new Date(student.createdAt).toLocaleDateString()}"`,
      ];
      csvContent += row.join(",") + "\n";
    });

    csvContent += "\n"; // Add blank line between years
  }

  downloadCSV(
    csvContent,
    `students_export_yearwise_${new Date().getTime()}.csv`
  );
  showToast(`Exported ${allStudents.length} students grouped by year`);
}

async function exportClassesYearWise() {
  const allClasses = await getAll("classes");
  if (allClasses.length === 0) {
    showToast("No classes to export", "error");
    return;
  }

  // Group by year
  const classesByYear = {};
  allClasses.forEach((cls) => {
    const year = cls.year;
    if (!classesByYear[year]) {
      classesByYear[year] = [];
    }
    classesByYear[year].push(cls);
  });

  let csvContent = "";

  // Export each year separately
  for (const year in classesByYear) {
    const yearClasses = classesByYear[year];

    const headers = [
      "Class Code",
      "Course Name",
      "Department",
      "Semester",
      "Faculty",
      "Year",
      "Credits",
      "Created Date",
    ];

    csvContent += `--- Year ${year} Classes (${yearClasses.length} records) ---\n`;
    csvContent += headers.join(",") + "\n";

    yearClasses.forEach((cls) => {
      const row = [
        `"${cls.code || ""}"`,
        `"${cls.name || ""}"`,
        `"${cls.department || ""}"`,
        cls.semester || "",
        `"${cls.faculty || ""}"`,
        cls.year || "",
        cls.credits || "3",
        `"${new Date(cls.createdAt).toLocaleDateString()}"`,
      ];
      csvContent += row.join(",") + "\n";
    });

    csvContent += "\n"; // Add blank line between years
  }

  downloadCSV(
    csvContent,
    `classes_export_yearwise_${new Date().getTime()}.csv`
  );
  showToast(`Exported ${allClasses.length} classes grouped by year`);
}

async function exportAllFaculty() {
  const allFaculty = await getAll("faculty");
  if (allFaculty.length === 0) {
    showToast("No faculty to export", "error");
    return;
  }

  const headers = [
    "Faculty ID",
    "First Name",
    "Last Name",
    "Email",
    "Department",
    "Specialization",
    "Created Date",
  ];

  let csvContent = headers.join(",") + "\n";

  allFaculty.forEach((faculty) => {
    const row = [
      `"${faculty.facultyId || ""}"`,
      `"${faculty.firstName || ""}"`,
      `"${faculty.lastName || ""}"`,
      `"${faculty.email || ""}"`,
      `"${faculty.department || ""}"`,
      `"${faculty.specialization || ""}"`,
      `"${new Date(faculty.createdAt).toLocaleDateString()}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  downloadCSV(csvContent, `faculty_export_${new Date().getTime()}.csv`);
  showToast(`Exported ${allFaculty.length} faculty members`);
}

function downloadTemplate(type) {
  const templates = {
    students: `Roll No,First Name,Last Name,Email,Department,Year,Semester,Created Date\n22156148040,John,Doe,john@college.edu,Computer Science,3,5,2023-09-01\n22101148001,Alice,Smith,alice@college.edu,Computer Science,3,5,2023-09-01`,
    faculty: `Faculty ID,First Name,Last Name,Email,Department,Specialization,Created Date\nFAC001,Faculty,One,faculty1@college.edu,Computer Science,Data Structures,2023-09-01\nFAC002,Faculty,Two,faculty2@college.edu,Computer Science,Networks,2023-09-01`,
    classes: `Class Code,Course Name,Department,Semester,Faculty,Year,Credits,Created Date\nCS101,Data Structures,Computer Science,5,Faculty One,3,3,2023-09-01\nCS102,Programming,Computer Science,5,Faculty One,3,3,2023-09-01`,
  };
  const csv = templates[type];
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_import_template.csv`;
  a.click();
  showToast(`Downloaded ${type} import template`, "info");
}

function downloadCompleteDbTemplate() {
  const template = {
    metadata: {
      exportType: "Complete Database Backup Template",
      exportDate: new Date().toISOString(),
      instructions:
        "Fill this template with your data and import using 'Complete Database Import'",
    },
    data: {
      students: [
        {
          id: 1,
          rollNo: "22156148040",
          firstName: "John",
          lastName: "Doe",
          email: "john@college.edu",
          department: "Computer Science",
          year: 3,
          semester: 5,
          createdAt: new Date().toISOString(),
        },
      ],
      faculty: [
        {
          id: 1,
          facultyId: "FAC001",
          firstName: "Faculty",
          lastName: "One",
          email: "faculty1@college.edu",
          department: "Computer Science",
          specialization: "Data Structures",
          password: "pass123",
          createdAt: new Date().toISOString(),
        },
      ],
      classes: [
        {
          id: 1,
          code: "CS101",
          name: "Data Structures",
          department: "Computer Science",
          semester: 5,
          faculty: "Faculty One",
          year: 3,
          credits: 3,
          createdAt: new Date().toISOString(),
        },
      ],
      attendance: [
        {
          id: 1,
          classId: 1,
          studentId: 1,
          date: "2024-01-15",
          session: 1,
          status: "present",
          notes: "",
          createdAt: new Date().toISOString(),
        },
      ],
      years: [
        {
          id: 1,
          year: 2024,
          startDate: "2024-06-01",
          endDate: "2025-05-31",
          type: "academic",
          createdAt: new Date().toISOString(),
        },
      ],
      settings: [
        {
          id: 1,
          key: "minAttendance",
          value: "75",
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };

  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "complete_database_template.json";
  a.click();
  showToast("Complete database template downloaded!", "info");
}

async function handleStudentUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  let text = await file.text();
  text = text.replace(/^\uFEFF/, ""); // Remove BOM

  const sections = text.split("--- Year ");
  const progress = document.getElementById("studentProgress");
  const progressBar = document.getElementById("studentProgressBar");
  progress.style.display = "block";

  let imported = 0;
  let skipped = 0;
  let totalProcessed = 0;

  for (let section of sections) {
    if (!section.trim()) continue;

    const lines = section.split(/\r\n|\n|\r/);
    if (lines.length < 2) continue;

    // Skip the first line (Year header)
    let startIndex = 1;
    if (lines[0].includes("Students")) {
      startIndex = 2; // Skip the header line too
    }

    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].trim() === "" || lines[i].includes("--- Year")) continue;

      totalProcessed++;

      // Parse CSV line properly handling quotes
      const values = [];
      let inQuotes = false;
      let currentValue = "";

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentValue);
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue);

      // Trim all values
      const cleanedValues = values.map((v) => v.trim());

      // Expected columns: Roll No, First Name, Last Name, Email, Department, Year, Semester, Created Date
      if (cleanedValues.length < 8) {
        console.log("Skipping - insufficient columns:", cleanedValues);
        skipped++;
        continue;
      }

      try {
        // Parse the data
        const rollNo = cleanedValues[0];
        const firstName = cleanedValues[1];
        const lastName = cleanedValues[2];
        const email = cleanedValues[3] || "N/A";
        const department = cleanedValues[4];
        const year = parseInt(cleanedValues[5]) || 1;
        const semester = parseInt(cleanedValues[6]) || 1;

        // Parse the date - handle different formats
        let createdDate = new Date().toISOString();
        const dateStr = cleanedValues[7];
        if (dateStr) {
          // Try parsing "MM/DD/YYYY" format
          const dateParts = dateStr.split("/");
          if (dateParts.length === 3) {
            const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            const dateObj = new Date(year, month, day);
            if (!isNaN(dateObj.getTime())) {
              createdDate = dateObj.toISOString();
            }
          }
        }

        // Basic validation
        if (!rollNo || !firstName) {
          console.log("Skipping - missing rollNo or firstName:", cleanedValues);
          skipped++;
          continue;
        }

        // Check if student already exists
        const allStudents = await getAll("students");
        const exists = allStudents.find((s) => s.rollNo === rollNo);

        if (exists) {
          console.log("Skipping - already exists:", rollNo);
          skipped++;
          continue;
        }

        // Add the student
        await addRecord("students", {
          rollNo: rollNo,
          firstName: firstName,
          lastName: lastName || "",
          email: email,
          department: department,
          year: year,
          semester: semester,
          createdAt: createdDate,
        });

        imported++;
      } catch (e) {
        console.error("Error importing row:", e, cleanedValues);
        skipped++;
      }

      // Update progress
      const percent = Math.round((totalProcessed / 300) * 100); // Approximate total
      progressBar.style.width = Math.min(percent, 100) + "%";
      progressBar.textContent = Math.min(percent, 100) + "%";
    }
  }

  progress.style.display = "none";

  if (imported > 0) {
    showToast(
      `Successfully imported ${imported} students! ${
        skipped > 0 ? `(${skipped} skipped)` : ""
      }`
    );
    loadStudents();
  } else {
    showToast(
      `No students imported. ${skipped} skipped. Check console for details.`,
      "error"
    );
  }

  event.target.value = "";
}

async function handleFacultyUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  let text = await file.text();
  text = text.replace(/^\uFEFF/, "");
  const lines = text.split(/\r\n|\n|\r/);
  const headers = lines[0]
    .split(",")
    .map((h) =>
      h.replace(/^"|"$/g, "").trim().toLowerCase().replace(/\s+/g, "")
    );

  const progress = document.getElementById("facultyProgress");
  const progressBar = document.getElementById("facultyProgressBar");
  progress.style.display = "block";
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const values = lines[i]
      .split(",")
      .map((v) => v.replace(/^"|"$/g, "").trim());
    if (values.length < 2) continue;

    const record = {};
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        record[header] = values[idx];
      }
    });

    // Map headers to our data structure
    const facultyId = record["facultyid"] || record["faculty_id"] || "";
    const firstName = record["firstname"] || record["first_name"] || "";
    const lastName = record["lastname"] || record["last_name"] || "";
    const email = record["email"] || "";
    const department = record["department"] || "";
    const specialization = record["specialization"] || "";
    const createdDate =
      record["createddate"] ||
      record["created_date"] ||
      new Date().toISOString();

    if (!facultyId || !firstName) {
      skipped++;
      continue;
    }

    try {
      await addRecord("faculty", {
        facultyId: facultyId,
        password: "pass123", // Default password for imported faculty
        firstName: firstName,
        lastName: lastName,
        email: email,
        department: department,
        specialization: specialization,
        createdAt: createdDate,
      });
      imported++;
    } catch (e) {
      console.error("Error importing row:", e);
      skipped++;
    }

    const percent = Math.round((i / lines.length) * 100);
    progressBar.style.width = percent + "%";
    progressBar.textContent = percent + "%";
  }

  progress.style.display = "none";
  showToast(
    `Imported ${imported} faculty members successfully! ${
      skipped > 0 ? `(${skipped} skipped)` : ""
    }`
  );
  loadFaculty();
  event.target.value = "";
}

async function handleClassesUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  let text = await file.text();
  text = text.replace(/^\uFEFF/, ""); // Remove BOM

  const sections = text.split("--- Year ");
  const progress = document.getElementById("classesProgress");
  const progressBar = document.getElementById("classesProgressBar");
  progress.style.display = "block";

  let imported = 0;
  let skipped = 0;
  let totalProcessed = 0;
  const allFaculty = await getAll("faculty");

  // Normalize department names
  const normalizeDepartment = (dept) => {
    if (!dept) return "Computer Science";

    const lowerDept = dept.toLowerCase();
    if (lowerDept.includes("cyber")) return "CSE(Cyber Security)";
    if (lowerDept.includes("network")) return "CSE(Networks)";
    if (lowerDept.includes("computer science") || lowerDept.includes("cse"))
      return "Computer Science";
    if (lowerDept.includes("civil")) return "Civil";
    if (lowerDept.includes("mechanical")) return "Mechanical";
    if (lowerDept.includes("electrical")) return "Electrical";
    if (lowerDept.includes("ece") || lowerDept.includes("electronic"))
      return "ECE";
    if (lowerDept.includes("applied") || lowerDept.includes("science"))
      return "Applied Science";
    return "Computer Science"; // Default
  };

  for (let section of sections) {
    if (!section.trim()) continue;

    const lines = section.split(/\r\n|\n|\r/);
    if (lines.length < 2) continue;

    // Skip the first line (Year header)
    let startIndex = 1;
    if (lines[0].includes("Classes")) {
      startIndex = 2; // Skip the header line too
    }

    for (let i = startIndex; i < lines.length; i++) {
      if (lines[i].trim() === "" || lines[i].includes("--- Year")) continue;

      totalProcessed++;

      // Parse CSV line properly handling quotes
      const values = [];
      let inQuotes = false;
      let currentValue = "";

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentValue);
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue);

      // Trim all values
      const cleanedValues = values.map((v) => v.trim());

      // Expected columns: Class Code, Course Name, Department, Semester, Faculty, Year, Credits, Created Date
      if (cleanedValues.length < 8) {
        console.log("Skipping class - insufficient columns:", cleanedValues);
        skipped++;
        continue;
      }

      try {
        // Parse the data
        const code = cleanedValues[0];
        const name = cleanedValues[1];
        const rawDepartment = cleanedValues[2];
        const semester = parseInt(cleanedValues[3]) || 1;
        const facultyName = cleanedValues[4];
        const year = parseInt(cleanedValues[5]) || new Date().getFullYear();
        const credits = parseInt(cleanedValues[6]) || 3;

        // Normalize department
        const department = normalizeDepartment(rawDepartment);

        // Parse the date
        let createdDate = new Date().toISOString();
        const dateStr = cleanedValues[7];
        if (dateStr) {
          // Try parsing "MM/DD/YYYY" format
          const dateParts = dateStr.split("/");
          if (dateParts.length === 3) {
            const month = parseInt(dateParts[0]) - 1;
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);
            const dateObj = new Date(year, month, day);
            if (!isNaN(dateObj.getTime())) {
              createdDate = dateObj.toISOString();
            }
          }
        }

        // Basic validation
        if (!code || !name) {
          console.log("Skipping class - missing code or name:", cleanedValues);
          skipped++;
          continue;
        }

        // Check if faculty exists, create if not
        let assignedFaculty = facultyName;
        const facultyNameLower = facultyName.toLowerCase().trim();
        const existingFaculty = allFaculty.find(
          (f) =>
            `${f.firstName} ${f.lastName}`.toLowerCase() === facultyNameLower
        );

        if (!existingFaculty && facultyName && facultyName !== "New Faculty") {
          // Create new faculty with default credentials
          const nameParts = facultyName.split(" ");
          const firstName = nameParts[0] || "Faculty";
          const lastName = nameParts.slice(1).join(" ") || "Member";

          const newFaculty = {
            facultyId: `FAC${Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, "0")}`,
            firstName: firstName,
            lastName: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@college.edu`,
            department: department,
            specialization: name,
            password: "pass123",
            createdAt: new Date().toISOString(),
          };

          await addRecord("faculty", newFaculty);
          allFaculty.push(newFaculty);
          console.log("Created new faculty:", facultyName);
        } else if (facultyName === "New Faculty") {
          assignedFaculty = ""; // Leave empty for admin to assign later
        }

        // Check if class already exists
        const allClasses = await getAll("classes");
        const exists = allClasses.find(
          (c) => c.code === code && c.year === year
        );

        if (exists) {
          console.log("Skipping class - already exists:", code);
          skipped++;
          continue;
        }

        // Add the class
        await addRecord("classes", {
          code: code,
          name: name,
          department: department,
          semester: semester,
          faculty: assignedFaculty,
          year: year,
          credits: credits,
          createdAt: createdDate,
        });

        imported++;
      } catch (e) {
        console.error("Error importing class row:", e, cleanedValues);
        skipped++;
      }

      // Update progress
      const percent = Math.round((totalProcessed / 30) * 100); // Approximate total
      progressBar.style.width = Math.min(percent, 100) + "%";
      progressBar.textContent = Math.min(percent, 100) + "%";
    }
  }

  progress.style.display = "none";

  if (imported > 0) {
    showToast(
      `Successfully imported ${imported} classes! ${
        skipped > 0 ? `(${skipped} skipped)` : ""
      }`
    );
    loadClasses();
    loadFaculty(); // Refresh faculty list
  } else {
    showToast(
      `No classes imported. ${skipped} skipped. Check console for details.`,
      "error"
    );
  }

  event.target.value = "";
}

async function exportAdminHistory(format) {
  const yearFilter = document.getElementById("adminYearFilter").value;
  const branchFilter = document.getElementById("adminBranchFilter").value;
  const semesterFilter = document.getElementById("adminSemesterFilter").value;
  const classFilter = document.getElementById("adminClassFilter").value;
  const dateFrom = document.getElementById("adminDateFrom").value;
  const dateTo = document.getElementById("adminDateTo").value;
  const statusFilter = document.getElementById("adminStatusFilter").value;

  const allAttendance = await getAll("attendance");
  const allStudents = await getAll("students");
  const allClasses = await getAll("classes");

  // Filter students
  let filteredStudents = allStudents;

  if (yearFilter !== "all") {
    const yearNum = parseInt(yearFilter);
    filteredStudents = filteredStudents.filter(
      (student) => Math.ceil(student.semester / 2) === yearNum
    );
  }

  if (branchFilter !== "all") {
    filteredStudents = filteredStudents.filter(
      (student) => student.department === branchFilter
    );
  }

  if (semesterFilter !== "all") {
    filteredStudents = filteredStudents.filter(
      (student) => student.semester == semesterFilter
    );
  }

  // Get selected class details
  let selectedClass = null;
  if (classFilter !== "all") {
    selectedClass = allClasses.find((c) => c.id === parseInt(classFilter));
  }

  // Prepare data with detailed subject information
  const exportData = [];

  // Track unique classes for statistics
  const classStats = new Map();

  // Track attendance records for statistics
  let totalAttendanceRecords = 0;
  let uniqueStudentIds = new Set();
  let classAttendanceRecords = new Map(); // classId -> [attendance records]

  // Track unique class sessions (class + date combinations)
  const uniqueClassSessions = new Set();
  let totalUniqueSessions = 0;

  for (const student of filteredStudents) {
    const studentClasses = allClasses.filter(
      (cls) =>
        cls.semester == student.semester &&
        cls.department === student.department
    );

    let relevantClassIds = studentClasses.map((c) => c.id);
    if (classFilter !== "all") {
      relevantClassIds = [parseInt(classFilter)];

      // If specific class is selected, check if student is in correct dept/sem
      if (
        selectedClass &&
        (student.department !== selectedClass.department ||
          student.semester != selectedClass.semester)
      ) {
        continue;
      }
    }

    const studentAttendance = allAttendance.filter(
      (record) =>
        record.studentId === student.id &&
        relevantClassIds.includes(record.classId)
    );

    let filteredAttendance = studentAttendance;
    const dateFilterType =
      document.querySelector('input[name="dateFilterType"]:checked')?.value ||
      "all";

    if (dateFilterType === "range" && dateFrom && dateTo) {
      filteredAttendance = studentAttendance.filter((r) => {
        const recordDate = new Date(r.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);

        // Set time to beginning/end of day for proper range comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        return recordDate >= fromDate && recordDate <= toDate;
      });
    }

    // Collect class statistics
    filteredAttendance.forEach((record) => {
      totalAttendanceRecords++;
      uniqueStudentIds.add(student.id);

      // Track unique class sessions (classId + date + session combination)
      const sessionKey = `${record.classId}-${record.date}-${
        record.session || 1
      }`;
      if (!uniqueClassSessions.has(sessionKey)) {
        uniqueClassSessions.add(sessionKey);
        totalUniqueSessions++;
      }

      if (!classStats.has(record.classId)) {
        const cls = allClasses.find((c) => c.id === record.classId);
        if (cls) {
          classStats.set(record.classId, {
            classId: record.classId,
            className: cls.name,
            classCode: cls.code,
            faculty: cls.faculty,
            department: cls.department,
            semester: cls.semester,
            year: cls.year,
            totalRecords: 0,
            uniqueStudents: new Set(),
            uniqueSessions: new Set(), // Track unique sessions per class
          });
        }
      }

      const stat = classStats.get(record.classId);
      if (stat) {
        stat.totalRecords++;
        stat.uniqueStudents.add(student.id);
        // Add this date to unique sessions for this class
        stat.uniqueSessions.add(`${record.date}-${record.session || 1}`);
      }

      // Track attendance records per class
      if (!classAttendanceRecords.has(record.classId)) {
        classAttendanceRecords.set(record.classId, []);
      }
      classAttendanceRecords.get(record.classId).push(record);
    });

    const totalClasses = filteredAttendance.length;
    const presentClasses = filteredAttendance.filter(
      (r) => r.status === "present"
    ).length;
    const attendancePercentage =
      totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Apply status filter
    if (statusFilter === "present" && attendancePercentage === 0) continue;
    if (statusFilter === "absent" && totalClasses - presentClasses === 0)
      continue;

    exportData.push({
      rollNo: student.rollNo || "N/A",
      name: `${student.firstName || ""} ${student.lastName || ""}`,
      department: student.department || "N/A",
      year: Math.ceil(student.semester / 2),
      semester: student.semester || "N/A",
      totalClasses: totalClasses,
      presentClasses: presentClasses,
      absentClasses: totalClasses - presentClasses,
      attendancePercentage: attendancePercentage + "%",
      status: attendancePercentage >= 75 ? "Above 75%" : "Below 75%",
    });
  }

  // Calculate subject summary
  const currentYear = new Date().getFullYear();
  let academicYear = "";

  // FIX 1: Academic Year calculation for specific class
  if (selectedClass) {
    // If a specific class is selected, use its year directly
    academicYear = selectedClass.year || currentYear;
    // Format as academic year (e.g., 2023-2024)
    if (academicYear) {
      academicYear = `${academicYear}-${parseInt(academicYear) + 1}`;
    } else {
      academicYear = currentYear;
    }
  } else if (yearFilter !== "all") {
    // If year filter is set, calculate academic year from filter
    const yearNum = parseInt(yearFilter);
    // Calculate academic year based on current year and year filter
    const baseYear = currentYear - yearNum + 1;
    academicYear = `${baseYear}-${baseYear + 1}`;
  } else if (semesterFilter !== "all") {
    // If semester filter is set, estimate academic year
    const sem = parseInt(semesterFilter);
    const approxYear = Math.ceil(sem / 2);
    const baseYear = currentYear - approxYear + 1;
    academicYear = `${baseYear}-${baseYear + 1}`;
  } else {
    academicYear = "All Years";
  }

  const classDetails = [];
  let totalUniqueClasses = 0;
  let totalStudents = uniqueStudentIds.size;
  let totalSessionsAcrossAllClasses = 0;

  // FIX 2: Calculate average strength per session correctly
  let totalPresentAcrossAllSessions = 0;

  classStats.forEach((stat) => {
    totalUniqueClasses++;

    // Calculate average attendance per class
    const classRecords = classAttendanceRecords.get(stat.classId) || [];
    const uniqueDates = stat.uniqueSessions.size; // Use the unique dates per class

    // Add to total sessions across all classes
    totalSessionsAcrossAllClasses += uniqueDates;

    // Calculate average strength (average attendance per session)
    let avgStrength = 0;
    if (uniqueDates > 0) {
      // Group attendance by date and session
      const attendanceBySession = {};
      classRecords.forEach((record) => {
        const sessionKey = `${record.date}-${record.session || 1}`;
        if (!attendanceBySession[sessionKey]) {
          attendanceBySession[sessionKey] = {
            present: 0,
            total: 0,
          };
        }
        attendanceBySession[sessionKey].total++;
        if (record.status === "present") {
          attendanceBySession[sessionKey].present++;
        }
      });

      // Calculate average attendance across all sessions
      const totalAttendance = Object.values(attendanceBySession).reduce(
        (sum, day) => sum + day.present,
        0
      );
      avgStrength = Math.round((totalAttendance / uniqueDates) * 10) / 10;
      totalPresentAcrossAllSessions += totalAttendance;
    }

    classDetails.push({
      Subject: `${stat.className} (${stat.classCode})`,
      Faculty: stat.faculty,
      Department: stat.department,
      Semester: stat.semester,
      "Total Sessions": uniqueDates,
      "Total Students": stat.uniqueStudents.size,
      "Average Attendance per Session": avgStrength,
    });
  });

  // FIX 3: Subject and Faculty names for specific class
  let subjectName = "Multiple Subjects";
  let facultyName = "Multiple Faculty";
  let departmentName =
    branchFilter !== "all" ? branchFilter : "All Departments";
  let semesterName =
    semesterFilter !== "all" ? `Semester ${semesterFilter}` : "All Semesters";

  if (selectedClass) {
    subjectName = `${selectedClass.name} (${selectedClass.code})`;
    facultyName = selectedClass.faculty || "Not Assigned";
    departmentName = selectedClass.department;
    semesterName = `Semester ${selectedClass.semester}`;
  } else if (totalUniqueClasses === 1) {
    // If only one class in the results, use that class info
    const stat = Array.from(classStats.values())[0];
    if (stat) {
      subjectName = `${stat.className} (${stat.classCode})`;
      facultyName = stat.faculty || "Not Assigned";
      departmentName = stat.department;
      semesterName = `Semester ${stat.semester}`;
    }
  }

  // FIX 4: Calculate average strength correctly
  const averageStrength =
    totalUniqueSessions > 0
      ? Math.round((totalPresentAcrossAllSessions / totalUniqueSessions) * 10) /
        10
      : 0;

  const subjectSummary = {
    subjectName: subjectName,
    facultyName: facultyName,
    department: departmentName,
    semester: semesterName,
    academicYear: academicYear,
    totalSessions: totalUniqueSessions, // Use unique sessions, not total attendance records
    totalStudents: totalStudents,
    averageStrength: averageStrength,
    totalAttendanceRecords: totalAttendanceRecords,
  };

  // Create enhanced export with subject summary
  const enhancedExport = {
    subjectSummary: subjectSummary,
    classDetails: classDetails,
    studentData: exportData,
    exportDate: new Date().toLocaleString(),
    statistics: {
      totalAttendanceRecords: totalAttendanceRecords,
      uniqueClassSessions: totalUniqueSessions,
      uniqueStudents: totalStudents,
      uniqueClasses: totalUniqueClasses,
    },
  };

  switch (format) {
    case "csv":
      exportToCSVEnhanced(enhancedExport);
      break;
    case "excel":
      exportToExcelEnhanced(enhancedExport);
      break;
    case "json":
      exportToJSONEnhanced(enhancedExport);
      break;
    case "pdf":
      exportToPDFEnhanced(enhancedExport);
      break;
  }
}

function exportToCSVEnhanced(data) {
  if (data.studentData.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  let csvContent = "==================================================\n";
  csvContent += "ATTENDANCE REPORT - DETAILED SUBJECT ANALYSIS\n";
  csvContent += "==================================================\n\n";

  // Subject Summary Section - use ASCII only
  csvContent += "SUBJECT SUMMARY:\n";
  csvContent += "================\n";
  csvContent += `Subject: ${data.subjectSummary.subjectName}\n`;
  csvContent += `Faculty: ${data.subjectSummary.facultyName}\n`;
  csvContent += `Department: ${data.subjectSummary.department}\n`;
  csvContent += `Semester: ${data.subjectSummary.semester}\n`;
  csvContent += `Academic Year: ${data.subjectSummary.academicYear}\n`;
  csvContent += `Total Sessions: ${data.subjectSummary.totalSessions}\n`;
  csvContent += `Total Students: ${data.subjectSummary.totalStudents}\n`;
  csvContent += `Average Strength: ${data.subjectSummary.averageStrength}\n`;
  csvContent += `Unique Classes: ${data.statistics.uniqueClasses}\n`;
  csvContent += `Total Attendance Records: ${data.statistics.totalAttendanceRecords}\n\n`;

  // Class Details Section (if multiple classes)
  if (data.classDetails.length > 0) {
    csvContent += "CLASS-WISE DETAILS:\n";
    csvContent += "===================\n";
    csvContent +=
      "Subject,Faculty,Department,Semester,Total Sessions,Total Students,Average Attendance per Session\n";
    data.classDetails.forEach((cls) => {
      csvContent += `${cls.Subject},${cls.Faculty},${cls.Department},${cls.Semester},${cls["Total Sessions"]},${cls["Total Students"]},${cls["Average Attendance per Session"]}\n`;
    });
    csvContent += "\n";
  }

  csvContent += `Export Date: ${data.exportDate}\n\n`;

  // Student Data Section
  csvContent += "STUDENT ATTENDANCE DETAILS:\n";
  csvContent += "===========================\n";
  const headers = Object.keys(data.studentData[0]).join(",");
  const rows = data.studentData.map((item) =>
    Object.values(item)
      .map((value) => {
        // Convert any remaining Unicode characters in values
        const stringValue = String(value);
        const asciiValue = toAsciiText(stringValue);
        return `"${asciiValue.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  csvContent += headers + "\n";
  csvContent += rows.join("\n");

  downloadCSV(csvContent, `attendance_report_${new Date().getTime()}.csv`);
  showToast("CSV exported with detailed subject information!");
}

function exportToExcelEnhanced(data) {
  if (data.studentData.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  // Create HTML table for Excel
  let html = '<html><head><meta charset="UTF-8">';
  html += "<style>body { font-family: Arial; margin: 20px; } ";
  html += "h1, h2, h3 { color: #2c3e50; } ";
  html +=
    ".summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; } ";
  html +=
    "table { width: 100%; border-collapse: collapse; margin-top: 20px; } ";
  html +=
    "th { background: #1f96d3; color: white; padding: 12px; text-align: left; font-weight: 600; } ";
  html += "td { padding: 10px; border: 1px solid #ddd; } ";
  html +=
    ".header-row { background: #2c3e50; color: white; font-weight: bold; } ";
  html += "</style></head><body>";

  // Title
  html += "<h1>📊 Attendance Report - Detailed Subject Analysis</h1>";
  html += `<p><strong>Export Date:</strong> ${data.exportDate}</p>`;

  // Subject Summary
  html += '<div class="summary">';
  html += "<h2>Subject Summary</h2>";
  html += `<p><strong>Subject:</strong> ${data.subjectSummary.subjectName}</p>`;
  html += `<p><strong>Faculty:</strong> ${data.subjectSummary.facultyName}</p>`;
  html += `<p><strong>Department:</strong> ${data.subjectSummary.department}</p>`;
  html += `<p><strong>Semester:</strong> ${data.subjectSummary.semester}</p>`;
  html += `<p><strong>Academic Year:</strong> ${data.subjectSummary.academicYear}</p>`;
  html += `<p><strong>Total Sessions:</strong> ${data.subjectSummary.totalSessions}</p>`;
  html += `<p><strong>Total Students:</strong> ${data.subjectSummary.totalStudents}</p>`;
  html += `<p><strong>Average Strength:</strong> ${data.subjectSummary.averageStrength}</p>`;
  html += `<p><strong>Unique Classes:</strong> ${data.statistics.uniqueClasses}</p>`;
  html += `<p><strong>Total Attendance Records:</strong> ${data.statistics.totalAttendanceRecords}</p>`;
  html += "</div>";

  // Class Details Table (if multiple classes)
  if (data.classDetails.length > 0) {
    html += "<h3>Class-wise Details</h3>";
    html += '<table border="1">';
    html += '<thead><tr class="header-row">';
    html +=
      "<th>Subject</th><th>Faculty</th><th>Department</th><th>Semester</th><th>Total Sessions</th><th>Total Students</th><th>Average Attendance per Session</th>";
    html += "</tr></thead><tbody>";

    data.classDetails.forEach((cls) => {
      html += "<tr>";
      html += `<td>${cls.Subject}</td>`;
      html += `<td>${cls.Faculty}</td>`;
      html += `<td>${cls.Department}</td>`;
      html += `<td>${cls.Semester}</td>`;
      html += `<td>${cls["Total Sessions"]}</td>`;
      html += `<td>${cls["Total Students"]}</td>`;
      html += `<td>${cls["Average Attendance per Session"]}</td>`;
      html += "</tr>";
    });

    html += "</tbody></table>";
  }

  // Student Data Table
  html += "<h3>Student Attendance Details</h3>";
  html += '<table border="1">';
  html += '<thead><tr class="header-row">';

  // Headers
  Object.keys(data.studentData[0]).forEach((key) => {
    html += `<th>${key}</th>`;
  });
  html += "</tr></thead><tbody>";

  // Data rows
  data.studentData.forEach((item) => {
    html += "<tr>";
    Object.values(item).forEach((value) => {
      html += `<td>${value}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  html += "</body></html>";

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `attendance_report_${new Date().getTime()}.xls`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Excel report exported with detailed subject information!");
}

function exportToJSONEnhanced(data) {
  if (data.studentData.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `attendance_report_${new Date().getTime()}.json`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("JSON report exported with detailed subject information!");
}

function exportToPDFEnhanced(data) {
  if (data.studentData.length === 0) {
    showToast("No data to export", "error");
    return;
  }

  // Simple PDF generation using window.print()
  const printWindow = window.open("", "_blank");
  printWindow.document.write(
    "<html><head><title>Attendance Detailed Report</title>"
  );
  printWindow.document.write("<style>");
  printWindow.document.write("body { font-family: Arial; margin: 20px; }");
  printWindow.document.write("h1, h2, h3 { color: #2c3e50; }");
  printWindow.document.write(
    ".summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ddd; }"
  );
  printWindow.document.write(
    "table { width: 100%; border-collapse: collapse; margin-top: 20px; }"
  );
  printWindow.document.write(
    "th { background-color: #1f96d3; color: white; padding: 12px; text-align: left; font-weight: 600; }"
  );
  printWindow.document.write(
    "td { border: 1px solid #ddd; padding: 8px; text-align: left; }"
  );
  printWindow.document.write(
    ".header { background: #2c3e50; color: white; padding: 10px; text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }"
  );
  printWindow.document.write("</style>");
  printWindow.document.write("</head><body>");

  // Header
  printWindow.document.write(
    '<div class="header">📊 Attendance Report - Detailed Subject Analysis</div>'
  );
  printWindow.document.write(
    `<p style="text-align: right;"><strong>Export Date:</strong> ${data.exportDate}</p>`
  );

  // Subject Summary
  printWindow.document.write('<div class="summary">');
  printWindow.document.write("<h2>📚 Subject Summary</h2>");
  printWindow.document.write(
    `<p><strong>Subject:</strong> ${data.subjectSummary.subjectName}</p>`
  );
  printWindow.document.write(
    `<p><strong>Faculty:</strong> ${data.subjectSummary.facultyName}</p>`
  );
  printWindow.document.write(
    `<p><strong>Department:</strong> ${data.subjectSummary.department}</p>`
  );
  printWindow.document.write(
    `<p><strong>Semester:</strong> ${data.subjectSummary.semester}</p>`
  );
  printWindow.document.write(
    `<p><strong>Academic Year:</strong> ${data.subjectSummary.academicYear}</p>`
  );
  printWindow.document.write(
    `<p><strong>Total Sessions:</strong> ${data.subjectSummary.totalSessions}</p>`
  );
  printWindow.document.write(
    `<p><strong>Total Students:</strong> ${data.subjectSummary.totalStudents}</p>`
  );
  printWindow.document.write(
    `<p><strong>Average Strength:</strong> ${data.subjectSummary.averageStrength}</p>`
  );
  printWindow.document.write(
    `<p><strong>Unique Classes:</strong> ${data.statistics.uniqueClasses}</p>`
  );
  printWindow.document.write(
    `<p><strong>Total Attendance Records:</strong> ${data.statistics.totalAttendanceRecords}</p>`
  );
  printWindow.document.write("</div>");

  // Class Details Table (if multiple classes)
  if (data.classDetails.length > 0) {
    printWindow.document.write("<h3>📊 Class-wise Details</h3>");
    printWindow.document.write('<table border="1">');
    printWindow.document.write("<thead><tr>");
    printWindow.document.write(
      "<th>Subject</th><th>Faculty</th><th>Department</th><th>Semester</th><th>Total Sessions</th><th>Total Students</th><th>Average Attendance per Session</th>"
    );
    printWindow.document.write("</tr></thead><tbody>");

    data.classDetails.forEach((cls) => {
      printWindow.document.write("<tr>");
      printWindow.document.write(`<td>${cls.Subject}</td>`);
      printWindow.document.write(`<td>${cls.Faculty}</td>`);
      printWindow.document.write(`<td>${cls.Department}</td>`);
      printWindow.document.write(`<td>${cls.Semester}</td>`);
      printWindow.document.write(`<td>${cls["Total Sessions"]}</td>`);
      printWindow.document.write(`<td>${cls["Total Students"]}</td>`);
      printWindow.document.write(
        `<td>${cls["Average Attendance per Session"]}</td>`
      );
      printWindow.document.write("</tr>");
    });

    printWindow.document.write("</tbody></table>");
  }

  // Student Data Table
  printWindow.document.write("<h3>👥 Student Attendance Details</h3>");
  printWindow.document.write('<table border="1">');
  printWindow.document.write("<thead><tr>");

  // Headers
  Object.keys(data.studentData[0]).forEach((key) => {
    printWindow.document.write(`<th>${key}</th>`);
  });
  printWindow.document.write("</tr></thead><tbody>");

  // Data rows
  data.studentData.forEach((item) => {
    printWindow.document.write("<tr>");
    Object.values(item).forEach((value) => {
      printWindow.document.write(`<td>${value}</td>`);
    });
    printWindow.document.write("</tr>");
  });

  printWindow.document.write("</tbody></table>");
  printWindow.document.write("</body></html>");
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    showToast("PDF report generated! Use print dialog to save as PDF.");
  }, 500);
}

async function loadAdminAttendanceHistory() {
  console.log("Loading admin attendance history...");

  // Get filter values
  const yearFilter = document.getElementById("adminYearFilter").value;
  const branchFilter = document.getElementById("adminBranchFilter").value;
  const semesterFilter = document.getElementById("adminSemesterFilter").value;
  const classFilter = document.getElementById("adminClassFilter").value;
  const dateFrom = document.getElementById("adminDateFrom").value;
  const dateTo = document.getElementById("adminDateTo").value;
  const statusFilter = document.getElementById("adminStatusFilter").value;
  const sortBy = document.getElementById("adminSortBy").value;

  // Show loading state
  const tableBody = document.getElementById("adminAttendanceBody");
  const recordCount = document.getElementById("adminRecordCount");
  tableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding: 40px; color: gray;">
                        ⏳ Loading attendance data...
                    </td>
                </tr>
            `;
  recordCount.textContent = `(Loading...)`;

  try {
    // Get all data
    const allAttendance = await getAll("attendance");
    const allStudents = await getAll("students");
    const allClasses = await getAll("classes");

    // Filter students based on criteria
    let filteredStudents = allStudents;

    if (yearFilter !== "all") {
      const yearNum = parseInt(yearFilter);
      filteredStudents = filteredStudents.filter(
        (student) => Math.ceil(student.semester / 2) === yearNum
      );
    }

    if (branchFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.department === branchFilter
      );
    }

    if (semesterFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.semester == semesterFilter
      );
    }

    // Get selected class if any
    let selectedClass = null;
    if (classFilter !== "all") {
      selectedClass = allClasses.find((c) => c.id === parseInt(classFilter));

      // If semester filter is set, verify the selected class matches the semester
      if (
        semesterFilter !== "all" &&
        selectedClass &&
        selectedClass.semester != semesterFilter
      ) {
        // Don't show data if class doesn't match selected semester
        tableBody.innerHTML = `
                            <tr>
                                <td colspan="10" style="text-align:center; padding: 40px; color: #e74c3c;">
                                    ⚠️ Selected class (${selectedClass.name}) is not in Semester ${semesterFilter}.<br>
                                    Please select a different class or clear the semester filter.
                                </td>
                            </tr>
                        `;
        recordCount.textContent = `(0)`;
        document.getElementById("statTotalRecords").textContent = "0";
        document.getElementById("statAvgPercentage").textContent = "0%";
        document.getElementById("statAbove75").textContent = "0";
        document.getElementById("statBelow75").textContent = "0";
        document.getElementById("yearWiseAttendanceSummary").innerHTML =
          '<p style="color: #999;">No data available</p>';
        return;
      }
    }

    // Filter classes by semester if semester filter is set
    let filteredClasses = allClasses;
    if (semesterFilter !== "all") {
      filteredClasses = allClasses.filter(
        (cls) => cls.semester == semesterFilter
      );

      // Also filter by branch if branch filter is set
      if (branchFilter !== "all") {
        filteredClasses = filteredClasses.filter(
          (cls) => cls.department === branchFilter
        );
      }
    }

    // Prepare data for table
    const tableData = [];
    let above75Count = 0;
    let below75Count = 0;
    let totalPercentage = 0;
    let studentCount = 0;

    for (const student of filteredStudents) {
      // Get relevant classes for this student - only from filteredClasses
      const studentClasses = filteredClasses.filter(
        (cls) =>
          cls.semester == student.semester &&
          cls.department === student.department
      );

      let relevantClassIds = studentClasses.map((c) => c.id);
      if (classFilter !== "all") {
        relevantClassIds = [parseInt(classFilter)];

        // If specific class is selected, check if student is in correct dept/sem
        if (
          selectedClass &&
          (student.department !== selectedClass.department ||
            student.semester != selectedClass.semester)
        ) {
          continue;
        }
      }

      // If no relevant classes, skip this student
      if (relevantClassIds.length === 0) {
        continue;
      }

      // Get attendance for this student
      const studentAttendance = allAttendance.filter(
        (record) =>
          record.studentId === student.id &&
          relevantClassIds.includes(record.classId)
      );

      // Apply date filter
      let filteredAttendance = studentAttendance;
      const dateFilterType =
        document.querySelector('input[name="dateFilterType"]:checked')?.value ||
        "all";

      if (dateFilterType === "range" && dateFrom && dateTo) {
        filteredAttendance = studentAttendance.filter((r) => {
          const recordDate = new Date(r.date);
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);

          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);

          return recordDate >= fromDate && recordDate <= toDate;
        });
      }

      const totalClasses = filteredAttendance.length;
      const presentClasses = filteredAttendance.filter(
        (r) => r.status === "present"
      ).length;
      const attendancePercentage =
        totalClasses > 0
          ? Math.round((presentClasses / totalClasses) * 100)
          : 0;

      // Apply status filter
      if (statusFilter === "present" && attendancePercentage === 0) continue;
      if (statusFilter === "absent" && totalClasses - presentClasses === 0)
        continue;

      // Get class name(s) for display
      let className = "";
      if (selectedClass) {
        className = `${selectedClass.name} (${selectedClass.code})`;
      } else if (relevantClassIds.length === 1) {
        const cls = allClasses.find((c) => c.id === relevantClassIds[0]);
        className = cls ? `${cls.name} (${cls.code})` : "Multiple";
      } else {
        className = `${relevantClassIds.length} classes`;
      }

      // Add to table data
      tableData.push({
        id: student.id,
        rollNo: student.rollNo || "N/A",
        name: `${student.firstName || ""} ${student.lastName || ""}`,
        department: student.department || "N/A",
        year: Math.ceil(student.semester / 2),
        semester: student.semester || "N/A",
        className: className,
        totalClasses: totalClasses,
        presentClasses: presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: attendancePercentage,
        student: student,
      });

      // Update statistics
      studentCount++;
      totalPercentage += attendancePercentage;

      if (attendancePercentage >= 75) {
        above75Count++;
      } else {
        below75Count++;
      }
    }

    // Apply sorting
    tableData.sort((a, b) => {
      switch (sortBy) {
        case "percentage_desc":
          return b.attendancePercentage - a.attendancePercentage;
        case "percentage_asc":
          return a.attendancePercentage - b.attendancePercentage;
        case "rollno_asc":
          return (a.rollNo || "").localeCompare(b.rollNo || "");
        case "rollno_desc":
          return (b.rollNo || "").localeCompare(a.rollNo || "");
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return b.attendancePercentage - a.attendancePercentage;
      }
    });

    // Update table
    tableBody.innerHTML = "";

    if (tableData.length === 0) {
      tableBody.innerHTML = `
                        <tr>
                            <td colspan="10" style="text-align:center; padding: 40px; color: gray;">
                                📭 No attendance records found with the current filters.
                            </td>
                        </tr>
                    `;
    } else {
      tableData.forEach((item) => {
        const row = document.createElement("tr");
        const percentageColor =
          item.attendancePercentage >= 75 ? "status-present" : "status-absent";

        row.innerHTML = `
                            <td>${item.rollNo}</td>
                            <td>${item.name}</td>
                            <td>${item.department}</td>
                            <td>${item.year}</td>
                            <td>${item.semester}</td>
                            <td>${item.className}</td>
                            <td>${item.totalClasses}</td>
                            <td><span class="status-badge-table status-present">${item.presentClasses}</span></td>
                            <td><span class="status-badge-table status-absent">${item.absentClasses}</span></td>
                            <td><span class="status-badge-table ${percentageColor}">${item.attendancePercentage}%</span></td>
                        `;
        tableBody.appendChild(row);
      });
    }

    // Update record count
    recordCount.textContent = `(${tableData.length})`;

    // Update statistics
    const avgPercentage =
      studentCount > 0 ? Math.round(totalPercentage / studentCount) : 0;
    document.getElementById("statTotalRecords").textContent = studentCount;
    document.getElementById(
      "statAvgPercentage"
    ).textContent = `${avgPercentage}%`;
    document.getElementById("statAbove75").textContent = above75Count;
    document.getElementById("statBelow75").textContent = below75Count;

    // Generate year-wise summary
    generateYearWiseSummary(tableData);

    // Update class filter dropdown based on semester filter
    updateClassFilterDropdown(semesterFilter, branchFilter);

    showToast(`Loaded ${tableData.length} attendance records`, "success");
  } catch (error) {
    console.error("Error loading attendance history:", error);
    tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align:center; padding: 40px; color: #e74c3c;">
                            ❌ Error loading attendance data. Please try again.
                        </td>
                    </tr>
                `;
    recordCount.textContent = `(Error)`;
    showToast("Error loading attendance data", "error");
  }
}

function generateYearWiseSummary(tableData) {
  const summaryContainer = document.getElementById("yearWiseAttendanceSummary");

  if (tableData.length === 0) {
    summaryContainer.innerHTML =
      '<p style="color: #999; font-style: italic;">No data available for summary</p>';
    return;
  }

  // Group by year
  const yearStats = {};

  tableData.forEach((item) => {
    const year = item.year;
    if (!yearStats[year]) {
      yearStats[year] = {
        totalStudents: 0,
        totalPercentage: 0,
        above75: 0,
        below75: 0,
      };
    }

    yearStats[year].totalStudents++;
    yearStats[year].totalPercentage += item.attendancePercentage;

    if (item.attendancePercentage >= 75) {
      yearStats[year].above75++;
    } else {
      yearStats[year].below75++;
    }
  });

  let summaryHTML =
    '<div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">';

  for (const year in yearStats) {
    const stats = yearStats[year];
    const avgPercentage = Math.round(
      stats.totalPercentage / stats.totalStudents
    );
    const percentageColor = avgPercentage >= 75 ? "#27ae60" : "#e74c3c";

    summaryHTML += `
                    <div style="flex: 1; min-width: 200px; background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${percentageColor};">
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #2c3e50;">📊 Year ${year}</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Students:</span>
                            <span style="font-weight: bold;">${stats.totalStudents}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Avg. Attendance:</span>
                            <span style="font-weight: bold; color: ${percentageColor};">${avgPercentage}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Above 75%:</span>
                            <span style="font-weight: bold; color: #27ae60;">${stats.above75}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Below 75%:</span>
                            <span style="font-weight: bold; color: #e74c3c;">${stats.below75}</span>
                        </div>
                        <div style="margin-top: 10px; text-align: center;">
                            <button class="btn btn-small btn-info" onclick="viewYearDetails(${year})" style="font-size: 11px; padding: 4px 8px;">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
  }

  summaryHTML += "</div>";
  summaryContainer.innerHTML = summaryHTML;
}

function clearAdminFilters() {
  document.getElementById("adminYearFilter").value = "all";
  document.getElementById("adminBranchFilter").value = "all";
  document.getElementById("adminSemesterFilter").value = "all";

  // Reset class filter with all classes
  const classSelect = document.getElementById("adminClassFilter");
  classSelect.innerHTML = '<option value="all">All Classes</option>';
  // Repopulate with all classes
  populateAdminClassFilter("all", "all");

  document.getElementById("adminStatusFilter").value = "all";
  document.getElementById("adminSortBy").value = "percentage_desc";

  // Reset date filter
  document.querySelector(
    'input[name="dateFilterType"][value="all"]'
  ).checked = true;
  document.getElementById("dateRangeInputs").style.display = "none";
  document.getElementById("adminDateFrom").value = "";
  document.getElementById("adminDateTo").value = "";

  showToast("Filters cleared", "info");
}

async function viewYearDetails(year) {
  // Set filters for the selected year
  document.getElementById("adminYearFilter").value = year;
  document.getElementById("adminSemesterFilter").value = "all";
  document.getElementById("adminClassFilter").value = "all";
  document.getElementById("adminBranchFilter").value = "all";

  // Reset date filter
  document.querySelector(
    'input[name="dateFilterType"][value="all"]'
  ).checked = true;
  document.getElementById("dateRangeInputs").style.display = "none";
  document.getElementById("adminDateFrom").value = "";
  document.getElementById("adminDateTo").value = "";

  document.getElementById("adminStatusFilter").value = "all";
  document.getElementById("adminSortBy").value = "percentage_desc";

  // Scroll to the table
  document
    .getElementById("adminAttendanceHistory")
    .scrollIntoView({ behavior: "smooth" });

  showToast(
    `Filters set for Year ${year}. Click "Load Attendance" to view data.`,
    "info"
  );
}

function toggleDateRange() {
  const dateRangeInputs = document.getElementById("dateRangeInputs");
  const dateFilterRadios = document.querySelectorAll(
    'input[name="dateFilterType"]'
  );

  // Find checked radio
  let checkedValue = "all";
  dateFilterRadios.forEach((radio) => {
    if (radio.checked) {
      checkedValue = radio.value;
    }
  });

  if (checkedValue === "range") {
    dateRangeInputs.style.display = "block";

    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById("adminDateFrom").value = thirtyDaysAgo
      .toISOString()
      .split("T")[0];
    document.getElementById("adminDateTo").value = today
      .toISOString()
      .split("T")[0];
  } else {
    dateRangeInputs.style.display = "none";
    // Clear date inputs
    document.getElementById("adminDateFrom").value = "";
    document.getElementById("adminDateTo").value = "";
  }
}

async function importStructuredData(zipContent, progressBar) {
  const stores = [
    "students",
    "faculty",
    "classes",
    "attendance",
    "years",
    "settings",
  ];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const file = zipContent.file(`${store}.json`);

    if (file) {
      const text = await file.async("text");
      const data = JSON.parse(text);

      // Clear existing data
      await clearStore(store);

      // Import new data
      for (const item of data) {
        await addRecord(store, item);
      }

      // Update progress
      const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
      progressBar.style.width = percent + "%";
      progressBar.textContent = percent + "%";
    }
  }
}

async function importIndividualFiles(zipContent, progressBar) {
  const fileMappings = {
    students: ["students.json", "students.csv"],
    faculty: ["faculty.json", "faculty.csv"],
    classes: ["classes.json", "classes.csv"],
    attendance: ["attendance.json", "attendance.csv"],
    years: ["years.json"],
    settings: ["settings.json"],
  };

  let processed = 0;
  const total = Object.keys(fileMappings).length;

  for (const [store, possibleFiles] of Object.entries(fileMappings)) {
    let imported = false;

    for (const fileName of possibleFiles) {
      const file = zipContent.file(fileName);
      if (file) {
        const text = await file.async("text");
        let data;

        if (fileName.endsWith(".json")) {
          data = JSON.parse(text);
        } else if (fileName.endsWith(".csv")) {
          // Simple CSV parsing for backup files
          data = parseCSVToObjects(text);
        }

        if (data && data.length > 0) {
          // Clear existing data
          await clearStore(store);

          // Import new data
          for (const item of data) {
            await addRecord(store, item);
          }

          imported = true;
          break;
        }
      }
    }

    processed++;
    const percent = 60 + Math.round((processed / total) * 30);
    progressBar.style.width = percent + "%";
    progressBar.textContent = percent + "%";
  }
}

async function importFromStructuredJSON(completeData, progressBar) {
  const stores = [
    "students",
    "faculty",
    "classes",
    "attendance",
    "years",
    "settings",
  ];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const data = completeData.data[store];

    if (data && Array.isArray(data)) {
      // Clear existing data
      await clearStore(store);

      // Import new data
      for (const item of data) {
        await addRecord(store, item);
      }
    }

    // Update progress
    const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
    progressBar.style.width = percent + "%";
    progressBar.textContent = percent + "%";
  }
}

async function importFromLegacyJSON(data, progressBar) {
  // Old format: direct object with store names as keys
  const stores = [
    "students",
    "faculty",
    "classes",
    "attendance",
    "years",
    "settings",
  ];

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];

    if (data[store] && Array.isArray(data[store])) {
      // Clear existing data
      await clearStore(store);

      // Import new data
      for (const item of data[store]) {
        await addRecord(store, item);
      }
    }

    // Update progress
    const percent = 60 + Math.round(((i + 1) / stores.length) * 30);
    progressBar.style.width = percent + "%";
    progressBar.textContent = percent + "%";
  }
}

async function exportAllData() {
  const data = {
    students: await getAll("students"),
    faculty: await getAll("faculty"),
    classes: await getAll("classes"),
    years: await getAll("years"),
    exportDate: new Date().toISOString(),
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_backup_${new Date().getTime()}.json`;
  a.click();
}


