# QR Attendance System

A simple browser-based attendance project with separate registration pages for students and teachers, plus a dedicated QR tools page for QR download and attendance scanning.

## Pages

- `index.html`  
  Landing page where the user chooses Student Register, Teacher Register, or QR Tools.

- `student-register.html`  
  Student registration form. Saves student data in `localStorage`.

- `teacher-register.html`  
  Teacher registration form. Saves teacher data in `localStorage`.

- `attendance.html`  
  QR code generation, QR download, attendance scanning, attendance table, and Google Sheets export.

## Files

- `script1.js`  
  Main logic for registration, QR generation, QR scanning, attendance handling, and export.

- `style.css`  
  Shared styling for all pages.

## How It Works

1. Open `index.html`.
2. Choose `Student Register` or `Teacher Register`.
3. Register users.
4. Open `attendance.html`.
5. Select a registered student to generate and download a QR code.
6. Select branch and subject, then scan the QR code to mark attendance.
7. Export attendance to Google Sheets if configured.

## Data Storage

This project currently uses browser `localStorage` for:

- Student records
- Teacher records
- Daily attendance records

That means data is stored in the current browser on the current device.

## Google Sheets Export

The export uses the `WEB_APP_URL` inside `script1.js`.

Update this value if needed:

```js
const WEB_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

The branch-to-subject and spreadsheet mapping is also defined in `script1.js` inside `BRANCH_CONFIG_MAP`.

## Notes

- QR scanning requires browser camera permission.
- Internet is required for the CDN libraries used by the project.
- Google Sheets export works only if the Apps Script web app is deployed correctly.
- Some branch spreadsheet IDs in `script1.js` are still placeholders and should be replaced.

## Current Flow

- Home page: choose the action
- Student page: register students
- Teacher page: register teachers
- QR Tools page: download QR and scan attendance
