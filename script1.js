const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycby3n0nD35gZfGGxkahL82VIE0HiQWCUfOFpal-186JCLf_kGd88xL-LKPNwmO_i4mYh/exec";

const BRANCH_CONFIG_MAP = {
  CS: {
    id: "1R3rw-2W4zAoD0w8xXoujY5yYvnG8qYYQ6aPhRfxvZ30",
    subjects: ["M3", "AOA", "COA", "DSGT", "CS", "WebDev"],
  },
  AIML: {
    id: "10OKhAfLimxlcUJEcbzRYuvewyjocJefvJHW5kMfla6A",
    subjects: ["Maths", "Python", "ML-Core", "DL", "NLP"],
  },
  ECS: {
    id: "ECS_SPREADSHEET_ID_HERE",
    subjects: ["Analog", "Digital", "EMFT", "Communication", "Signal"],
  },
  Mech: {
    id: "MECHANICAL_SPREADSHEET_ID_HERE",
    subjects: ["Thermodynamics", "Dynamics", "Materials", "FluidMech"],
  },
  DSE: {
    id: "DSE_SPREADSHEET_ID_HERE",
    subjects: ["DataSciIntro", "RDBMS", "BigData", "AI-Ethics"],
  },
  Elect: {
    id: "ELECTRICAL_SPREADSHEET_ID_HERE",
    subjects: ["CircuitTheory", "PowerSystems", "Machines", "ControlEng"],
  },
};

const STORAGE_KEYS = {
  students: "students",
  teachers: "teachers",
  attendance: "dailyAttendanceRecords",
  activeStudent: "activeStudentSession",
  activeTeacher: "activeTeacherSession",
};

const page = document.body.dataset.page;

