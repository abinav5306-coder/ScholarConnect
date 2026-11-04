import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScholarProvider } from './context/ScholarContext';

// Existing Auth & Gateway Pages (Preserved)
import LoginPortalPage from './pages/LoginPortalPage';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPortalPage from './pages/RegisterPortalPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';

// Phase 3: Student Portal Pages
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentExplorePage from './pages/student/StudentExplorePage';
import StudentApplicationsPage from './pages/student/StudentApplicationsPage';
import StudentSavedPage from './pages/student/StudentSavedPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentMessagesPage from './pages/student/StudentMessagesPage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';
import StudentPortfolioPage from './pages/student/StudentPortfolioPage';

// Phase 3: Teacher / Faculty Portal Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import TeacherOpportunitiesPage from './pages/teacher/TeacherOpportunitiesPage';
import TeacherCreateOpportunityPage from './pages/teacher/TeacherCreateOpportunityPage';
import TeacherApplicantsPage from './pages/teacher/TeacherApplicantsPage';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage';
import TeacherMessagesPage from './pages/teacher/TeacherMessagesPage';
import TeacherNotificationsPage from './pages/teacher/TeacherNotificationsPage';
import TeacherSettingsPage from './pages/teacher/TeacherSettingsPage';

// Phase 6: Admin Identity Verification Console
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminVerificationDashboard from './pages/admin/AdminVerificationDashboard';

export default function App() {
  return (
    <ScholarProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Portal Selection */}
          <Route path="/login" element={<LoginPortalPage />} />
          
          {/* Student Portal Login */}
          <Route path="/login/student" element={<StudentLoginPage />} />
          
          {/* Teacher / Researcher Portal Login */}
          <Route path="/login/teacher" element={<TeacherLoginPage />} />

          {/* Registration Role Selection */}
          <Route path="/register" element={<RegisterPortalPage />} />

          {/* Student Registration */}
          <Route path="/register/student" element={<StudentRegisterPage />} />

          {/* Teacher / Researcher Registration */}
          <Route path="/register/teacher" element={<TeacherRegisterPage />} />

          {/* =================================================== */}
          {/* Student Dashboard & Portal Routes                   */}
          {/* =================================================== */}
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/explore" element={<StudentExplorePage />} />
          <Route path="/student/applications" element={<StudentApplicationsPage />} />
          <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
          <Route path="/student/saved" element={<StudentSavedPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/messages" element={<StudentMessagesPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/student/settings" element={<StudentSettingsPage />} />

          {/* =================================================== */}
          {/* Teacher / Faculty Portal Routes                     */}
          {/* =================================================== */}
          <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
          <Route path="/teacher/my-opportunities" element={<TeacherOpportunitiesPage />} />
          <Route path="/teacher/create-opportunity" element={<TeacherCreateOpportunityPage />} />
          <Route path="/teacher/applicants" element={<TeacherApplicantsPage />} />
          <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          <Route path="/teacher/messages" element={<TeacherMessagesPage />} />
          <Route path="/teacher/notifications" element={<TeacherNotificationsPage />} />
          <Route path="/teacher/settings" element={<TeacherSettingsPage />} />

          {/* =================================================== */}
          {/* Phase 6: Academic Identity Audit & Admin Console    */}
          {/* =================================================== */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/verifications" element={<AdminVerificationDashboard />} />
          <Route path="/admin" element={<Navigate to="/admin/verifications" replace />} />
          
          {/* Default route redirect to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all redirect to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ScholarProvider>
  );
}
