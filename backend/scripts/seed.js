import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, getCollections, closeDB } from '../config/db.js';

dotenv.config();

async function runSeed() {
  console.log('--- Starting ScholarConnect Database Seeder ---');

  try {
    await connectDB();
    const { users, opportunities, applications, notifications, messages } = getCollections();

    // 0. Seed Demo Administrator User
    const adminEmail = 'admin@scholarconnect.edu';
    let adminUser = await users.findOne({ email: adminEmail });
    if (!adminUser) {
      const adminPasswordHash = await bcrypt.hash('adminpassword123', 10);
      const adminDoc = {
        name: 'ScholarConnect Verification Officer',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        institution: 'ScholarConnect Central Authority',
        department: 'Academic Verification Board',
        emailVerified: true,
        verificationStatus: 'Verified',
        createdAt: new Date(),
      };
      await users.insertOne(adminDoc);
      console.log(' Created administrative verification officer:', adminEmail);
    } else {
      console.log(' Administrator already exists:', adminEmail);
    }

    // 1. Seed Demo Teacher User
    const teacherEmail = 'ramesh.kumar@abc.edu';
    let teacherUser = await users.findOne({ email: teacherEmail });
    const teacherPasswordHash = await bcrypt.hash('teacher123', 10);

    if (!teacherUser) {
      const teacherDoc = {
        name: 'Dr. Ramesh Kumar',
        email: teacherEmail,
        passwordHash: teacherPasswordHash,
        role: 'teacher',
        emailVerified: true,
        verificationStatus: 'Verified',
        title: 'Associate Professor & Principal Investigator',
        institution: 'ABC University',
        department: 'School of Artificial Intelligence',
        labName: 'Biomedical AI & Machine Learning Research Group',
        officeLocation: 'Turing Hall, Room 412',
        bio: 'Principal investigator leading cross-institutional research in biomedical predictive systems, computer vision diagnostics, and wearable sensor analytics.',
        researchInterests: [
          'Biomedical Imaging',
          'Computer Vision',
          'Deep Learning',
          'Predictive Healthcare',
          'Wearable Sensor Telemetry',
        ],
        publications: [
          {
            title: 'Early Cardiac Anomaly Detection via Multi-Modal ECG Representation Learning',
            journal: 'IEEE Transactions on Biomedical Engineering',
            year: 2025,
          },
          {
            title: 'Federated Learning across Heterogeneous Clinical Hospitals',
            journal: 'ACM Health Computing',
            year: 2024,
          },
        ],
        linkedin: 'https://linkedin.com/in/dr-ramesh-kumar-scholar',
        googleScholar: 'https://scholar.google.com/citations?user=ramesh-kumar',
        website: 'https://cs.abc.edu/faculty/ramesh-kumar',
        createdAt: new Date(),
      };
      const res = await users.insertOne(teacherDoc);
      teacherUser = { _id: res.insertedId, ...teacherDoc };
      console.log(' Created demo teacher user:', teacherEmail);
    } else {
      console.log(' Teacher user already exists:', teacherEmail);
    }

    // 2. Seed Demo Student User
    const studentEmail = 'alex.johnson@university.edu';
    let studentUser = await users.findOne({ email: studentEmail });
    const studentPasswordHash = await bcrypt.hash('student123', 10);

    if (!studentUser) {
      const studentDoc = {
        name: 'Alex Johnson',
        fullName: 'Alex Johnson',
        email: studentEmail,
        passwordHash: studentPasswordHash,
        role: 'student',
        emailVerified: true,
        verificationStatus: 'Verified',
        institution: 'Stanford University',
        department: 'Computer Science & Engineering',
        degree: 'B.Tech / B.S. in Computer Science',
        academicYear: 'Third Year',
        graduationYear: '2027',
        gpa: '3.88',
        skills: [
          'Python',
          'Machine Learning',
          'React',
          'Data Science',
          'PyTorch',
          'Artificial Intelligence',
          'Node.js',
        ],
        researchInterests: [
          'Deep Learning in Biomedicine',
          'Natural Language Processing',
          'Explainable AI',
          'Autonomous Systems',
        ],
        linkedin: 'https://linkedin.com/in/alex-johnson-demo',
        github: 'https://github.com/alexjohnson-scholar',
        bio: 'Junior undergraduate student passionate about developing robust machine learning architectures for biomedical sensor analysis and cross-domain collaborative research.',
        previousProjects: [
          {
            title: 'Chest X-Ray Pneumonia Classifier with Grad-CAM Explainability',
            description: 'Trained ResNet-50 on 12,000 radiograph images achieving 94.6% sensitivity with heatmap visualization.',
            link: 'https://github.com/alexjohnson-scholar/xray-classifier',
          },
          {
            title: 'Interactive Multi-Institution Lab Portal',
            description: 'Built a full-stack dashboard with React, Vite, and Node.js for academic project tracking.',
            link: 'https://github.com/alexjohnson-scholar/lab-portal',
          },
        ],
        createdAt: new Date(),
      };
      const res = await users.insertOne(studentDoc);
      studentUser = { _id: res.insertedId, ...studentDoc };
      console.log(' Created demo student user:', studentEmail);
    } else {
      console.log(' Student user already exists:', studentEmail);
    }

    // Ensure demo accounts are verified for development stability
    await users.updateMany(
      { email: { $in: [teacherEmail, studentEmail, adminEmail] } },
      { $set: { emailVerified: true, verificationStatus: 'Verified' } }
    );
    const teacherIdStr = teacherUser._id.toString();

    const sampleOpportunities = [
      {
        title: 'AI-Based Healthcare Prediction System',
        category: 'Research Project',
        shortDescription: 'Developing deep learning models to predict early-stage cardiac abnormalities from multi-modal sensor telemetry.',
        description: 'This research project focuses on creating robust, explainable deep learning classifiers trained on continuous wearable sensor data. Students will work directly with synthetic hospital telemetry, build real-time time-series transformers, and publish their findings.',
        objectives: '1. Benchmark time-series transformer architectures against baseline LSTM models.\n2. Implement SHAP/Grad-CAM interpretability layers for clinical decision support.\n3. Publish research findings in IEEE BHI / EMBC 2027.',
        requiredSkills: ['Python', 'Machine Learning', 'Data Science', 'Artificial Intelligence'],
        eligibleYears: ['Second Year', 'Third Year', 'Fourth Year', 'Postgraduate'],
        eligibleDegrees: ['B.Tech / B.S. in Computer Science', 'Data Science', 'Biomedical Engineering'],
        eligibleDepartments: ['Computer Science', 'Artificial Intelligence', 'Biomedical'],
        positions: 5,
        participationType: 'Individual',
        institution: 'ABC University',
        department: 'School of Artificial Intelligence',
        duration: '6 Months',
        workMode: 'Hybrid',
        deadline: '2026-12-15',
        startDate: '2026-12-20',
        benefits: 'Co-authorship on paper submission, university supercomputing lab credits, formal faculty recommendation letter.',
        instructions: 'Submit statement of interest describing prior experience with PyTorch and time-series modeling.',
        teacherId: teacherIdStr,
        teacherName: 'Dr. Ramesh Kumar',
        teacherEmail: teacherEmail,
        status: 'Accepting Applications',
        applicantsCount: 1,
        createdAt: new Date(),
      },
      {
        title: 'Smart Agriculture Research Initiative',
        category: 'Research Project',
        shortDescription: 'Precision farming monitoring system using IoT sensors and edge deep learning.',
        description: 'Multi-institutional effort investigating soil humidity, drone hyperspectral imaging, and edge AI compute boxes deployed in smart greenhouses to optimize irrigation yield.',
        objectives: 'Deploy ESP32 and LoRa sensor clusters, stream data to central telemetry pipeline, run quantized Edge-TPU inferencing.',
        requiredSkills: ['Python', 'Machine Learning', 'IoT', 'Robotics'],
        eligibleYears: ['Second Year', 'Third Year', 'Fourth Year'],
        eligibleDegrees: ['Computer Science', 'Electronics & Communication', 'Agricultural Engineering'],
        eligibleDepartments: ['Electrical & Computer Engineering', 'Robotics'],
        positions: 3,
        participationType: 'Team',
        institution: 'ABC University',
        department: 'Department of Electrical & Computer Engineering',
        duration: '4 Months',
        workMode: 'Hybrid',
        deadline: '2026-11-20',
        startDate: '2026-12-01',
        benefits: 'Hardware kit sponsorship, stipend support, hands-on lab access.',
        instructions: 'Include team member profiles if applying as a collaborative unit.',
        teacherId: teacherIdStr,
        teacherName: 'Dr. Meena Vance',
        teacherEmail: 'meena.vance@abc.edu',
        status: 'Accepting Applications',
        applicantsCount: 0,
        createdAt: new Date(),
      },
      {
        title: 'Autonomous Drone Navigation in GPS-Denied Environments',
        category: 'Research Assistantship',
        shortDescription: 'Vision-based SLAM and reinforcement learning algorithms for micro-aerial vehicles.',
        description: 'Investigating real-time visual-inertial odometry and obstacle avoidance for autonomous micro-quadrotors operating inside subterranean tunnels and GPS-jammed sectors.',
        objectives: 'Simulate flight paths in Gazebo/AirSim, implement real-time ROS2 nodes, test onboard NVIDIA Jetson Orin compute modules.',
        requiredSkills: ['Python', 'Robotics', 'Machine Learning', 'Computer Vision'],
        eligibleYears: ['Third Year', 'Fourth Year', 'Postgraduate'],
        eligibleDegrees: ['Computer Science', 'Mechanical', 'Aerospace Engineering'],
        eligibleDepartments: ['Aerospace & Robotics Lab'],
        positions: 2,
        participationType: 'Individual',
        institution: 'XYZ Institute of Technology',
        department: 'Aerospace & Robotics Lab',
        duration: '6 Months',
        workMode: 'In-Person',
        deadline: '2026-11-30',
        startDate: '2026-12-10',
        benefits: 'Funded graduate assistantship stipend, international conference travel funding.',
        instructions: 'Provide links to ROS/ROS2 repositories or C++/Python robotics simulations.',
        teacherId: 'teacher-external-2',
        teacherName: 'Dr. Rajesh Nair',
        teacherEmail: 'rajesh.nair@xyz.edu',
        status: 'Accepting Applications',
        applicantsCount: 0,
        createdAt: new Date(),
      },
      {
        title: 'Full Stack Web Development for Open Scientific Data',
        category: 'Internship',
        shortDescription: 'Hands-on internship building enterprise educational portal with React and Node.js.',
        description: 'Contribute to an open-source academic portal that indexes and visualizes climate telemetry and genomic repositories for 20,000+ researchers globally.',
        objectives: 'Build accessible UI components in Tailwind and React, integrate RESTful microservices, optimize client-side caching.',
        requiredSkills: ['React', 'Node.js', 'Web Development', 'JavaScript'],
        eligibleYears: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
        eligibleDegrees: ['Any Engineering or Computing Degree'],
        eligibleDepartments: ['Computer Science Department'],
        positions: 4,
        participationType: 'Individual',
        institution: 'DEF University',
        department: 'Computer Science Department',
        duration: '3 Months',
        workMode: 'Remote',
        deadline: '2026-12-01',
        startDate: '2026-12-15',
        benefits: 'Monthly competitive stipend, open-source contributor badges, mentorship from senior engineers.',
        instructions: 'Share your GitHub profile highlighting your modern JavaScript / React experience.',
        teacherId: 'teacher-external-3',
        teacherName: 'Prof. Arun',
        teacherEmail: 'arun@def.edu',
        status: 'Accepting Applications',
        applicantsCount: 0,
        createdAt: new Date(),
      },
      {
        title: 'Campus Energy Optimization Hackathon 2026',
        category: 'Hackathon',
        shortDescription: '48-hour collaborative hackathon tackling real-time university grid load shedding and solar microgrids.',
        description: 'Join top student innovators across 30 campuses to engineer software and embedded hardware prototypes addressing sustainable campus power load management.',
        objectives: 'Deliver working MVP within 48 hours, present to industry judges from renewable energy firms.',
        requiredSkills: ['Python', 'Data Science', 'IoT', 'Web Development'],
        eligibleYears: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Postgraduate'],
        eligibleDegrees: ['All Majors Welcome'],
        eligibleDepartments: ['Renewable Energy Systems', 'Computer Science'],
        positions: 30,
        participationType: 'Team',
        institution: 'National Green Tech Council',
        department: 'Renewable Energy Systems',
        duration: '48 Hours',
        workMode: 'Hybrid',
        deadline: '2026-11-25',
        startDate: '2026-11-28',
        benefits: '$10,000 in cash prizes, startup incubation fast-track, cloud credits.',
        instructions: 'Form teams of 2 to 4 students. Individuals can also be matched during kickoff.',
        teacherId: 'teacher-external-4',
        teacherName: 'Dr. Sarah Lin',
        teacherEmail: 'sarah.lin@greentech.org',
        status: 'Closing Soon',
        applicantsCount: 0,
        createdAt: new Date(),
      },
      {
        title: 'Zero-Knowledge Cryptographic Protocol Verification',
        category: 'Research Project',
        shortDescription: 'Formal verification of succinct non-interactive arguments of knowledge (zk-SNARKs).',
        description: 'Explore the foundations of privacy-preserving computation. Formally verify circuit constraints and benchmark proving latency on modern multi-core GPU clusters.',
        objectives: 'Prove correctness of constraint systems, analyze sound bounds, implement optimized provers.',
        requiredSkills: ['Cybersecurity', 'Python', 'Java'],
        eligibleYears: ['Third Year', 'Fourth Year', 'Postgraduate', 'Research Scholar'],
        eligibleDegrees: ['Computer Science', 'Mathematics', 'Cybersecurity'],
        eligibleDepartments: ['Cybersecurity & Cryptography Institute'],
        positions: 2,
        participationType: 'Individual',
        institution: 'ABC University',
        department: 'Cybersecurity & Cryptography Institute',
        duration: '6 Months',
        workMode: 'Remote',
        deadline: '2026-12-10',
        startDate: '2027-01-05',
        benefits: 'Co-authored publication, cryptography lab certificate, conference sponsorship.',
        instructions: 'Strong foundation in discrete mathematics, abstract algebra, or security protocols required.',
        teacherId: teacherIdStr,
        teacherName: 'Dr. Ramesh Kumar',
        teacherEmail: teacherEmail,
        status: 'Accepting Applications',
        applicantsCount: 0,
        createdAt: new Date(),
      },
    ];

    let firstOppId = null;

    for (const opp of sampleOpportunities) {
      const existing = await opportunities.findOne({ title: opp.title, institution: opp.institution });
      if (!existing) {
        const res = await opportunities.insertOne(opp);
        console.log(` Created opportunity: "${opp.title}"`);
        if (!firstOppId) firstOppId = res.insertedId;
      } else {
        console.log(` Opportunity already exists: "${opp.title}"`);
        if (!firstOppId) firstOppId = existing._id;
      }
    }

    // 4. Seed Demo Application
    if (firstOppId && studentUser) {
      const existingApp = await applications.findOne({
        opportunityId: firstOppId.toString(),
        studentId: studentUser._id.toString(),
      });

      if (!existingApp) {
        const demoApp = {
          opportunityId: firstOppId.toString(),
          opportunityTitle: 'AI-Based Healthcare Prediction System',
          category: 'Research Project',
          institution: 'ABC University',
          department: 'School of Artificial Intelligence',
          teacherId: teacherIdStr,
          teacherName: 'Dr. Ramesh Kumar',
          studentId: studentUser._id.toString(),
          fullName: 'Alex Johnson',
          email: studentEmail,
          studentInstitution: 'Stanford University',
          studentDepartment: 'Computer Science & Engineering',
          academicYear: 'Third Year',
          skills: ['Python', 'Machine Learning', 'Data Science', 'React', 'PyTorch'],
          statementOfInterest: 'I have hands-on experience building PyTorch CNN architectures for thoracic imaging and time-series ECG anomaly detection. I am extremely motivated to contribute to this cardiac prediction system.',
          linkedin: 'https://linkedin.com/in/alex-johnson-demo',
          github: 'https://github.com/alexjohnson-scholar',
          experience: 'Undergraduate researcher in biomedical imaging. Built Grad-CAM explainability models on 12k radiographs.',
          status: 'Under Review',
          appliedAt: new Date(),
          updatedAt: new Date(),
        };

        const appRes = await applications.insertOne(demoApp);
        console.log(' Created demo application from Alex Johnson for AI Healthcare.');

        // Seed initial notification
        await notifications.insertOne({
          userId: teacherIdStr,
          title: 'New Applicant Received',
          message: 'Alex Johnson applied for AI-Based Healthcare Prediction System.',
          type: 'application',
          isRead: false,
          relatedId: appRes.insertedId.toString(),
          createdAt: new Date(),
        });
      } else {
        console.log(' Demo application already exists.');
      }
    }

    console.log('--- Database seeding completed successfully! ---');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await closeDB();
  }
}

runSeed();