let students = readStorage(STORAGE_KEYS.students, []);
let teachers = readStorage(STORAGE_KEYS.teachers, []);
let dailyAttendanceRecords = readStorage(STORAGE_KEYS.attendance, {});
let activeStudent = readStorage(STORAGE_KEYS.activeStudent, null);
let activeTeacher = readStorage(STORAGE_KEYS.activeTeacher, null);
let sortAscending = true;
let latestQrFileName = "student_qr.png";
let html5QrcodeScanner = null;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIdentifier(value) {
  return /^[A-Za-z0-9-_/ ]{2,40}$/.test(value);
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (error) {
    console.error(`Failed to parse localStorage key: ${key}`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key) {
  localStorage.removeItem(key);
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function showMessage(elementId, type, message) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }

  element.className = `message ${type}`;
  element.textContent = message;
  element.classList.remove("hidden");
}

function normalizeStudent(student) {
  return {
    uniqueRoll: student.uniqueRoll,
    name: student.name,
    branch: student.branch,
    roll: student.roll ?? student.uniqueRoll.split("-").slice(1).join("-"),
    year: student.year ?? "",
    email: student.email ?? "",
  };
}

function findStudentByUniqueRoll(uniqueRoll) {
  return students
    .map(normalizeStudent)
    .find((student) => student.uniqueRoll === uniqueRoll);
}

function findTeacherById(teacherId) {
  return teachers.find((teacher) => teacher.teacherId === teacherId);
}

function setActiveStudentSession(student) {
  activeStudent = normalizeStudent(student);
  writeStorage(STORAGE_KEYS.activeStudent, activeStudent);
}

function setActiveTeacherSession(teacher) {
  activeTeacher = { ...teacher };
  writeStorage(STORAGE_KEYS.activeTeacher, activeTeacher);
}

function syncActiveSessions() {
  if (activeStudent?.uniqueRoll) {
    const matchedStudent = findStudentByUniqueRoll(activeStudent.uniqueRoll);
    if (matchedStudent) {
      activeStudent = matchedStudent;
      writeStorage(STORAGE_KEYS.activeStudent, activeStudent);
    } else {
      activeStudent = null;
      removeStorage(STORAGE_KEYS.activeStudent);
    }
  }

  if (activeTeacher?.teacherId) {
    const matchedTeacher = findTeacherById(activeTeacher.teacherId);
    if (matchedTeacher) {
      activeTeacher = { ...matchedTeacher };
      writeStorage(STORAGE_KEYS.activeTeacher, activeTeacher);
    } else {
      activeTeacher = null;
      removeStorage(STORAGE_KEYS.activeTeacher);
    }
  }
}

function renderStudentSessionState() {
  const form = document.getElementById("studentRegisterForm");
  const card = document.getElementById("studentSessionCard");
  const details = document.getElementById("studentSessionDetails");

  if (!form || !card || !details) {
    return;
  }

  if (!activeStudent) {
    form.classList.remove("hidden");
    card.classList.add("hidden");
    details.innerHTML = "";
    return;
  }

  form.classList.add("hidden");
  details.innerHTML = `
    <strong>Name:</strong> ${escapeHtml(activeStudent.name)}<br>
    <strong>Roll:</strong> ${escapeHtml(activeStudent.roll)}<br>
    <strong>Branch:</strong> ${escapeHtml(activeStudent.branch)}<br>
    <strong>Year:</strong> ${escapeHtml(activeStudent.year || "-")}<br>
    <strong>Email:</strong> ${escapeHtml(activeStudent.email || "-")}
  `;
  card.classList.remove("hidden");
}

function renderTeacherSessionState() {
  const form = document.getElementById("teacherRegisterForm");
  const card = document.getElementById("teacherSessionCard");
  const details = document.getElementById("teacherSessionDetails");

  if (!form || !card || !details) {
    return;
  }

  if (!activeTeacher) {
    form.classList.remove("hidden");
    card.classList.add("hidden");
    details.innerHTML = "";
    return;
  }

  form.classList.add("hidden");
  details.innerHTML = `
    <strong>Name:</strong> ${escapeHtml(activeTeacher.name)}<br>
    <strong>Teacher ID:</strong> ${escapeHtml(activeTeacher.teacherId)}<br>
    <strong>Department:</strong> ${escapeHtml(activeTeacher.department)}<br>
    <strong>Subject:</strong> ${escapeHtml(activeTeacher.subject)}<br>
    <strong>Email:</strong> ${escapeHtml(activeTeacher.email)}
  `;
  card.classList.remove("hidden");
}

function renderHomeSessionState() {
  const studentStatus = document.getElementById("homeStudentStatus");
  const teacherStatus = document.getElementById("homeTeacherStatus");

  if (studentStatus) {
    studentStatus.textContent = activeStudent
      ? `Logged in as ${activeStudent.name} (${activeStudent.uniqueRoll})`
      : "No student is logged in on this browser yet.";
  }

  if (teacherStatus) {
    teacherStatus.textContent = activeTeacher
      ? `Logged in as ${activeTeacher.name} (${activeTeacher.teacherId})`
      : "No teacher is logged in on this browser yet.";
  }
}

function renderDashboardSessionState() {
  const studentStatus = document.getElementById("dashboardStudentStatus");
  const teacherStatus = document.getElementById("dashboardTeacherStatus");
  const teacherOnlyElements = document.querySelectorAll("[data-teacher-only]");

  if (studentStatus) {
    studentStatus.textContent = activeStudent
      ? `Only ${activeStudent.name} (${activeStudent.uniqueRoll}) can use QR on this browser.`
      : "No student session found. Register one student first to use QR here.";
  }

  if (teacherStatus) {
    teacherStatus.textContent = activeTeacher
      ? `Teacher access active for ${activeTeacher.name} (${activeTeacher.teacherId}).`
      : "No teacher session found. Delete and export actions are locked.";
  }

  teacherOnlyElements.forEach((element) => {
    element.classList.toggle("hidden", !activeTeacher);
  });
}

function getAttendanceSessions() {
  const sessions = [];

  Object.entries(dailyAttendanceRecords).forEach(([date, branchEntries]) => {
    Object.entries(branchEntries ?? {}).forEach(([branch, subjectEntries]) => {
      Object.entries(subjectEntries ?? {}).forEach(([subject, records]) => {
        sessions.push({
          date,
          branch,
          subject,
          records: records ?? {},
        });
      });
    });
  });

  return sessions.sort((first, second) => second.date.localeCompare(first.date));
}

function getExportTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function sanitizeFilePart(value) {
  return String(value)
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "export";
}

function buildBranchExportFileName(branch, extension) {
  return `attendance_${sanitizeFilePart(branch)}_${getExportTimestamp()}.${extension}`;
}

function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value) {
  const normalizedValue = String(value ?? "");
  if (/[",\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function convertRowsToCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(","),
    ),
  ];

  return csvLines.join("\n");
}

