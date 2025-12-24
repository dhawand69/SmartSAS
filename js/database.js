// config.js - Supabase Configuration
// Update these with your Supabase credentials

const SUPABASE_URL = "https://your-project-name.supabase.co"; // Replace with your URL
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"; // Replace with your anon key

const ADMIN_PASSWORD = "GecKaimur@148";

const branchMap = {
  101: "Civil",
  102: "Mechanical",
  103: "Electrical",
  104: "ECE",
  152: "CSE(Cyber Security)",
  156: "CSE(Networks)",
};

// Initialize Supabase client
let supabaseClient;

// Initialize Supabase when script loads
async function initSupabase() {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

let currentUser = null;
let activeStudentFilter = {
  year: "all",
  semester: null,
  branch: "all",
};

let activeClassFilter = {
  year: "all",
  semester: null,
};

let displayedStudents = [];
let selectedStudentIds = new Set();
let pendingAction = null;
let parsedBatchClasses = [];
