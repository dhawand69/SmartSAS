// database.js - Supabase Database Functions

async function initDB() {
  try {
    await initSupabase();
    console.log("✅ Supabase initialized");
    return true;
  } catch (error) {
    console.error("❌ Supabase failed:", error);
    return false;
  }
}

// ========== STUDENTS ==========
async function loadStudents() {
  try {
    const { data, error } = await supabaseClient
      .from("students")
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error loading students:", error);
    return [];
  }
}

async function addStudent(studentData) {
  try {
    const { data, error } = await supabaseClient
      .from("students")
      .insert([studentData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error adding student:", error);
    throw error;
  }
}

async function updateStudent(id, updates) {
  try {
    const { data, error } = await supabaseClient
      .from("students")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error updating student:", error);
    throw error;
  }
}

async function deleteStudent(id) {
  try {
    const { error } = await supabaseClient
      .from("students")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("❌ Error deleting student:", error);
    throw error;
  }
}

// ========== ATTENDANCE ==========
async function loadAttendance() {
  try {
    const { data, error } = await supabaseClient
      .from("attendance")
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error loading attendance:", error);
    return [];
  }
}

async function markAttendance(attendanceData) {
  try {
    const { data, error } = await supabaseClient
      .from("attendance")
      .insert([attendanceData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    throw error;
  }
}

async function updateAttendance(id, updates) {
  try {
    const { data, error } = await supabaseClient
      .from("attendance")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error updating attendance:", error);
    throw error;
  }
}

// ========== CLASSES ==========
async function loadClasses() {
  try {
    const { data, error } = await supabaseClient
      .from("classes")
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error loading classes:", error);
    return [];
  }
}

async function addClass(classData) {
  try {
    const { data, error } = await supabaseClient
      .from("classes")
      .insert([classData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error adding class:", error);
    throw error;
  }
}

async function deleteClass(id) {
  try {
    const { error } = await supabaseClient
      .from("classes")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error("❌ Error deleting class:", error);
    throw error;
  }
}

// ========== FACULTY ==========
async function loadFaculty() {
  try {
    const { data, error } = await supabaseClient
      .from("faculty")
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error loading faculty:", error);
    return [];
  }
}

async function addFaculty(facultyData) {
  try {
    const { data, error } = await supabaseClient
      .from("faculty")
      .insert([facultyData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error adding faculty:", error);
    throw error;
  }
}

// ========== ACADEMIC YEARS ==========
async function loadAcademicYears() {
  try {
    const { data, error } = await supabaseClient
      .from("academic_years")
      .select("*");
    if (error) throw error;
    console.log("✅ Academic years loaded:", data);
    return data || [];
  } catch (error) {
    console.error("❌ Error fetching from years:", error);
    return [];
  }
}

async function addAcademicYear(yearData) {
  try {
    const { data, error } = await supabaseClient
      .from("academic_years")
      .insert([yearData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error adding academic year:", error);
    throw error;
  }
}

// ========== SESSIONS ==========
async function loadSessions() {
  try {
    const { data, error } = await supabaseClient
      .from("sessions")
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error loading sessions:", error);
    return [];
  }
}

async function addSession(sessionData) {
  try {
    const { data, error } = await supabaseClient
      .from("sessions")
      .insert([sessionData])
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("❌ Error adding session:", error);
    throw error;
  }
}

// ========== GENERIC FUNCTIONS ==========
async function addRecord(table, data) {
  try {
    const { data: result, error } = await supabaseClient
      .from(table)
      .insert([data])
      .select();
    if (error) throw error;
    return result[0];
  } catch (error) {
    console.error(`❌ Error adding to ${table}:`, error);
    throw error;
  }
}

async function getAll(table) {
  try {
    const { data, error } = await supabaseClient
      .from(table)
      .select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`❌ Error fetching from ${table}:`, error);
    return [];
  }
}

async function getRecord(table, id) {
  try {
    const { data, error } = await supabaseClient
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`❌ Error getting record from ${table}:`, error);
    return null;
  }
}

async function updateRecord(table, id, updates) {
  try {
    const { data, error } = await supabaseClient
      .from(table)
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`❌ Error updating ${table}:`, error);
    throw error;
  }
}

async function deleteRecord(table, id) {
  try {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error(`❌ Error deleting from ${table}:`, error);
    throw error;
  }
}

// ========== FILTERING ==========
async function getStudentsByDepartment(department) {
  try {
    const { data, error } = await supabaseClient
      .from("students")
      .select("*")
      .eq("department", department);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error filtering students:", error);
    return [];
  }
}

async function getAttendanceByDate(date) {
  try {
    const { data, error } = await supabaseClient
      .from("attendance")
      .select("*")
      .eq("date", date);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error getting attendance by date:", error);
    return [];
  }
}

async function getClassesByFaculty(facultyId) {
  try {
    const { data, error } = await supabaseClient
      .from("classes")
      .select("*")
      .eq("faculty_id", facultyId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Error getting classes by faculty:", error);
    return [];
  }
}
