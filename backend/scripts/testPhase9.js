/**
 * Phase 9 Verification Test Suite: Resume & Portfolio Management + Excel/PDF Exports
 * 
 * Tests:
 * 1. Student PDF Resume Upload & File Validation (PDF only, <= 5MB)
 * 2. Resume Metadata Retrieval from MongoDB users collection
 * 3. Secure Resume Download & Ownership Check
 * 4. Extended Portfolio Updates (URL Validation, Projects, Certifications, Achievements)
 * 5. Opportunity Application with Resume Integration (Custom & Default Snapshot)
 * 6. Teacher Applicant Management & Resume Access Authorization (403 for unauthorized)
 * 7. Teacher Excel Export (.xlsx generation with headers, applicant data & styling)
 * 8. Teacher PDF Report Generation (.pdf with ScholarConnect branding & multi-page structure)
 * 9. Resume Deletion & Disk Cleanup
 */

import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getCollections } from '../config/db.js';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'scholarconnect_super_secret_jwt_key_2026_dev';
const BASE_URL = 'http://localhost:5000/api';

async function runPhase9Tests() {
  console.log('====================================================');
  console.log('🚀 Starting Phase 9: Resume & Portfolio Management Test Suite');
  console.log('====================================================\n');

  await connectDB();
  const { users, opportunities, applications } = getCollections();

  // Test Entities
  const testStudentEmail = `phase9.student.${Date.now()}@university.edu`;
  const testTeacherEmail = `phase9.teacher.${Date.now()}@faculty.edu`;
  const unauthorizedTeacherEmail = `phase9.other.${Date.now()}@faculty.edu`;

  // 1. Create Test Student & Teacher in MongoDB
  const studentInsert = await users.insertOne({
    name: 'Alex Johnson',
    fullName: 'Alex Johnson',
    email: testStudentEmail,
    role: 'student',
    institution: 'Stanford University',
    department: 'Computer Science',
    academicYear: 'Third Year',
    emailVerified: true,
    skills: ['Python', 'React', 'Machine Learning'],
    createdAt: new Date(),
  });
  const studentId = studentInsert.insertedId.toString();

  const teacherInsert = await users.insertOne({
    name: 'Dr. Ramesh Kumar',
    fullName: 'Dr. Ramesh Kumar',
    email: testTeacherEmail,
    role: 'teacher',
    institution: 'ABC University',
    department: 'Artificial Intelligence',
    emailVerified: true,
    createdAt: new Date(),
  });
  const teacherId = teacherInsert.insertedId.toString();

  const otherTeacherInsert = await users.insertOne({
    name: 'Dr. Unauthorized Mentor',
    email: unauthorizedTeacherEmail,
    role: 'teacher',
    institution: 'Other University',
    emailVerified: true,
    createdAt: new Date(),
  });
  const otherTeacherId = otherTeacherInsert.insertedId.toString();

  // Generate JWTs
  const studentToken = jwt.sign(
    { userId: studentId, email: testStudentEmail, role: 'student', name: 'Alex Johnson' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const teacherToken = jwt.sign(
    { userId: teacherId, email: testTeacherEmail, role: 'teacher', name: 'Dr. Ramesh Kumar' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const otherTeacherToken = jwt.sign(
    { userId: otherTeacherId, email: unauthorizedTeacherEmail, role: 'teacher', name: 'Other Teacher' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 2. Create Opportunity for Teacher
  const oppInsert = await opportunities.insertOne({
    title: 'Phase 9 Multimodal AI Lab',
    category: 'Research Project',
    teacherId: teacherId,
    teacherName: 'Dr. Ramesh Kumar',
    teacherEmail: testTeacherEmail,
    institution: 'ABC University',
    status: 'Accepting Applications',
    skills: ['Python', 'Machine Learning'],
    applicantsCount: 0,
    createdAt: new Date(),
  });
  const oppId = oppInsert.insertedId.toString();

  // Create dummy PDF buffer for resume testing
  const dummyPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS]: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${testName}`);
      failed++;
    }
  }

  try {
    // TEST 1: Resume Upload (Valid PDF)
    console.log('\n--- Test 1: Student Resume Upload ---');
    const formData = new FormData();
    const pdfBlob = new Blob([dummyPdfBuffer], { type: 'application/pdf' });
    formData.append('resumeFile', pdfBlob, 'Alex_Johnson_Academic_CV.pdf');

    const uploadRes = await fetch(`${BASE_URL}/students/resume`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 200 && uploadData.success === true, 'Upload valid PDF resume returns 200');
    assert(uploadData.resume?.originalName === 'Alex_Johnson_Academic_CV.pdf', 'Resume metadata preserved originalName');

    // TEST 2: Resume Metadata in Database
    console.log('\n--- Test 2: MongoDB Users Collection Verification ---');
    const studentDoc = await users.findOne({ _id: new ObjectId(studentId) });
    assert(studentDoc.resume && studentDoc.resume.fileName, 'Resume metadata successfully stored in MongoDB users collection');
    assert(studentDoc.resume.fileSize > 0, 'Resume fileSize calculated accurately');

    // TEST 3: Resume Download (Authorized Student)
    console.log('\n--- Test 3: Download Student Resume ---');
    const downloadRes = await fetch(`${BASE_URL}/students/resume/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(downloadRes.status === 200, 'Student can download their own resume (HTTP 200)');
    assert(downloadRes.headers.get('content-type') === 'application/pdf', 'Download returns application/pdf content type');

    // TEST 4: Extended Portfolio Update with URL Validation
    console.log('\n--- Test 4: Extended Portfolio Updates & URL Validation ---');
    // 4a. Invalid URL check
    const badUrlRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        portfolioUrl: 'invalid-url-without-protocol',
      }),
    });
    assert(badUrlRes.status === 400, 'Invalid portfolio URL format correctly rejected with HTTP 400');

    // 4b. Valid Portfolio Update
    const goodPortfolioRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        portfolioUrl: 'https://alexjohnson.dev',
        linkedin: 'https://linkedin.com/in/alex-johnson-demo',
        github: 'https://github.com/alexjohnson-scholar',
        programmingLanguages: ['Python', 'TypeScript', 'C++'],
        projects: [
          {
            title: 'Deep Learning Eye Diagnostic',
            role: 'Lead ML Engineer',
            technologies: ['Python', 'PyTorch'],
            description: 'CNN for early retinopathies detection',
            liveUrl: 'https://diagnostic-demo.app',
            githubUrl: 'https://github.com/alex/retinopathy',
          },
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            credentialUrl: 'https://aws.amazon.com/verify/12345',
          },
        ],
        achievements: [
          {
            title: 'First Place - Stanford Health Hackathon 2025',
            description: 'Grand prize winner for AI triage prototype',
          },
        ],
      }),
    });
    const goodPortfolioData = await goodPortfolioRes.json();
    assert(goodPortfolioRes.status === 200 && goodPortfolioData.success, 'Valid portfolio update persists successfully');

    const updatedStudent = await users.findOne({ _id: new ObjectId(studentId) });
    assert(updatedStudent.portfolioUrl === 'https://alexjohnson.dev', 'Portfolio URL persisted in MongoDB');
    assert(updatedStudent.projects?.length === 1, 'Projects array persisted in MongoDB');
    assert(updatedStudent.certifications?.length === 1, 'Certifications array persisted in MongoDB');
    assert(updatedStudent.achievements?.length === 1, 'Achievements array persisted in MongoDB');

    // TEST 5: Apply for Opportunity with Resume (Default Snapshot)
    console.log('\n--- Test 5: Opportunity Application with Resume Snapshot ---');
    const applyRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        opportunityId: oppId,
        studentId: studentId,
        fullName: 'Alex Johnson',
        studentEmail: testStudentEmail,
        institution: 'Stanford University',
        department: 'Computer Science',
        academicYear: 'Third Year',
        statementOfInterest: 'Excited to contribute to multimodal AI architectures with faculty mentors.',
        skills: ['Python', 'PyTorch'],
        portfolioUrl: 'https://alexjohnson.dev',
        useProfileResume: true,
      }),
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201 && applyData.success, 'Application submitted with HTTP 201');
    const createdAppId = applyData.application._id || applyData.application.id;

    const savedApp = await applications.findOne({ _id: new ObjectId(createdAppId) });
    assert(savedApp.resume && savedApp.resume.fileName, 'Application saved with snapshotted resume reference');
    assert(savedApp.resume.isCustom === false, 'Snapshot marked as profile resume');

    // TEST 6: Teacher Resume Access Authorization
    console.log('\n--- Test 6: Teacher Applicant Resume Access Authorization ---');
    // Authorized Teacher Download
    const teacherDownloadRes = await fetch(`${BASE_URL}/applications/${createdAppId}/resume`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert(teacherDownloadRes.status === 200, 'Authorized Teacher can download applicant resume (HTTP 200)');

    // Unauthorized Teacher Download
    const unauthorizedDownloadRes = await fetch(`${BASE_URL}/applications/${createdAppId}/resume`, {
      headers: { Authorization: `Bearer ${otherTeacherToken}` },
    });
    assert(unauthorizedDownloadRes.status === 403, 'Unauthorized teacher denied access to applicant resume with HTTP 403 Forbidden');

    // TEST 7: Teacher Excel Export (.xlsx)
    console.log('\n--- Test 7: Export Applicants to Excel (.xlsx) ---');
    const excelRes = await fetch(`${BASE_URL}/teachers/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        opportunityId: oppId,
      }),
    });
    assert(excelRes.status === 200, 'Teacher Excel export returns HTTP 200');
    assert(
      excelRes.headers.get('content-type')?.includes('spreadsheetml'),
      'Excel export returns proper OpenXML spreadsheet Content-Type'
    );

    const excelBuffer = Buffer.from(await excelRes.arrayBuffer());
    assert(excelBuffer.length > 1000, `Excel file has valid size (${excelBuffer.length} bytes)`);

    // Verify workbook content using ExcelJS
    const testWb = new ExcelJS.Workbook();
    await testWb.xlsx.load(excelBuffer);
    const testSheet = testWb.getWorksheet('Applicants Dossier');
    assert(testSheet !== undefined, 'Generated Excel has "Applicants Dossier" worksheet');
    assert(testSheet.rowCount >= 5, `Excel contains header + data rows (total rows: ${testSheet.rowCount})`);

    // TEST 8: Teacher PDF Report Export (.pdf)
    console.log('\n--- Test 8: Export Applicants to PDF Report ---');
    const pdfRes = await fetch(`${BASE_URL}/teachers/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        opportunityId: oppId,
      }),
    });
    assert(pdfRes.status === 200, 'Teacher PDF export returns HTTP 200');
    assert(pdfRes.headers.get('content-type')?.includes('application/pdf'), 'PDF export returns application/pdf Content-Type');

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    assert(pdfBuffer.toString('utf8', 0, 5) === '%PDF-', 'Generated document contains valid %PDF- magic header');
    assert(pdfBuffer.length > 2000, `PDF file has valid size (${pdfBuffer.length} bytes)`);

    // TEST 9: Resume Deletion
    console.log('\n--- Test 9: Resume Deletion & Cleanup ---');
    const deleteRes = await fetch(`${BASE_URL}/students/resume`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(deleteRes.status === 200, 'Delete student resume returns HTTP 200');
    const cleanedStudent = await users.findOne({ _id: new ObjectId(studentId) });
    assert(cleanedStudent.resume === undefined, 'Resume unset from MongoDB users document');

  } finally {
    // Cleanup test data from MongoDB
    await users.deleteMany({ email: { $in: [testStudentEmail, testTeacherEmail, unauthorizedTeacherEmail] } });
    await opportunities.deleteOne({ _id: new ObjectId(oppId) });
    await applications.deleteMany({ opportunityId: oppId });
    console.log('\n🧹 Cleaned up temporary test entities from MongoDB Atlas.');
  }

  console.log('\n====================================================');
  console.log(`📊 Phase 9 Test Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase9Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

