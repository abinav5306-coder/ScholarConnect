# ScholarConnect – Student–Researcher Collaboration Platform

ScholarConnect is a full-stack academic networking and research discovery platform that connects undergraduate and postgraduate students with faculty researchers, institutional projects, funded research assistantships, hackathons, and corporate internships.

---

## 🌟 Key Features

* **Role-Based Portals**:
  * **Student Portal**: Explore opportunities, apply with tailored/profile resumes, track application lifecycle statuses, manage academic portfolio, direct real-time chat with faculty mentors.
  * **Teacher / Faculty Portal**: Create and manage opportunities, review applicants, evaluate full student dossiers, bulk status updates, export applicant reports to Excel (`.xlsx`) and PDF.
  * **Admin Identity Portal**: Review submitted student & faculty institutional credentials, student ID cards, verify/reject with audit logs and email notifications.

* **Academic Identity & Email OTP Verification**:
  * 6-digit secure email OTP during registration/login powered by Nodemailer.
  * Academic identity verification with institutional documents upload (student ID / faculty appointment letter).
  * Verified Scholar badge display across profiles.

* **Real-Time Communication**:
  * Instant Socket.IO messaging between students and faculty mentors tied to specific opportunities and applications.
  * Unread badge indicators, auto-scroll, online presence.

* **Resume & Portfolio Management**:
  * PDF resume uploads (up to 5MB) with private backend storage.
  * Application-level resume snapshotting preserving submitted versions.
  * Showcased projects with live demos and repository links, certifications, and academic honors.

* **Applicant Dossier & Exports**:
  * Multi-attribute filtering (Status, Department, Academic Year, Skills, Opportunity).
  * High-fidelity Excel spreadsheet generation (`exceljs`) with formatted headers.
  * Professional multi-page PDF applicant dossier reports (`pdfkit`).

* **Automated Email Notifications**:
  * Dispatched for new applications, status updates, new opportunity announcements to matching students, and verification decisions.
  * User-configurable notification preference toggles.

---

## 🛠️ Technology Stack

* **Frontend**:
  * React.js (v19)
  * Vite
  * Tailwind CSS
  * React Router DOM (v7)
  * Lucide React Icons
  * Socket.IO Client

* **Backend**:
  * Node.js & Express.js
  * MongoDB Atlas (Official MongoDB Node.js Driver - MongoClient)
  * Socket.IO Server
  * Nodemailer (Configurable SMTP / Gmail App Password)
  * Multer (Private multipart document & resume handling)
  * ExcelJS & PDFKit (Export generation)
  * JWT & BCrypt (Authentication & Password hashing)

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* MongoDB Atlas account & cluster URI
* Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abinav5306-coder/ScholarConnect.git
   cd ScholarConnect
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**:
   Create a `backend/.env` file based on `backend/.env.example`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   DB_NAME=scholarconnect
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173

   # SMTP Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_digit_app_password
   SMTP_SECURE=false
   EMAIL_FROM="ScholarConnect" <your_email@gmail.com>
   ```

5. **Start the Development Servers**:
   * **Backend**:
     ```bash
     node backend/server.js
     ```
     Backend runs on `http://localhost:5000`
   * **Frontend**:
     ```bash
     npm run dev
     ```
     Frontend runs on `http://localhost:5173`

---

## 📂 Project Structure

```
ScholarConnect/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas MongoClient connection & indexes
│   ├── controllers/
│   │   ├── applicationController.js
│   │   ├── authController.js
│   │   ├── exportController.js   # ExcelJS & PDFKit report generators
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   ├── opportunityController.js
│   │   ├── resumeController.js   # Secure PDF resume streaming & management
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   └── verificationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── resumeUpload.js
│   ├── routes/
│   ├── services/
│   │   ├── emailService.js
│   │   ├── notificationEmailService.js
│   │   └── socketService.js
│   ├── templates/emails/
│   ├── uploads/                  # Private secure uploaded files
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── src/
│   ├── components/
│   ├── context/
│   │   └── ScholarContext.jsx
│   ├── layouts/
│   ├── pages/
│   │   ├── admin/
│   │   ├── student/
│   │   └── teacher/
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

---

## 🌐 Deploying to Vercel

ScholarConnect is pre-configured for full-stack deployment on [Vercel](https://vercel.com) using **Vercel Serverless Functions** and **Vite SPA rewrites**.

### 1. Import Project to Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select and import your GitHub repository: `abinav5306-coder/ScholarConnect`.
3. Framework Preset: **Vite** (Root Directory: `./`, Build Command: `npm run build`, Output Directory: `dist`).

### 2. Configure Environment Variables
In **Project Settings -> Environment Variables**, add the following:

| Variable Name | Example / Recommended Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | MongoDB Atlas Connection String |
| `DB_NAME` | `scholarconnect` | MongoDB Database Name |
| `JWT_SECRET` | `scholarconnect_super_secret_jwt_key_2026_dev` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | JWT expiration duration |
| `CLIENT_URL` | `https://your-project-name.vercel.app` | Production deployment URL |
| `SMTP_HOST` | `smtp.gmail.com` | Nodemailer SMTP Host |
| `SMTP_PORT` | `587` | Nodemailer SMTP Port |
| `SMTP_USER` | `your-email@gmail.com` | Nodemailer SMTP Username |
| `SMTP_PASS` | `your-app-password` | Gmail App Password (16 chars) |
| `SMTP_SECURE` | `false` | TLS security flag |
| `EMAIL_FROM` | `"ScholarConnect" <your-email@gmail.com>` | Outgoing email header |

### 3. Deploy
Click **Deploy**. Vercel will install workspace dependencies, build the React frontend, and deploy the serverless REST API endpoints automatically!

## 📜 License

This project is licensed under the MIT License.