function getBranchExportRows(branch) {
  const branchStudents = students
    .map(normalizeStudent)
    .filter((student) => student.branch === branch)
    .sort((first, second) =>
      first.roll.localeCompare(second.roll, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

  if (!branchStudents.length) {
    return [];
  }

  const studentMap = new Map(
    branchStudents.map((student) => [student.uniqueRoll, student]),
  );

  return getAttendanceSessions()
    .filter((session) => session.branch === branch)
    .flatMap((session) =>
      branchStudents.map((student) => ({
        Date: session.date,
        Branch: branch,
        Subject: session.subject,
        RollNumber: student.roll,
        UniqueRoll: student.uniqueRoll,
        StudentName: student.name,
        Year: student.year,
        Email: student.email,
        Status:
          session.records[student.uniqueRoll] === "Present" ? "Present" : "Absent",
        TeacherInSession: activeTeacher?.name ?? "",
        StudentRegistered: studentMap.has(student.uniqueRoll) ? "Yes" : "No",
      })),
    );
}

function exportBranchAttendanceCsv(branch) {
  if (!activeTeacher) {
    alert("Teacher access is required to export branch attendance.");
    return;
  }

  const rows = getBranchExportRows(branch);
  if (!rows.length) {
    alert(`No attendance data is available for ${branch} yet.`);
    return;
  }

  const csv = convertRowsToCsv(rows);
  downloadTextFile(csv, buildBranchExportFileName(branch, "csv"), "text/csv;charset=utf-8;");
}

function exportBranchAttendanceExcel(branch) {
  if (!activeTeacher) {
    alert("Teacher access is required to export branch attendance.");
    return;
  }

  if (typeof XLSX === "undefined") {
    alert(
      "Excel export library could not be loaded. Refresh the page after reconnecting to the internet.",
    );
    return;
  }

  const rows = getBranchExportRows(branch);
  if (!rows.length) {
    alert(`No attendance data is available for ${branch} yet.`);
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeFilePart(branch));
  XLSX.writeFile(workbook, buildBranchExportFileName(branch, "xlsx"));
}

function calculateAttendancePercentage(presentCount, totalCount) {
  if (!totalCount) {
    return "0%";
  }

  return `${((presentCount / totalCount) * 100).toFixed(1)}%`;
}

function getStudentAttendanceSummary(uniqueRoll) {
  const student = findStudentByUniqueRoll(uniqueRoll);
  if (!student) {
    return null;
  }

  const sessions = getAttendanceSessions().filter(
    (session) => session.branch === student.branch,
  );
  const subjectMap = {};
  const history = [];

  sessions.forEach((session) => {
    if (!subjectMap[session.subject]) {
      subjectMap[session.subject] = {
        subject: session.subject,
        presentCount: 0,
        totalCount: 0,
      };
    }

    const status = session.records[uniqueRoll] === "Present" ? "Present" : "Absent";
    subjectMap[session.subject].totalCount += 1;
    if (status === "Present") {
      subjectMap[session.subject].presentCount += 1;
    }

    history.push({
      date: session.date,
      subject: session.subject,
      branch: session.branch,
      status,
    });
  });

  const subjectRows = Object.values(subjectMap)
    .sort((first, second) => first.subject.localeCompare(second.subject))
    .map((entry) => ({
      ...entry,
      percentage: calculateAttendancePercentage(
        entry.presentCount,
        entry.totalCount,
      ),
    }));

  const overallPresent = subjectRows.reduce(
    (total, entry) => total + entry.presentCount,
    0,
  );
  const overallTotal = subjectRows.reduce(
    (total, entry) => total + entry.totalCount,
    0,
  );

  return {
    student,
    subjectRows,
    history,
    overallPresent,
    overallTotal,
    overallPercentage: calculateAttendancePercentage(overallPresent, overallTotal),
  };
}

function getTeacherAttendanceSummary(selectedBranch = "", selectedSubject = "") {
  const relevantStudents = students
    .map(normalizeStudent)
    .filter((student) => !selectedBranch || student.branch === selectedBranch)
    .sort((first, second) => {
      if (first.branch !== second.branch) {
        return first.branch.localeCompare(second.branch);
      }

      return first.roll.localeCompare(second.roll, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const relevantSessions = getAttendanceSessions().filter((session) => {
    if (selectedBranch && session.branch !== selectedBranch) {
      return false;
    }

    if (selectedSubject && session.subject !== selectedSubject) {
      return false;
    }

    return true;
  });

  const rows = relevantStudents.map((student) => {
    const studentSessions = relevantSessions.filter(
      (session) => session.branch === student.branch,
    );
    const totalCount = studentSessions.length;
    const presentCount = studentSessions.filter(
      (session) => session.records[student.uniqueRoll] === "Present",
    ).length;

    return {
      ...student,
      presentCount,
      totalCount,
      percentage: calculateAttendancePercentage(presentCount, totalCount),
    };
  });

  const lectureRows = relevantSessions.map((session) => {
    const branchStudents = students
      .map(normalizeStudent)
      .filter((student) => student.branch === session.branch);
    const presentCount = Object.values(session.records).filter(
      (status) => status === "Present",
    ).length;

    return {
      date: session.date,
      branch: session.branch,
      subject: session.subject,
      presentCount,
      absentCount: Math.max(branchStudents.length - presentCount, 0),
    };
  });

  return {
    rows,
    lectureRows,
    totalStudents: relevantStudents.length,
    totalLectures: relevantSessions.length,
    totalSubjects: new Set(relevantSessions.map((session) => session.subject)).size,
  };
}

function populateTeacherDashboardSubjects() {
  const branchSelect = document.getElementById("teacherDashboardBranch");
  const subjectSelect = document.getElementById("teacherDashboardSubject");

  if (!branchSelect || !subjectSelect) {
    return;
  }

  const selectedBranch = branchSelect.value;
  let subjects = [];

  if (selectedBranch) {
    subjects = BRANCH_CONFIG_MAP[selectedBranch]?.subjects ?? [];
  } else {
    subjects = Array.from(
      new Set(
        getAttendanceSessions().map((session) => session.subject),
      ),
    ).sort((first, second) => first.localeCompare(second));
  }

  subjectSelect.innerHTML = '<option value="">All Subjects</option>';

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });
}

function renderTeacherDashboard() {
  const accessMessage = document.getElementById("teacherDashboardAccessMessage");
  const content = document.getElementById("teacherDashboardContent");
  const teacherName = document.getElementById("teacherDashboardTeacherName");
  const totalStudents = document.getElementById("teacherTotalStudents");
  const totalLectures = document.getElementById("teacherTotalLectures");
  const totalSubjects = document.getElementById("teacherTotalSubjects");
  const rowsBody = document.querySelector("#teacherAttendanceTable tbody");
  const lectureBody = document.querySelector("#teacherLectureTable tbody");
  const branchSelect = document.getElementById("teacherDashboardBranch");
  const subjectSelect = document.getElementById("teacherDashboardSubject");

  if (
    !accessMessage ||
    !content ||
    !teacherName ||
    !totalStudents ||
    !totalLectures ||
    !totalSubjects ||
    !rowsBody ||
    !lectureBody ||
    !branchSelect ||
    !subjectSelect
  ) {
    return;
  }

  if (!activeTeacher) {
    accessMessage.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }

  accessMessage.classList.add("hidden");
  content.classList.remove("hidden");
  teacherName.textContent = `${activeTeacher.name} (${activeTeacher.teacherId})`;

  const summary = getTeacherAttendanceSummary(
    branchSelect.value,
    subjectSelect.value,
  );

  totalStudents.textContent = String(summary.totalStudents);
  totalLectures.textContent = String(summary.totalLectures);
  totalSubjects.textContent = String(summary.totalSubjects);

  if (!summary.rows.length) {
    rowsBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No student attendance data is available for the selected filters.</td></tr>';
  } else {
    rowsBody.innerHTML = summary.rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.roll)}</td>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.branch)}</td>
            <td>${row.presentCount}</td>
            <td>${row.totalCount}</td>
            <td>${escapeHtml(row.percentage)}</td>
          </tr>
        `,
      )
      .join("");
  }

  if (!summary.lectureRows.length) {
    lectureBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No lecture records are available for the selected filters.</td></tr>';
  } else {
    lectureBody.innerHTML = summary.lectureRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.branch)}</td>
            <td>${escapeHtml(row.subject)}</td>
            <td>${row.presentCount}</td>
            <td>${row.absentCount}</td>
          </tr>
        `,
      )
      .join("");
  }
}

