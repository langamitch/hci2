// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAsk52yuXsZ4qsUqCNZlGK-FRseZLxiGP4",
  authDomain: "api-call-4957b.firebaseapp.com",
  projectId: "api-call-4957b",
  storageBucket: "api-call-4957b.appspot.com", // ✅ Corrected
  messagingSenderId: "1799792142",
  appId: "1:1799792142:web:bb5e944f1406594571fe5f",
};

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  addDoc,
  collection,
  onSnapshot,
  query,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Wait for DOM content to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  let app, db, auth, userId;
  let currentPin = null;
  let pinExpirationTimer = null;
  let qrCodeInstance = null;

  // --- DOM References ---
  
  const createBtn = document.getElementById("create-btn");
  const submitBtn = document.getElementById("submit-btn");
  const generateQrBtn = document.getElementById("generate-qr-btn");
  const qrDisplayArea = document.getElementById("qr-display-area");
  const qrcodeContainer = document.getElementById("qrcode");
  const pinDisplay = document.getElementById("pin-display");
  const timerDisplay = document.getElementById("timer-display");
  const submitAttendanceBtn = document.getElementById("submit-attendance-btn");
  const pinInput = document.getElementById("pin-input");
  const switchInputBtn = document.getElementById("switch-input-btn");
  const pinInputArea = document.getElementById("pin-input-area");
  const qrScanArea = document.getElementById("qr-scan-area");
  const submissionsTableBody = document.querySelector(
    "#submissions-table tbody"
  );
  const datePicker = document.getElementById("date-picker");
  const viewPrevBtn = document.getElementById("view-prev-btn");
  const studentNameInput = document.getElementById("student-name");
  const studentNumberInput = document.getElementById("student-number");

  // --- Overlays ---
  window.openOverlay = (id) =>
    (document.getElementById(id).style.display = "flex");
  window.closeOverlay = (id) =>
    (document.getElementById(id).style.display = "none");

  // --- Firebase Init ---
  async function initializeFirebase() {
    if (!Object.keys(firebaseConfig).length) {
      console.error("Missing Firebase config");
      return;
    }

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
      if (user) {
        userId = user.uid;
        console.log("Authenticated:", userId);
        listenForSubmissions();
      } else {
        console.log("User is not signed in.");
      }
    });

    try {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }

  // Self-executing init block
  (async () => {
    await initializeFirebase();
  })();

  // --- Event Listeners ---
  createBtn.addEventListener("click", () => openOverlay("create-overlay"));
  submitBtn.addEventListener("click", () => openOverlay("submit-overlay"));
  generateQrBtn.addEventListener("click", generateNewSession);
  submitAttendanceBtn.addEventListener("click", handleSubmission);
  switchInputBtn.addEventListener("click", toggleInputMethod);
  viewPrevBtn.addEventListener("click", viewPreviousSubmissions);

  // ✅ Added all input field listeners
  studentNameInput.addEventListener("input", validateSubmission);
  studentNumberInput.addEventListener("input", validateSubmission);
  pinInput.addEventListener("input", validateSubmission);

  // --- Random pin generator api and qr code api ---
  function generateNewSession() {
    currentPin = Math.floor(100000 + Math.random() * 900000).toString();
    pinDisplay.textContent = `PIN: ${currentPin}`;

    if (qrCodeInstance) {
      qrCodeInstance.clear();
      qrCodeInstance.makeCode(currentPin);
    } else {
      qrCodeInstance = new QRCode(qrcodeContainer, {
        text: currentPin,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }

    qrDisplayArea.style.display = "block";
    console.log("Generated PIN:", currentPin);
  }

  window.setTimer = (minutes) => {
    if (!currentPin) {
      alert("Generate a PIN first.");
      return;
    }

    if (pinExpirationTimer) clearInterval(pinExpirationTimer);

    let seconds = minutes * 60;
    pinExpirationTimer = setInterval(() => {
      seconds--;
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      timerDisplay.textContent = `Expires in: ${min}:${
        sec < 10 ? "0" : ""
      }${sec}`;

      if (seconds <= 0) {
        clearInterval(pinExpirationTimer);
        timerDisplay.textContent = "Expired!";
        currentPin = null;
        pinDisplay.textContent = "PIN EXPIRED";
      }
    }, 1000);
  };

  function validateSubmission() {
    const name = studentNameInput.value.trim();
    const number = studentNumberInput.value.trim();
    const pin = pinInput.value.trim();

    if (name && number && currentPin && pin === currentPin) {
      submitAttendanceBtn.disabled = false;
    } else {
      submitAttendanceBtn.disabled = true;
    }
  }

  async function handleSubmission() {
    console.log("Submit button clicked");

    const name = studentNameInput.value.trim();
    const studentNumber = studentNumberInput.value.trim();

    if (!name || !studentNumber) {
      alert("Please enter name and student number.");
      return;
    }

    submitAttendanceBtn.disabled = true;
    submitAttendanceBtn.textContent = "Submitting...";

    try {
      const today = new Date().toISOString().slice(0, 10);
      const submissionData = {
        name,
        studentNumber,
        timestamp: serverTimestamp(),
        date: today,
      };

      const docRef = await addDoc(
        collection(db, `attendance/${today}/submissions`),
        submissionData
      );
      console.log("Submitted successfully:", docRef.id);

      alert("Attendance submitted!");
      closeOverlay("submit-overlay");

      // Clear form
      studentNameInput.value = "";
      studentNumberInput.value = "";
      pinInput.value = "";
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit. Try again.");
    } finally {
      submitAttendanceBtn.disabled = false;
      submitAttendanceBtn.textContent = "Submit";
    }
  }

  function toggleInputMethod() {
    const isPinVisible = pinInputArea.style.display !== "none";
    pinInputArea.style.display = isPinVisible ? "none" : "block";
    qrScanArea.style.display = isPinVisible ? "block" : "none";
    switchInputBtn.textContent = isPinVisible
      ? "Switch to Enter PIN"
      : "Switch to Scan QR";
  }

  function listenForSubmissions() {
    const today = new Date().toISOString().slice(0, 10);
    const q = query(collection(db, `attendance/${today}/submissions`));

    onSnapshot(q, (snapshot) => {
      submissionsTableBody.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const row = submissionsTableBody.insertRow();
        row.innerHTML = `
                    <td>${data.name}</td>
                    <td>${data.studentNumber}</td>
                    <td>${
                      data.timestamp
                        ? new Date(data.timestamp.toDate()).toLocaleString()
                        : "N/A"
                    }</td>
                    <td><i class="fas fa-check-circle" style="color: green;"></i> Confirmed</td>
                `;
      });
    });
  }

  async function viewPreviousSubmissions() {
    const selectedDate = datePicker.value;
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    submissionsTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    const q = query(collection(db, `attendance/${selectedDate}/submissions`));
    const snapshot = await getDocs(q);

    submissionsTableBody.innerHTML = "";
    if (snapshot.empty) {
      submissionsTableBody.innerHTML =
        '<tr><td colspan="4">No submissions found.</td></tr>';
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const row = submissionsTableBody.insertRow();
      row.innerHTML = `
                <td>${data.name}</td>
                <td>${data.studentNumber}</td>
                <td>${
                  data.timestamp
                    ? new Date(data.timestamp.toDate()).toLocaleString()
                    : "N/A"
                }</td>
                <td><i class="fas fa-check-circle" style="color: green;"></i> Confirmed</td>
            `;
    });
  }
});
