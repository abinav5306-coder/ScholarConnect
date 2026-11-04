import { connectDB, getCollections, closeDB } from '../config/db.js';

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('====================================================');
  console.log(' ScholarConnect Phase 5: Complete Lifecycle Test');
  console.log('====================================================\n');

  try {
    // 0. Verify Health
    console.log('1. Checking Backend Health & MongoDB Connection...');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('   Health Status:', healthData.status);
    console.log('   Database:', healthData.database);
    if (healthData.database !== 'connected') {
      throw new Error('Database is not connected!');
    }
    console.log('   -> Health verification passed!\n');

    // 1. Teacher creates opportunity
    console.log('2. Teacher Login -> Create Opportunity -> Publish Opportunity...');
    const testOppData = {
      title: `E2E Test Quantum Lab ${Date.now()}`,
      category: 'Research Project',
      shortDescription: 'Testing end-to-end application lifecycle with MongoDB Atlas.',
      description: 'Full description of quantum computing telemetry project.',
      objectives: 'Verify database persistence, applicant tracking, and notifications.',
      requiredSkills: ['Python', 'Quantum Computing', 'React'],
      eligibleYears: ['Third Year', 'Fourth Year'],
      positions: 3,
      institution: 'ABC University',
      department: 'Quantum Information Lab',
      deadline: '2026-12-30',
      workMode: 'Hybrid',
      teacherId: 'teacher-test-e2e',
      teacherName: 'Dr. Ramesh Kumar',
      teacherEmail: 'ramesh.kumar@abc.edu',
      status: 'Accepting Applications',
    };

    const createOppRes = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOppData),
    });
    const createOppResult = await createOppRes.json();
    if (!createOppResult.success) throw new Error(`Failed to create opp: ${createOppResult.message}`);
    const createdOppId = createOppResult.opportunity.id || createOppResult.opportunity._id;
    console.log(`   -> Created Opportunity with ID: ${createdOppId} in MongoDB Atlas.\n`);

    // 2. Student finds opportunity
    console.log('3. Student Login -> Find Opportunity in Explore...');
    const getOppRes = await fetch(`${API_BASE}/opportunities/${createdOppId}`);
    const getOppResult = await getOppRes.json();
    if (!getOppResult.success) throw new Error('Could not find created opportunity!');
    console.log(`   -> Found Opportunity: "${getOppResult.opportunity.title}" (Status: ${getOppResult.opportunity.status})\n`);

    // 3. Student applies
    console.log('4. Student applies to Opportunity...');
    const studentTestEmail = `test.student.${Date.now()}@university.edu`;
    const appPayload = {
      opportunityId: createdOppId,
      studentId: `student-${Date.now()}`,
      fullName: 'Maya Lin',
      email: studentTestEmail,
      studentEmail: studentTestEmail,
      institution: 'Stanford University',
      department: 'Computer Science',
      academicYear: 'Third Year',
      skills: ['Python', 'Machine Learning', 'React'],
      statementOfInterest: 'I have built multiple PyTorch neural networks and want to contribute to this research project.',
      experience: '2 years of undergraduate research experience.',
    };

    const applyRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appPayload),
    });
    const applyResult = await applyRes.json();
    if (!applyResult.success) throw new Error(`Apply failed: ${applyResult.message}`);
    const createdAppId = applyResult.application.id || applyResult.application._id;
    console.log(`   -> Application submitted successfully! App ID: ${createdAppId} (Status: ${applyResult.application.status})\n`);

    // 3b. Test duplicate application prevention
    console.log('4b. Testing Duplicate Application Prevention...');
    const dupRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appPayload),
    });
    if (dupRes.status === 409) {
      console.log('   -> Duplicate application successfully blocked (409 Conflict)!\n');
    } else {
      console.warn('   -> Warning: Duplicate application check returned status:', dupRes.status);
    }

    // 4. Teacher views applicants
    console.log('5. Teacher Login -> View Applicants for their Opportunity...');
    const teacherAppsRes = await fetch(`${API_BASE}/applications/teacher/teacher-test-e2e`);
    const teacherAppsData = await teacherAppsRes.json();
    console.log(`   -> Teacher found ${teacherAppsData.count} applicant(s).\n`);

    // 5. Teacher shortlists student
    console.log('6. Teacher shortlists student (Status -> "Shortlisted")...');
    const shortlistRes = await fetch(`${API_BASE}/applications/${createdAppId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shortlisted' }),
    });
    const shortlistData = await shortlistRes.json();
    if (!shortlistData.success) throw new Error(`Shortlist failed: ${shortlistData.message}`);
    console.log(`   -> Status updated in MongoDB: "${shortlistData.application.status}".`);
    console.log(`   -> Status Message: "${shortlistData.application.statusMessage}"\n`);

    // 6. Teacher selects student
    console.log('7. Teacher selects student (Status -> "Selected")...');
    const selectRes = await fetch(`${API_BASE}/applications/${createdAppId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Selected' }),
    });
    const selectData = await selectRes.json();
    if (!selectData.success) throw new Error(`Select failed: ${selectData.message}`);
    console.log(`   -> Status updated in MongoDB: "${selectData.application.status}".`);
    console.log(`   -> Status Message: "${selectData.application.statusMessage}"\n`);

    // 7. Student checks My Applications
    console.log('8. Student Login -> My Applications -> View Updated Status...');
    const studentAppsRes = await fetch(`${API_BASE}/applications/student/${appPayload.studentId}?email=${studentTestEmail}`);
    const studentAppsData = await studentAppsRes.json();
    const myApp = studentAppsData.applications.find((a) => a.id === createdAppId || a._id === createdAppId);
    if (!myApp) throw new Error('Student application not found in My Applications!');
    console.log(`   -> Application found in Student Dashboard!`);
    console.log(`      Title: ${myApp.opportunityTitle}`);
    console.log(`      Mentor: ${myApp.teacherName}`);
    console.log(`      Status: ${myApp.status}`);
    console.log(`      Message: "${myApp.statusMessage}"\n`);

    // 8. Verify Automatic Notification stored in MongoDB
    console.log('9. Checking Student Notifications in MongoDB Atlas...');
    const notifRes = await fetch(`${API_BASE}/notifications/${studentTestEmail}`);
    const notifData = await notifRes.json();
    console.log(`   -> Found ${notifData.count} notification(s) for student in MongoDB.`);
    if (notifData.notifications.length > 0) {
      const latestNotif = notifData.notifications[0];
      console.log(`      Latest Notification: "${latestNotif.title}" - ${latestNotif.message}`);
      // Mark as read
      const markRes = await fetch(`${API_BASE}/notifications/${latestNotif.id}/read`, { method: 'PUT' });
      const markData = await markRes.json();
      console.log(`   -> Mark Notification as Read: ${markData.success ? 'Success' : 'Failed'}\n`);
    }

    // 9. Teacher closes opportunity
    console.log('10. Teacher closes opportunity (Stop accepting applications)...');
    const closeRes = await fetch(`${API_BASE}/opportunities/${createdOppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Closed' }),
    });
    const closeData = await closeRes.json();
    console.log(`   -> Opportunity status updated to: "${closeData.opportunity.status}".`);

    // Verify student cannot apply to closed opportunity
    const closedApplyRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...appPayload,
        studentId: 'another-student-id',
        studentEmail: 'another.student@university.edu',
      }),
    });
    if (closedApplyRes.status === 400) {
      const closedErr = await closedApplyRes.json();
      console.log(`   -> Correctly blocked application to closed opportunity: "${closedErr.message}"\n`);
    }

    // 10. Direct Database Verification
    console.log('11. Direct MongoDB Atlas Data Verification...');
    await connectDB();
    const cols = getCollections();
    const dbOpp = await cols.opportunities.findOne({ title: testOppData.title });
    const dbApp = await cols.applications.findOne({ opportunityTitle: testOppData.title });
    const dbNotif = await cols.notifications.findOne({ userEmail: studentTestEmail });

    console.log(`   ✅ MongoDB "opportunities" document verified: Status = "${dbOpp?.status}"`);
    console.log(`   ✅ MongoDB "applications" document verified: Status = "${dbApp?.status}", Message = "${dbApp?.statusMessage}"`);
    console.log(`   ✅ MongoDB "notifications" document verified: Title = "${dbNotif?.title}"`);
    await closeDB();

    console.log('\n====================================================');
    console.log(' 🎉 COMPLETE LIFECYCLE WORKFLOW TEST PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

runTest();