function initTeacherDashboardPage() {
  populateTeacherDashboardSubjects();
  renderTeacherDashboard();

  document
    .getElementById("teacherDashboardBranch")
    ?.addEventListener("change", () => {
      populateTeacherDashboardSubjects();
      renderTeacherDashboard();
    });
  document
    .getElementById("teacherDashboardSubject")
    ?.addEventListener("change", renderTeacherDashboard);
}

function renderStudentDashboard() {
  const accessMessage = document.getElementById("studentDashboardAccessMessage");
  const content = document.getElementById("studentDashboardContent");
  const studentName = document.getElementById("studentDashboardStudentName");
  const overallPercentage = document.getElementById("studentOverallPercentage");
  const totalPresent = document.getElementById("studentTotalPresent");
  const totalLectures = document.getElementById("studentTotalLectures");
  const subjectBody = document.querySelector("#studentSubjectTable tbody");
  const historyBody = document.querySelector("#studentHistoryTable tbody");

  if (
    !accessMessage ||
    !content ||
    !studentName ||
    !overallPercentage ||
    !totalPresent ||
    !totalLectures ||
    !subjectBody ||
    !historyBody
  ) {
    return;
  }

  if (!activeStudent) {
    accessMessage.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }

  const summary = getStudentAttendanceSummary(activeStudent.uniqueRoll);
  if (!summary) {
    accessMessage.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }

  accessMessage.classList.add("hidden");
  content.classList.remove("hidden");

  studentName.textContent = `${summary.student.name} (${summary.student.uniqueRoll})`;
  overallPercentage.textContent = summary.overallPercentage;
  totalPresent.textContent = String(summary.overallPresent);
  totalLectures.textContent = String(summary.overallTotal);

  if (!summary.subjectRows.length) {
    subjectBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No attendance has been recorded for this student yet.</td></tr>';
  } else {
    subjectBody.innerHTML = summary.subjectRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.subject)}</td>
            <td>${row.presentCount}</td>
            <td>${row.totalCount}</td>
            <td>${escapeHtml(row.percentage)}</td>
          </tr>
        `,
      )
      .join("");
  }

  if (!summary.history.length) {
    historyBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No attendance history is available yet.</td></tr>';
  } else {
    historyBody.innerHTML = summary.history
      .map(
        (entry) => `
          <tr>
            <td>${escapeHtml(entry.date)}</td>
            <td>${escapeHtml(entry.subject)}</td>
            <td>${escapeHtml(entry.branch)}</td>
            <td style="color: ${entry.status === "Present" ? "var(--success)" : "var(--danger)"}; font-weight: 700;">${escapeHtml(entry.status)}</td>
          </tr>
        `,
      )
      .join("");
  }
}

function initStudentDashboardPage() {
  renderStudentDashboard();
}

function initStudentRegisterPage() {
  const form = document.getElementById("studentRegisterForm");
  if (!form) {
    return;
  }

  renderStudentSessionState();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = normalizeText(document.getElementById("studentName").value);
    const roll = normalizeText(document.getElementById("studentRoll").value);
    const branch = document.getElementById("studentBranch").value;
    const year = normalizeText(document.getElementById("studentYear").value);
    const email = normalizeText(document.getElementById("studentEmail").value).toLowerCase();

    if (!name || !roll || !branch || !year || !email) {
      showMessage(
        "studentRegisterMessage",
        "error",
        "Fill all student fields before saving.",
      );
      return;
    }

    if (!isValidIdentifier(roll)) {
      showMessage(
        "studentRegisterMessage",
        "error",
        "Use a valid roll number with letters, numbers, spaces, dash, underscore, or slash.",
      );
      return;
    }

    if (!isValidEmail(email)) {
      showMessage(
        "studentRegisterMessage",
        "error",
        "Enter a valid student email address.",
      );
      return;
    }

    const uniqueRoll = `${branch}-${roll}`;
    const existingStudent = students.find(
      (student) => student.uniqueRoll === uniqueRoll,
    );

    if (existingStudent) {
      showMessage(
        "studentRegisterMessage",
        "error",
        `Student ${uniqueRoll} is already registered.`,
      );
      return;
    }

    const studentRecord = {
      uniqueRoll,
      name,
      branch,
      roll,
      year,
      email,
    };

    students.push(studentRecord);

    writeStorage(STORAGE_KEYS.students, students);
    setActiveStudentSession(studentRecord);
    form.reset();
    renderStudentSessionState();
    showMessage(
      "studentRegisterMessage",
      "success",
      `Student ${name} saved successfully and is now kept logged in on this browser.`,
    );
  });
}

function initTeacherRegisterPage() {
  const form = document.getElementById("teacherRegisterForm");
  if (!form) {
    return;
  }

  renderTeacherSessionState();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = normalizeText(document.getElementById("teacherName").value);
    const teacherId = normalizeText(document.getElementById("teacherId").value);
    const department = normalizeText(
      document.getElementById("teacherDepartment").value,
    );
    const subject = normalizeText(document.getElementById("teacherSubject").value);
    const email = normalizeText(document.getElementById("teacherEmail").value).toLowerCase();

    if (!name || !teacherId || !department || !subject || !email) {
      showMessage(
        "teacherRegisterMessage",
        "error",
        "Fill all teacher fields before saving.",
      );
      return;
    }

    if (!isValidIdentifier(teacherId)) {
      showMessage(
        "teacherRegisterMessage",
        "error",
        "Use a valid teacher ID with letters, numbers, spaces, dash, underscore, or slash.",
      );
      return;
    }

    if (!isValidEmail(email)) {
      showMessage(
        "teacherRegisterMessage",
        "error",
        "Enter a valid teacher email address.",
      );
      return;
    }

    const existingTeacher = teachers.find(
      (teacher) => teacher.teacherId === teacherId,
    );
    if (existingTeacher) {
      showMessage(
        "teacherRegisterMessage",
        "error",
        `Teacher ID ${teacherId} is already registered.`,
      );
      return;
    }

    const teacherRecord = { name, teacherId, department, subject, email };

    teachers.push(teacherRecord);
    writeStorage(STORAGE_KEYS.teachers, teachers);
    setActiveTeacherSession(teacherRecord);
    form.reset();
    renderTeacherSessionState();
    showMessage(
      "teacherRegisterMessage",
      "success",
      `Teacher ${name} saved successfully and is now kept logged in on this browser.`,
    );
  });
}

function populateRegisteredStudents() {
  const select = document.getElementById("registeredStudentSelect");
  if (!select) {
    return;
  }

  if (!activeStudent) {
    select.innerHTML = '<option value="">-- Register A Student First --</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = activeStudent.uniqueRoll;
  option.textContent = `${activeStudent.uniqueRoll} - ${activeStudent.name}`;
  select.appendChild(option);
  select.value = activeStudent.uniqueRoll;

  renderStudentQr(activeStudent.uniqueRoll);
}

function renderStudentQr(uniqueRoll) {
  const qrContainer = document.getElementById("qrcode");
  const qrPanel = document.getElementById("qrDisplayContainer");
  const userInfo = document.getElementById("userInfo");

  if (!qrContainer || !qrPanel || !userInfo) {
    return;
  }

  const student = findStudentByUniqueRoll(uniqueRoll);
  qrContainer.innerHTML = "";

  if (!student) {
    qrPanel.classList.add("hidden");
    return;
  }

  if (typeof QRCode === "undefined") {
    userInfo.innerHTML =
      '<span class="table-note">QR library could not be loaded. Refresh the page after reconnecting to the internet.</span>';
    qrPanel.classList.remove("hidden");
    return;
  }

  latestQrFileName = `QR_${student.branch}_${student.roll}.png`;
  const qrData = `${student.uniqueRoll}|${student.name}|${student.branch}`;

  new QRCode(qrContainer, {
    text: qrData,
    width: 180,
    height: 180,
  });

  userInfo.innerHTML = `
        <strong>Name:</strong> ${escapeHtml(student.name)}<br>
        <strong>Roll:</strong> ${escapeHtml(student.roll)}<br>
        <strong>Branch:</strong> ${escapeHtml(student.branch)}<br>
        <strong>Year:</strong> ${escapeHtml(student.year || "-")}
    `;
  qrPanel.classList.remove("hidden");
}

function updateSubjectDropdown() {
  const branchSelect = document.getElementById("branchScan");
  const subjectSelect = document.getElementById("subjectScan");
  const scannerHint = document.getElementById("scannerAccessMessage");

  if (!branchSelect || !subjectSelect) {
    return;
  }

  const selectedBranch = branchSelect.value;
  const subjects = BRANCH_CONFIG_MAP[selectedBranch]?.subjects ?? [];

  subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });

  if (scannerHint) {
    if (!activeStudent) {
      scannerHint.textContent =
        "Register a student first. Scanner access stays locked until a student session exists.";
    } else if (!activeTeacher) {
      scannerHint.textContent =
        "Student QR is ready. Teacher-only actions remain locked until a teacher session is registered on this browser.";
    } else {
      scannerHint.textContent =
        "Student and teacher sessions are active. You can scan and manage attendance safely.";
    }
  }

  displayAttendance();
}

function getSelectedLecture() {
  const selectedBranch = document.getElementById("branchScan")?.value ?? "";
  const selectedSubject = document.getElementById("subjectScan")?.value ?? "";
  return { selectedBranch, selectedSubject };
}

function ensureAttendanceBucket(date, branch, subject) {
  if (!dailyAttendanceRecords[date]) {
    dailyAttendanceRecords[date] = {};
  }
  if (!dailyAttendanceRecords[date][branch]) {
    dailyAttendanceRecords[date][branch] = {};
  }
  if (!dailyAttendanceRecords[date][branch][subject]) {
    dailyAttendanceRecords[date][branch][subject] = {};
  }

  return dailyAttendanceRecords[date][branch][subject];
}

function resumeScanner() {
  window.setTimeout(() => {
    if (html5QrcodeScanner?.resume) {
      html5QrcodeScanner.resume();
    }
  }, 1600);
}

function onScanSuccess(decodedText) {
  if (html5QrcodeScanner?.pause) {
    html5QrcodeScanner.pause(true);
  }

  const { selectedBranch, selectedSubject } = getSelectedLecture();

  if (!selectedBranch || !selectedSubject) {
    alert("Select branch and subject before scanning attendance.");
    resumeScanner();
    return;
  }

  const [uniqueRoll, name, scannedBranch] = decodedText
    .split("|")
    .map((value) => normalizeText(value));
  if (!uniqueRoll || !name || !scannedBranch) {
    alert("Invalid QR code format.");
    resumeScanner();
    return;
  }

  if (!activeStudent?.uniqueRoll) {
    alert("No student is logged in on this browser. Register a student first.");
    resumeScanner();
    return;
  }

  if (uniqueRoll !== activeStudent.uniqueRoll) {
    alert(
      `Access denied. Only ${activeStudent.name} (${activeStudent.uniqueRoll}) can scan attendance on this browser.`,
    );
    resumeScanner();
    return;
  }

  const student = findStudentByUniqueRoll(uniqueRoll);
  if (!student) {
    alert("This student is not registered in local storage.");
    resumeScanner();
    return;
  }

  if (scannedBranch !== selectedBranch) {
    alert(
      `Access denied. ${name} belongs to ${scannedBranch}, not ${selectedBranch}.`,
    );
    resumeScanner();
    return;
  }

  const todayDate = getTodayDate();
  const attendanceBucket = ensureAttendanceBucket(
    todayDate,
    selectedBranch,
    selectedSubject,
  );

  if (attendanceBucket[uniqueRoll] === "Present") {
    alert(`Attendance already marked for ${name} in ${selectedSubject}.`);
  } else {
    attendanceBucket[uniqueRoll] = "Present";
    writeStorage(STORAGE_KEYS.attendance, dailyAttendanceRecords);
    alert(
      `Attendance marked: ${name} (${uniqueRoll}) is present for ${selectedSubject}.`,
    );
  }

  displayAttendance();
  resumeScanner();
}

function onScanError() {}

function initScanner() {
  if (typeof Html5QrcodeScanner === "undefined") {
    const scannerHint = document.getElementById("scannerAccessMessage");
    if (scannerHint) {
      scannerHint.textContent =
        "QR scanner library could not be loaded. Check your internet connection and refresh.";
    }
    return;
  }

  const reader = document.getElementById("reader");
  if (!reader) {
    return;
  }

  html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    {
      fps: 10,
      qrbox: 220,
      supportedScanTypes: [0],
    },
    false,
  );

  html5QrcodeScanner.render(onScanSuccess, onScanError);
}

function toggleSortOrder() {
  sortAscending = !sortAscending;
  displayAttendance();
}

function deleteAttendanceRecord(uniqueRoll) {
  if (!activeTeacher) {
    alert("Teacher access is required to delete attendance records.");
    return;
  }

  const { selectedBranch, selectedSubject } = getSelectedLecture();
  const todayDate = getTodayDate();

  if (!selectedBranch || !selectedSubject) {
    alert("Select branch and subject before deleting attendance.");
    return;
  }

  const subjectRecords =
    dailyAttendanceRecords[todayDate]?.[selectedBranch]?.[selectedSubject];
  if (!subjectRecords?.[uniqueRoll]) {
    alert("Attendance record not found for this lecture.");
    return;
  }

  delete subjectRecords[uniqueRoll];
  writeStorage(STORAGE_KEYS.attendance, dailyAttendanceRecords);
  displayAttendance();
  alert(`Attendance removed for ${uniqueRoll}.`);
}

window.deleteAttendanceRecord = deleteAttendanceRecord;
window.toggleSortOrder = toggleSortOrder;

function displayAttendance() {
  const tbody = document.querySelector("#attendanceTable tbody");
  const sortContainer = document.getElementById("sortContainer");
  const dateLabel = document.getElementById("todayDateDisplay");
  const actionHeader = document.getElementById("attendanceActionHeader");

  if (!tbody || !sortContainer || !dateLabel) {
    return;
  }

  const todayDate = getTodayDate();
  const { selectedBranch, selectedSubject } = getSelectedLecture();
  dateLabel.textContent = todayDate;

  sortContainer.innerHTML = `
        <button type="button" onclick="toggleSortOrder()">
            Sort by Roll (${sortAscending ? "Ascending" : "Descending"})
        </button>
    `;

  if (actionHeader) {
    actionHeader.textContent = activeTeacher ? "Action" : "Status Lock";
  }

  if (!selectedBranch || !selectedSubject) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Select a branch and subject to view attendance.</td></tr>';
    return;
  }

  const filteredStudents = students
    .map(normalizeStudent)
    .filter((student) => student.branch === selectedBranch)
    .sort((first, second) => {
      const result = first.roll.localeCompare(second.roll, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortAscending ? result : -result;
    });

  if (filteredStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No registered students found for ${escapeHtml(selectedBranch)}.</td></tr>`;
    return;
  }

  const currentRecords =
    dailyAttendanceRecords[todayDate]?.[selectedBranch]?.[selectedSubject] ??
    {};

  tbody.innerHTML = filteredStudents
    .map((student) => {
      const status = currentRecords[student.uniqueRoll] ?? "Absent";
      const statusStyle =
        status === "Present"
          ? "color: var(--success); font-weight: 700;"
          : "color: var(--danger); font-weight: 700;";
      const actionButton =
        activeTeacher && status === "Present"
          ? `<button class="delete-btn" type="button" onclick="deleteAttendanceRecord('${escapeHtml(student.uniqueRoll)}')">Delete</button>`
          : '<span class="table-note">Teacher only</span>';

      return `
            <tr>
                <td>${escapeHtml(student.roll)}</td>
                <td>${escapeHtml(student.name)}</td>
                <td>${escapeHtml(student.branch)}</td>
                <td>${escapeHtml(selectedSubject)}</td>
                <td style="${statusStyle}">${escapeHtml(status)}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    })
    .join("");
}

function exportAttendanceToGoogleSheet() {
  if (!activeTeacher) {
    alert("Teacher access is required to export attendance.");
    return;
  }

  if (!WEB_APP_URL.includes("script.google.com")) {
    alert("Set a valid Google Apps Script web app URL before exporting.");
    return;
  }

  const button = document.getElementById("exportToSheetBtn");
  if (!button) {
    return;
  }

  const payload = {
    dailyAttendanceRecords,
    studentsMasterList: students,
    teachersMasterList: teachers,
    branchConfigMap: BRANCH_CONFIG_MAP,
  };

  button.disabled = true;
  button.textContent = "Sending data...";

  fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.result === "success") {
        const updatedSheets =
          Object.keys(data.sheetsUpdated ?? {}).join(", ") ||
          "Configured sheets";
        alert(`Export successful. Updated: ${updatedSheets}.`);
        return;
      }

      alert(`Export failed: ${data.message || "Unknown error"}`);
      console.error("Apps Script error:", data.error);
    })
    .catch((error) => {
      console.error("Export failed:", error);
      alert(
        "Could not connect to Google Sheets. Check the console for details.",
      );
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = "Export All Attendance to Google Sheets";
    });
}

function renderBranchExportActions() {
  const container = document.getElementById("branchExportGrid");
  if (!container) {
    return;
  }

  const branches = Object.keys(BRANCH_CONFIG_MAP);
  container.innerHTML = branches
    .map(
      (branch) => `
        <article class="export-card">
          <p class="export-card-label">${escapeHtml(branch)}</p>
          <h3>${escapeHtml(branch)} Attendance</h3>
          <p class="section-copy">
            Export this branch separately in CSV or Excel without mixing it with other branches.
          </p>
          <div class="export-actions">
            <button type="button" class="secondary-btn" onclick="exportBranchAttendanceCsv('${escapeHtml(branch)}')">
              Export CSV
            </button>
            <button type="button" class="secondary-btn" onclick="exportBranchAttendanceExcel('${escapeHtml(branch)}')">
              Export Excel
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function initDashboardPage() {
  renderDashboardSessionState();
  renderBranchExportActions();
  populateRegisteredStudents();
  updateSubjectDropdown();
  displayAttendance();

  document
    .getElementById("registeredStudentSelect")
    ?.addEventListener("change", (event) => {
      if (event.target.value !== activeStudent?.uniqueRoll) {
        event.target.value = activeStudent?.uniqueRoll ?? "";
      }
      renderStudentQr(event.target.value);
    });

  document
    .getElementById("branchScan")
    ?.addEventListener("change", updateSubjectDropdown);
  document
    .getElementById("subjectScan")
    ?.addEventListener("change", displayAttendance);
  document
    .getElementById("exportToSheetBtn")
    ?.addEventListener("click", exportAttendanceToGoogleSheet);
  document.getElementById("downloadQrBtn")?.addEventListener("click", () => {
    if (typeof html2canvas === "undefined") {
      alert(
        "QR download library could not be loaded. Refresh the page after reconnecting to the internet.",
      );
      return;
    }

    const qrDisplayContainer = document.getElementById("qrDisplayContainer");
    if (
      !qrDisplayContainer ||
      qrDisplayContainer.classList.contains("hidden")
    ) {
      return;
    }

    html2canvas(qrDisplayContainer).then((canvas) => {
      const link = document.createElement("a");
      link.download = latestQrFileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });

  initScanner();
}

window.exportBranchAttendanceCsv = exportBranchAttendanceCsv;
window.exportBranchAttendanceExcel = exportBranchAttendanceExcel;

document.addEventListener("DOMContentLoaded", () => {
  syncActiveSessions();

  if (page === "home") {
    renderHomeSessionState();
    return;
  }

  if (page === "student-register") {
    initStudentRegisterPage();
    return;
  }

  if (page === "teacher-register") {
    initTeacherRegisterPage();
    return;
  }

  if (page === "teacher-dashboard") {
    initTeacherDashboardPage();
    return;
  }

  if (page === "student-dashboard") {
    initStudentDashboardPage();
    return;
  }

  initDashboardPage();
});
