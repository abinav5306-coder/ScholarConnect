import React, { useState, useEffect, useCallback } from 'react';
import { ScholarContext } from './ScholarContextBase';
import { 
  opportunityAPI, 
  applicationAPI, 
  studentAPI, 
  teacherAPI, 
  notificationAPI,
  verificationAPI,
  healthAPI,
  messageAPI,
  authAPI,
  resumeAPI,
  exportAPI
} from '../services/api';
import { subscribeToSocketEvent } from '../services/socket';

/**
 * ScholarConnect Centralized State Context with Real MongoDB Atlas Integration
 * 
 * Single source of truth for Opportunities, Student Applications,
 * Student Profile, Teacher Profile, and Automatic Notifications.
 * 
 * Persists all status changes, applications, and opportunities directly into MongoDB Atlas.
 */

const STORAGE_KEYS = {
  OPPORTUNITIES: 'scholarconnect_opportunities_v2',
  APPLICATIONS: 'scholarconnect_applications_v2',
  STUDENT_PROFILE: 'scholarconnect_student_profile_v2',
  TEACHER_PROFILE: 'scholarconnect_teacher_profile_v2',
  SAVED_OPPORTUNITIES: 'scholarconnect_saved_opps_v2',
  NOTIFICATIONS: 'scholarconnect_notifications_v2',
};

// Initial demonstration opportunities across categories
const INITIAL_OPPORTUNITIES = [
  {
    id: 'opp-1',
    title: 'AI-Based Healthcare Prediction System',
    category: 'Research Project',
    teacherName: 'Dr. Kumar',
    teacherEmail: 'kumar@abc.edu',
    institution: 'ABC University',
    department: 'Department of Computer Science & Medicine',
    shortDescription: 'Developing deep learning models to predict early-stage diabetic complications using EHR and imaging data.',
    detailedDescription: 'This research project investigates multimodal neural networks that combine electronic health records (EHR) and retinal imaging to detect early-onset vascular complications. Students will work with clinical datasets, perform feature extraction, and train predictive classifiers with faculty guidance.',
    researchObjectives: '1. Curate and preprocess clinical EHR and imaging data.\n2. Implement predictive deep learning architectures (CNN + Transformer).\n3. Evaluate model explainability using SHAP and Grad-CAM.\n4. Co-author research findings for an IEEE/ACM conference submission.',
    skills: ['Python', 'Machine Learning', 'Data Science', 'Artificial Intelligence'],
    eligibilityYears: ['Second Year', 'Third Year'],
    eligibleDegrees: ['BE', 'BTech', 'ME', 'MTech'],
    eligibleDepartments: 'Computer Science, Data Science, Biomedical Engineering',
    positions: 5,
    participationType: 'Individual',
    duration: '6 Months',
    workMode: 'Hybrid',
    deadline: '2026-12-15',
    startDate: '2027-01-10',
    benefits: 'Research co-authorship credit, monthly stipend of ₹8,000, lab workstation access.',
    instructions: 'Submit relevant coursework grades in Machine Learning or Data Structures. Attach any GitHub repositories with prior ML projects.',
    status: 'Accepting Applications',
    postedDate: '2026-10-24',
    applicantsCount: 4,
  },
  {
    id: 'opp-2',
    title: 'National Innovation Hackathon',
    category: 'Hackathon',
    teacherName: 'Dr. Priya',
    teacherEmail: 'priya@xyz.edu',
    institution: 'XYZ Institute',
    department: 'Innovation & Incubation Council',
    shortDescription: '36-hour national level hackathon addressing smart city challenges, sustainable transit, and civic tech.',
    detailedDescription: 'XYZ Institute is hosting a premier inter-university hackathon sponsored by national research agencies. Student teams will build full-stack or hardware prototypes tackling urban mobility, waste segregation, and disaster alert systems.',
    researchObjectives: '1. Architect scalable real-time software or IoT prototypes within 36 hours.\n2. Pitch to venture capitalists and faculty researchers.\n3. Prototype deployment on cloud infrastructure.',
    skills: ['React', 'Node.js', 'Problem Solving', 'Web Development'],
    eligibilityYears: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
    eligibleDegrees: ['All Degrees'],
    eligibleDepartments: 'Any Engineering or Computing Discipline',
    positions: 12,
    participationType: 'Team',
    duration: '3 Days (Intensive)',
    workMode: 'Offline',
    deadline: '2026-11-28',
    startDate: '2026-12-05',
    benefits: 'Grand prize of ₹1,50,000, seed funding consideration, pre-placement interview opportunities.',
    instructions: 'Form a team of 3-4 students. Specify your team leader and team name in the application notes.',
    status: 'Closing Soon',
    postedDate: '2026-10-18',
    applicantsCount: 7,
  },
  {
    id: 'opp-3',
    title: 'Full Stack Web Development Internship',
    category: 'Internship',
    teacherName: 'Prof. Arun',
    teacherEmail: 'arun@def.edu',
    institution: 'DEF University',
    department: 'Center for Web Systems & Cloud Research',
    shortDescription: 'Hands-on internship building enterprise educational portal services using the MERN stack.',
    detailedDescription: 'Selected interns will collaborate directly with faculty engineers to architect and maintain cloud-native microservices for the university research registry. You will gain production experience in RESTful APIs, database schema optimization, and responsive user interfaces.',
    researchObjectives: '1. Implement responsive user interfaces following WCAG accessibility guidelines.\n2. Design scalable RESTful API endpoints and token-based authentication.\n3. Write automated unit and integration tests using Jest and Vitest.',
    skills: ['React', 'Express', 'MongoDB', 'Node.js', 'Web Development'],
    eligibilityYears: ['Second Year', 'Third Year', 'Fourth Year'],
    eligibleDegrees: ['BE', 'BTech', 'BCA', 'MCA'],
    eligibleDepartments: 'Computer Science, Information Technology, Software Engineering',
    positions: 3,
    participationType: 'Individual',
    duration: '3 Months',
    workMode: 'Remote',
    deadline: '2026-11-30',
    startDate: '2026-12-01',
    benefits: 'Monthly stipend of ₹12,000, internship completion certificate, industry recommendation letter.',
    instructions: 'Provide links to your GitHub profile and live deployed web applications.',
    status: 'Accepting Applications',
    postedDate: '2026-10-22',
    applicantsCount: 5,
  },
  {
    id: 'opp-4',
    title: 'Smart Agriculture Research Initiative',
    category: 'Research Project',
    teacherName: 'Dr. Meena Vance',
    teacherEmail: 'meena.vance@abc.edu',
    institution: 'ABC University',
    department: 'Department of Electrical & IoT Systems',
    shortDescription: 'Precision farming monitoring system using IoT edge sensors and low-power LoRa networks.',
    detailedDescription: 'Join our interdisciplinary research group deploying autonomous wireless sensors across experimental campus greenhouse farms. Research focuses on optimizing soil moisture telemetry and automated drip irrigation through predictive algorithms.',
    researchObjectives: '1. Calibrate multi-depth soil moisture and ambient temperature sensors.\n2. Transmit sensor telemetry across 5km campus mesh using LoRaWAN.\n3. Implement edge analytics on ESP32 microcontrollers to detect drought stress.',
    skills: ['IoT', 'Python', 'Machine Learning', 'Robotics'],
    eligibilityYears: ['Second Year', 'Third Year', 'Fourth Year', 'Postgraduate'],
    eligibleDegrees: ['BE', 'BTech', 'ME', 'MTech'],
    eligibleDepartments: 'Electrical Engineering, Electronics, Agricultural Tech, CS',
    positions: 4,
    participationType: 'Team',
    duration: '4 Months',
    workMode: 'Hybrid',
    deadline: '2026-12-05',
    startDate: '2027-01-05',
    benefits: 'Hardware kit sponsorship, ₹10,000 monthly fellowship, patent co-inventorship credit.',
    instructions: 'Submit prior embedded systems project links or hardware schematics if available.',
    status: 'Accepting Applications',
    postedDate: '2026-10-26',
    applicantsCount: 3,
  },
  {
    id: 'opp-5',
    title: 'Autonomous Drone Navigation Assistantship',
    category: 'Research Assistantship',
    teacherName: 'Dr. Rajesh Nair',
    teacherEmail: 'rajesh.nair@xyz.edu',
    institution: 'XYZ Institute',
    department: 'Robotics & Autonomous Systems Lab',
    shortDescription: 'Vision-based SLAM and obstacle avoidance algorithms for micro-aerial vehicles in GPS-denied environments.',
    detailedDescription: 'The Robotics Lab is seeking two dedicated undergraduate or postgraduate research assistants to contribute to autonomous quadrotor flight controllers. Assistants will implement visual-inertial odometry algorithms using ROS2 and simulate navigation in Gazebo before hardware deployment.',
    researchObjectives: '1. Benchmark visual-inertial SLAM algorithms under variable indoor illumination.\n2. Implement real-time obstacle avoidance on NVIDIA Jetson compute modules.\n3. Validate indoor flight autonomy in laboratory test cage.',
    skills: ['Python', 'Robotics', 'Machine Learning', 'Computer Vision'],
    eligibilityYears: ['Third Year', 'Fourth Year', 'Postgraduate'],
    eligibleDegrees: ['BTech', 'MTech', 'MS by Research'],
    eligibleDepartments: 'Robotics, Computer Science, Aerospace, Mechanical',
    positions: 2,
    participationType: 'Individual',
    duration: '6 Months',
    workMode: 'In-Person',
    deadline: '2026-11-20',
    startDate: '2026-12-01',
    benefits: 'Full research fellowship of ₹15,000/month, travel grant for ICRA/IROS conference presentation.',
    instructions: 'Candidate must have completed coursework in Linear Algebra, Control Systems, or Robotics.',
    status: 'Accepting Applications',
    postedDate: '2026-10-25',
    applicantsCount: 2,
  },
  {
    id: 'opp-6',
    title: 'Zero-Knowledge Cryptography Startup Incubator',
    category: 'Startup Opportunity',
    teacherName: 'Dr. Ramesh Kumar',
    teacherEmail: 'kumar@abc.edu',
    institution: 'ABC University',
    department: 'School of Cybersecurity',
    shortDescription: 'Incubation opportunity building privacy-preserving decentralized credential verifiers.',
    detailedDescription: 'Supported by the University Seed Fund, this incubator project pairs technical student founders with senior cryptography researchers to develop enterprise zero-knowledge identity validation protocols.',
    researchObjectives: '1. Construct zk-SNARK circuits for verifiable student identity attestations.\n2. Benchmark proving times and gas consumption.\n3. Present MVP to venture partner syndicate.',
    skills: ['Cybersecurity', 'Python', 'Java', 'Web Development'],
    eligibilityYears: ['Third Year', 'Fourth Year', 'Postgraduate'],
    eligibleDegrees: ['BE', 'BTech', 'Dual Degree'],
    eligibleDepartments: 'Computer Science, Information Security, Mathematics',
    positions: 2,
    participationType: 'Team',
    duration: '6 Months',
    workMode: 'Remote',
    deadline: '2026-12-10',
    startDate: '2027-01-02',
    benefits: '₹5,00,000 prototype grant, dedicated incubator space, legal incorporation support.',
    instructions: 'Submit a 1-page proposal explaining your interest in zero-knowledge proofs.',
    status: 'Accepting Applications',
    postedDate: '2026-10-27',
    applicantsCount: 1,
  },
];

// Initial demonstration student profile
const INITIAL_STUDENT_PROFILE = {
  id: 'student-demo',
  fullName: 'Alex Johnson',
  email: 'alex.johnson@university.edu',
  college: 'Stanford University',
  institution: 'Stanford University',
  department: 'Computer Science & Engineering',
  degree: 'Bachelor of Technology (B.Tech)',
  academicYear: 'Third Year',
  graduationYear: '2027',
  registerNumber: '21CS042',
  verificationStatus: 'Verified',
  technicalSkills: ['Python', 'Java', 'React', 'Machine Learning', 'Data Science', 'Node.js', 'SQL'],
  skills: ['Python', 'Java', 'React', 'Machine Learning', 'Data Science', 'Node.js', 'SQL'],
  researchInterests: ['Artificial Intelligence in Healthcare', 'Deep Learning', 'Computer Vision', 'Edge IoT Computing'],
  linkedin: 'https://linkedin.com/in/alex-johnson-demo',
  github: 'https://github.com/alexjohnson-scholar',
  portfolioUrl: 'https://alexjohnson.dev',
  programmingLanguages: ['Python', 'JavaScript', 'TypeScript', 'C++', 'SQL'],
  projects: [
    {
      id: 'proj-1',
      title: 'Real-time Diabetic Retinopathy Classification',
      role: 'Lead Deep Learning Researcher',
      technologies: ['Python', 'PyTorch', 'TorchVision', 'OpenCV'],
      description: 'Built a dual-branch Convolutional Neural Network on retinal fundus scans achieving 93.4% AUC using PyTorch.',
      liveUrl: 'https://retinopathy-demo.stanford.edu',
      githubUrl: 'https://github.com/alexjohnson-scholar/retinopathy-cnn',
      link: 'https://github.com/alexjohnson-scholar/retinopathy-cnn'
    },
    {
      id: 'proj-2',
      title: 'Automated Research Paper Summarizer',
      role: 'NLP Engineer',
      technologies: ['Python', 'Hugging Face Transformers', 'FastAPI', 'React'],
      description: 'Fine-tuned BART transformer model to extract key methodology and contribution bullet points from arXiv preprints.',
      liveUrl: 'https://arxiv-summarizer-web.app',
      githubUrl: 'https://github.com/alexjohnson-scholar/arxiv-summarizer',
      link: 'https://github.com/alexjohnson-scholar/arxiv-summarizer'
    }
  ],
  previousProjects: [
    {
      title: 'Real-time Diabetic Retinopathy Classification',
      description: 'Built a dual-branch Convolutional Neural Network on retinal fundus scans achieving 93.4% AUC using PyTorch.',
      link: 'https://github.com/alexjohnson-scholar/retinopathy-cnn'
    },
    {
      title: 'Automated Research Paper Summarizer',
      description: 'Fine-tuned BART transformer model to extract key methodology and contribution bullet points from arXiv preprints.',
      link: 'https://github.com/alexjohnson-scholar/arxiv-summarizer'
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Deep Learning Specialization',
      issuer: 'DeepLearning.AI / Coursera',
      issueDate: '2025-08-15',
      credentialUrl: 'https://coursera.org/verify/specialization/DL-2025-ALEX',
    },
    {
      id: 'cert-2',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2026-02-10',
      credentialUrl: 'https://aws.amazon.com/verification/AWS-CCP-987654',
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: 'Dean’s Honor List (Consecutive 4 Semesters)',
      description: 'Awarded for maintaining top 5% GPA across School of Computer Science.',
      date: '2024 - 2026',
    },
    {
      id: 'ach-2',
      title: 'First Place – Stanford HealthTech Hackathon',
      description: 'Built an open-source real-time EHR diabetic risk triage tool.',
      date: '2025-11',
    },
  ],
  resume: {
    originalName: 'Alex_Johnson_Academic_Resume_2026.pdf',
    fileName: 'resume_demo_alex_2026.pdf',
    fileSize: 428000,
    uploadedAt: '2026-10-15T10:00:00.000Z',
  },
  bio: 'Third-year CS undergraduate researcher enthusiastic about developing interpretable deep learning models for healthcare diagnostics and biomedical data analysis.',
};

// Initial demonstration teacher profile
const INITIAL_TEACHER_PROFILE = {
  id: 'teacher-demo',
  fullName: 'Dr. Ramesh Kumar',
  email: 'ramesh.kumar@abc.edu',
  institution: 'ABC University',
  department: 'School of Artificial Intelligence',
  designation: 'Associate Professor & Principal Investigator',
  facultyIdNumber: 'FAC-2018-042',
  verificationStatus: 'Verified',
  title: 'Associate Professor & Principal Investigator',
  specialization: 'Biomedical AI, Deep Learning, Medical Imaging Systems',
  officeLocation: 'Turing Hall, Room 412',
  labName: 'Biomedical AI & Machine Learning Research Group',
  phone: '+91 98765 43210',
  bio: 'Principal investigator leading cross-institutional research in biomedical predictive systems, computer vision diagnostics, and wearable sensor analytics.',
  researchInterests: [
    'Biomedical Imaging',
    'Computer Vision',
    'Deep Learning',
    'Predictive Healthcare',
    'Wearable Sensor Telemetry'
  ],
  activeProjectsCount: 3,
  totalApplicantsCount: 18,
  collaboratingStudentsCount: 7,
};

// Initial student applications
const INITIAL_APPLICATIONS = [
  {
    id: 'app-demo-1',
    opportunityId: 'opp-1',
    opportunityTitle: 'AI-Based Healthcare Prediction System',
    category: 'Research Project',
    teacherName: 'Dr. Ramesh Kumar',
    teacherEmail: 'ramesh.kumar@abc.edu',
    institution: 'ABC University',
    studentName: 'Alex Johnson',
    fullName: 'Alex Johnson',
    studentEmail: 'alex.johnson@university.edu',
    email: 'alex.johnson@university.edu',
    studentDepartment: 'Computer Science & Engineering',
    studentAcademicYear: 'Third Year',
    studentInstitution: 'Stanford University',
    studentSkills: ['Python', 'Machine Learning', 'Data Science', 'PyTorch'],
    whyInterested: 'I have hands-on experience building PyTorch CNN architectures for medical imaging and want to explore multimodal time-series EHR data under Dr. Kumar.',
    statementOfInterest: 'I have hands-on experience building PyTorch CNN architectures for medical imaging and want to explore multimodal time-series EHR data under Dr. Kumar.',
    linkedin: 'https://linkedin.com/in/alex-johnson-demo',
    github: 'https://github.com/alexjohnson-scholar',
    experience: 'Completed undergraduate research on Diabetic Retinopathy classification achieving 93.4% AUC.',
    appliedAt: '2026-10-25',
    status: 'Shortlisted',
    statusMessage: 'Congratulations! Your application has been shortlisted.',
  },
  {
    id: 'app-demo-2',
    opportunityId: 'opp-3',
    opportunityTitle: 'Full Stack Web Development Internship',
    category: 'Internship',
    teacherName: 'Prof. Arun',
    teacherEmail: 'arun@def.edu',
    institution: 'DEF University',
    studentName: 'Aarav Sharma',
    fullName: 'Aarav Sharma',
    studentEmail: 'aarav.sharma@def.edu',
    email: 'aarav.sharma@def.edu',
    studentDepartment: 'Computer Science and Engineering',
    studentAcademicYear: 'Third Year',
    studentInstitution: 'DEF University',
    studentSkills: ['React', 'Express', 'Node.js', 'MongoDB'],
    whyInterested: 'Passionate about full-stack architectures and have built multiple responsive web applications using React and Node.js.',
    statementOfInterest: 'Passionate about full-stack architectures and have built multiple responsive web applications using React and Node.js.',
    linkedin: 'https://linkedin.com/in/aarav-sharma-cs',
    github: 'https://github.com/aaravsharma',
    experience: 'Created research collaboration platforms and portfolio sites using React 18, Tailwind CSS, and Node.js REST backends.',
    appliedAt: '2026-10-28',
    status: 'Under Review',
    statusMessage: 'Your application is currently under review by the faculty mentor.',
  },
  {
    id: 'app-demo-3',
    opportunityId: 'opp-4',
    opportunityTitle: 'Smart Agriculture Research Initiative',
    category: 'Research Project',
    teacherName: 'Dr. Meena Vance',
    teacherEmail: 'meena.vance@abc.edu',
    institution: 'ABC University',
    studentName: 'Pooja Krishnan',
    fullName: 'Pooja Krishnan',
    studentEmail: 'pooja.k@abc.edu',
    email: 'pooja.k@abc.edu',
    studentDepartment: 'Electronics and Communication',
    studentAcademicYear: 'Fourth Year',
    studentInstitution: 'ABC University',
    studentSkills: ['IoT', 'Python', 'Embedded C', 'Robotics'],
    whyInterested: 'Interested in IoT telemetry architectures and edge processing on low power sensor arrays for environmental monitoring.',
    statementOfInterest: 'Interested in IoT telemetry architectures and edge processing on low power sensor arrays for environmental monitoring.',
    linkedin: 'https://linkedin.com/in/poojakrishnan',
    github: 'https://github.com/poojak-iot',
    experience: 'Built an ESP32 micro-weather station transmitting temperature and humidity data over MQTT.',
    appliedAt: '2026-10-29',
    status: 'Submitted',
    statusMessage: 'Your application has been successfully submitted and recorded.',
  }
];

const INITIAL_SAVED = ['opp-1', 'opp-4'];

export function ScholarProvider({ children }) {
  // Database connection status indicator
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Opportunities state with localStorage persistence fallback
  const [opportunities, setOpportunities] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
      return stored ? JSON.parse(stored) : INITIAL_OPPORTUNITIES;
    } catch {
      return INITIAL_OPPORTUNITIES;
    }
  });

  // 2. Applications state with localStorage persistence fallback
  const [applications, setApplications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  // 3. Student profile state
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
      return stored ? JSON.parse(stored) : INITIAL_STUDENT_PROFILE;
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });

  // 4. Teacher profile state
  const [teacherProfile, setTeacherProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEACHER_PROFILE);
      return stored ? JSON.parse(stored) : INITIAL_TEACHER_PROFILE;
    } catch {
      return INITIAL_TEACHER_PROFILE;
    }
  });

  // 5. Saved opportunities state
  const [savedOpportunities, setSavedOpportunities] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_OPPORTUNITIES);
      return stored ? JSON.parse(stored) : INITIAL_SAVED;
    } catch {
      return INITIAL_SAVED;
    }
  });

  // 6. Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 7. Real-Time Unread Messages Count
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Persist to localStorage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHER_PROFILE, JSON.stringify(teacherProfile));
  }, [teacherProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(savedOpportunities));
  }, [savedOpportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Synchronize with MongoDB Atlas backend on startup and interval
  const syncWithDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Health check to test backend connectivity
      const health = await healthAPI.checkHealth();
      if (health && health.status === 'ok') {
        setDbStatus(health.database === 'connected' ? 'connected' : 'offline');
      }

      // 2. Fetch opportunities from MongoDB Atlas
      const oppResponse = await opportunityAPI.getAll();
      if (oppResponse && oppResponse.success && Array.isArray(oppResponse.opportunities) && oppResponse.opportunities.length > 0) {
        setOpportunities(oppResponse.opportunities);
      }

      // 3. Fetch applications from MongoDB Atlas
      const appResponse = await applicationAPI.getAll();
      if (appResponse && appResponse.success && Array.isArray(appResponse.applications) && appResponse.applications.length > 0) {
        setApplications(appResponse.applications);
      }

      // 4. Fetch notifications from MongoDB Atlas
      const notifTarget = studentProfile.email || 'student-demo';
      const notifResponse = await notificationAPI.getByUser(notifTarget).catch(() => null);
      if (notifResponse && notifResponse.success && Array.isArray(notifResponse.notifications)) {
        setNotifications(notifResponse.notifications);
      }

      // 5. Fetch verification status from MongoDB if user is authenticated
      const token = localStorage.getItem('scholarconnect_token');
      if (token) {
        const vStatus = await verificationAPI.getStatus().catch(() => null);
        if (vStatus && vStatus.success) {
          if (vStatus.role === 'teacher') {
            setTeacherProfile((prev) => ({
              ...prev,
              verificationStatus: vStatus.verificationStatus,
              rejectionReason: vStatus.rejectionReason,
              verifiedAt: vStatus.verifiedAt,
              submittedAt: vStatus.submittedAt,
            }));
          } else {
            setStudentProfile((prev) => ({
              ...prev,
              verificationStatus: vStatus.verificationStatus,
              rejectionReason: vStatus.rejectionReason,
              verifiedAt: vStatus.verifiedAt,
              submittedAt: vStatus.submittedAt,
            }));
          }
        }

        // 6. Fetch Real-Time Unread Messages Count
        const msgRes = await messageAPI.getUnreadCount().catch(() => null);
        if (msgRes && typeof msgRes.unreadCount === 'number') {
          setUnreadMessagesCount(msgRes.unreadCount);
        }
      }
    } catch (err) {
      setDbStatus('offline');
      console.log('[ScholarConnect Sync] Running with cached data:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [studentProfile.email]);

  const refreshUnreadMessagesCount = useCallback(async () => {
    try {
      const msgRes = await messageAPI.getUnreadCount();
      if (msgRes && typeof msgRes.unreadCount === 'number') {
        setUnreadMessagesCount(msgRes.unreadCount);
      }
    } catch (err) {
      // silently ignore
    }
  }, []);

  // Real-time socket event listener for global unread counter
  useEffect(() => {
    const unsubMsg = subscribeToSocketEvent('new_message_notification', () => {
      setUnreadMessagesCount((prev) => prev + 1);
    });

    return () => {
      if (unsubMsg) unsubMsg();
    };
  }, []);

  const refreshVerificationStatus = async () => {
    try {
      const vStatus = await verificationAPI.getStatus();
      if (vStatus && vStatus.success) {
        if (vStatus.role === 'teacher') {
          setTeacherProfile((prev) => ({
            ...prev,
            verificationStatus: vStatus.verificationStatus,
            rejectionReason: vStatus.rejectionReason,
            verifiedAt: vStatus.verifiedAt,
            submittedAt: vStatus.submittedAt,
          }));
        } else {
          setStudentProfile((prev) => ({
            ...prev,
            verificationStatus: vStatus.verificationStatus,
            rejectionReason: vStatus.rejectionReason,
            verifiedAt: vStatus.verifiedAt,
            submittedAt: vStatus.submittedAt,
          }));
        }
        return vStatus;
      }
    } catch (err) {
      console.warn('Could not refresh verification status:', err.message);
    }
    return null;
  };

  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  // ==========================================
  // Opportunity Actions (Connected to MongoDB Atlas)
  // ==========================================

  /**
   * Publish a new opportunity from Teacher Portal
   * Saves to MongoDB Atlas via POST /api/opportunities
   */
  const createOpportunity = async (newOpp) => {
    const oppRecord = {
      ...newOpp,
      id: `opp-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 0,
      status: newOpp.status || 'Accepting Applications',
      teacherName: newOpp.teacherName || teacherProfile.fullName,
      teacherEmail: newOpp.teacherEmail || teacherProfile.email,
      institution: newOpp.institution || teacherProfile.institution,
      department: newOpp.department || teacherProfile.department,
    };

    // 1. Optimistic update
    setOpportunities((prev) => [oppRecord, ...prev]);

    // 2. Persist to MongoDB Atlas backend
    try {
      const response = await opportunityAPI.create(oppRecord);
      if (response && response.success && response.opportunity) {
        const mongoOpp = response.opportunity;
        setOpportunities((prev) =>
          prev.map((o) => (o.id === oppRecord.id ? { ...o, ...mongoOpp, id: mongoOpp.id || mongoOpp._id } : o))
        );
        return mongoOpp;
      }
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not save opportunity to remote DB:', err.message);
    }

    return oppRecord;
  };

  /**
   * Close applications for an opportunity in MongoDB
   */
  const closeOpportunity = async (oppId) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === oppId ? { ...opp, status: 'Closed' } : opp))
    );

    try {
      await opportunityAPI.update(oppId, { status: 'Closed' });
      await syncWithDatabase();
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not close opportunity in MongoDB:', err.message);
    }
  };

  /**
   * Reopen or update an opportunity in MongoDB
   */
  const updateOpportunity = async (oppId, updates) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === oppId ? { ...opp, ...updates } : opp))
    );

    try {
      await opportunityAPI.update(oppId, updates);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not update opportunity in MongoDB:', err.message);
    }
  };

  /**
   * Delete an opportunity in MongoDB
   */
  const deleteOpportunity = async (oppId) => {
    setOpportunities((prev) => prev.filter((opp) => opp.id !== oppId));

    try {
      await opportunityAPI.delete(oppId);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not delete opportunity from MongoDB:', err.message);
    }
  };

  // ==========================================
  // Student Application Actions (Connected to MongoDB Atlas)
  // ==========================================

  /**
   * Check if student has already applied to this opportunity
   */
  const hasApplied = (opportunityId) => {
    return applications.some(
      (app) => (app.opportunityId === opportunityId || app.opportunityId === String(opportunityId)) &&
               (app.studentEmail === studentProfile.email || app.email === studentProfile.email)
    );
  };

  /**
   * Submit student application for an opportunity
   * Saves to MongoDB Atlas via POST /api/applications (Supports PDF Resume attachment)
   */
  const applyForOpportunity = async (opportunity, formData, resumeFile = null, useProfileResume = true) => {
    if (hasApplied(opportunity.id || opportunity._id)) {
      return { success: false, message: 'You have already submitted an application for this opportunity.' };
    }

    if (opportunity.status === 'Closed') {
      return { success: false, message: 'Applications for this opportunity have closed.' };
    }

    const applicationRecord = {
      id: `app-${Date.now()}`,
      opportunityId: opportunity.id || opportunity._id,
      opportunityTitle: opportunity.title,
      category: opportunity.category,
      teacherName: opportunity.teacherName,
      teacherEmail: opportunity.teacherEmail || '',
      institution: opportunity.institution,
      studentName: formData.fullName || studentProfile.fullName,
      studentEmail: studentProfile.email,
      studentDepartment: formData.department || studentProfile.department,
      studentAcademicYear: formData.academicYear || studentProfile.academicYear,
      studentInstitution: formData.institution || studentProfile.institution,
      studentSkills: formData.skills || studentProfile.skills || studentProfile.technicalSkills,
      whyInterested: formData.whyInterested,
      statementOfInterest: formData.whyInterested,
      linkedin: formData.linkedin || studentProfile.linkedin,
      github: formData.github || studentProfile.github,
      portfolioUrl: formData.portfolioUrl || studentProfile.portfolioUrl,
      experience: formData.experience,
      documentNote: formData.documentNote || '',
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      statusMessage: 'Your application has been successfully submitted and recorded.',
      resume: resumeFile
        ? {
            originalName: resumeFile.name,
            fileSize: resumeFile.size,
            uploadedAt: new Date().toISOString(),
            isCustom: true,
          }
        : useProfileResume && studentProfile.resume
        ? {
            ...studentProfile.resume,
            isCustom: false,
          }
        : null,
    };

    // 1. Optimistic update
    setApplications((prev) => [applicationRecord, ...prev]);

    // 2. Increment applicant count
    setOpportunities((prev) =>
      prev.map((opp) =>
        (opp.id === opportunity.id || opp._id === opportunity._id)
          ? { ...opp, applicantsCount: (opp.applicantsCount || 0) + 1 }
          : opp
      )
    );

    // 3. Persist to MongoDB Atlas backend
    try {
      let submitPayload;
      if (resumeFile) {
        const fd = new FormData();
        fd.append('opportunityId', opportunity.id || opportunity._id);
        fd.append('fullName', applicationRecord.studentName);
        fd.append('studentEmail', applicationRecord.studentEmail);
        fd.append('institution', applicationRecord.studentInstitution);
        fd.append('department', applicationRecord.studentDepartment);
        fd.append('academicYear', applicationRecord.studentAcademicYear);
        fd.append(
          'skills',
          Array.isArray(applicationRecord.studentSkills)
            ? applicationRecord.studentSkills.join(', ')
            : applicationRecord.studentSkills
        );
        fd.append('whyInterested', applicationRecord.whyInterested);
        fd.append('linkedin', applicationRecord.linkedin || '');
        fd.append('github', applicationRecord.github || '');
        fd.append('portfolioUrl', applicationRecord.portfolioUrl || '');
        fd.append('experience', applicationRecord.experience || '');
        fd.append('documentNote', applicationRecord.documentNote || '');
        fd.append('resumeFile', resumeFile);
        submitPayload = fd;
      } else {
        submitPayload = {
          ...applicationRecord,
          useProfileResume: !!useProfileResume,
        };
      }

      const response = await applicationAPI.submit(submitPayload);
      if (response && response.success && response.application) {
        const mongoApp = response.application;
        setApplications((prev) =>
          prev.map((a) =>
            a.id === applicationRecord.id ? { ...a, ...mongoApp, id: mongoApp.id || mongoApp._id } : a
          )
        );
        return { success: true, application: mongoApp };
      }
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not save application to remote DB:', err.message);
    }

    return { success: true, application: applicationRecord };
  };

  /**
   * Teacher updates single application status in MongoDB
   */
  const updateApplicationStatus = async (appId, newStatus, notes = '') => {
    // 1. Optimistic update
    setApplications((prev) =>
      prev.map((app) => (app.id === appId || app._id === appId ? { ...app, status: newStatus } : app))
    );

    // 2. Persist to MongoDB Atlas
    try {
      await applicationAPI.updateStatus(appId, newStatus, notes);
      // Re-fetch notifications & applications
      await syncWithDatabase();
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not update application status in MongoDB:', err.message);
    }
  };

  /**
   * Teacher bulk updates multiple applications in MongoDB
   */
  const updateBulkApplicationStatus = async (appIds, newStatus, notes = '') => {
    if (!Array.isArray(appIds) || appIds.length === 0) return;

    // 1. Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        appIds.includes(app.id) || appIds.includes(app._id) ? { ...app, status: newStatus } : app
      )
    );

    // 2. Persist to MongoDB Atlas
    try {
      await applicationAPI.bulkUpdateStatus(appIds, newStatus, notes);
      await syncWithDatabase();
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not bulk update applications in MongoDB:', err.message);
    }
  };

  // ==========================================
  // Notifications Actions (Connected to MongoDB Atlas)
  // ==========================================

  const markNotificationAsRead = async (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId || n._id === notifId ? { ...n, isRead: true } : n))
    );

    try {
      await notificationAPI.markAsRead(notifId);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not mark notification as read:', err.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const targetUser = studentProfile.email || 'student-demo';
      await notificationAPI.markAllAsRead(targetUser);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not mark all notifications as read:', err.message);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // ==========================================
  // Saved Opportunities Actions
  // ==========================================

  const toggleSaveOpportunity = (oppId) => {
    setSavedOpportunities((prev) => {
      if (prev.includes(oppId)) {
        return prev.filter((id) => id !== oppId);
      } else {
        return [...prev, oppId];
      }
    });
  };

  const isSaved = (oppId) => savedOpportunities.includes(oppId);

  // ==========================================
  // Profile Updates (Connected to MongoDB Atlas)
  // ==========================================

  const updateStudent = async (updates) => {
    setStudentProfile((prev) => ({ ...prev, ...updates }));

    try {
      const id = studentProfile.id || studentProfile.email;
      await studentAPI.updateProfile(id, updates);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not update student profile in MongoDB:', err.message);
    }
  };

  const updateTeacher = async (updates) => {
    setTeacherProfile((prev) => ({ ...prev, ...updates }));

    try {
      const id = teacherProfile.id || teacherProfile.email;
      await teacherAPI.updateProfile(id, updates);
    } catch (err) {
      console.warn('[MongoDB Atlas Sync] Could not update teacher profile in MongoDB:', err.message);
    }
  };

  // ==========================================
  // Phase 9: Resume Management Operations
  // ==========================================

  const uploadResume = async (file) => {
    try {
      const res = await resumeAPI.upload(file);
      if (res && res.success && res.resume) {
        setStudentProfile((prev) => ({
          ...prev,
          resume: res.resume,
        }));
        return { success: true, resume: res.resume, message: res.message };
      }
      return res || { success: false, message: 'Upload failed' };
    } catch (err) {
      console.warn('uploadResume error:', err.message);
      return { success: false, message: err.message };
    }
  };

  const downloadMyResume = async () => {
    return resumeAPI.downloadMyResume();
  };

  const previewMyResume = async () => {
    return resumeAPI.previewMyResume();
  };

  const deleteResume = async () => {
    try {
      const res = await resumeAPI.delete();
      if (res && res.success) {
        setStudentProfile((prev) => {
          const next = { ...prev };
          delete next.resume;
          return next;
        });
        return { success: true };
      }
      return res;
    } catch (err) {
      console.warn('deleteResume error:', err.message);
      return { success: false, message: err.message };
    }
  };

  const refreshResumeInfo = async () => {
    try {
      const res = await resumeAPI.getInfo();
      if (res && res.success && res.resume) {
        setStudentProfile((prev) => ({
          ...prev,
          resume: res.resume,
        }));
      }
    } catch (err) {
      // Non-blocking
    }
  };

  // ==========================================
  // Phase 9: Teacher Export & Applicant Resumes
  // ==========================================

  const exportApplicantsExcel = async (filters) => {
    return exportAPI.exportExcel(filters);
  };

  const exportApplicantsPdf = async (filters) => {
    return exportAPI.exportPdf(filters);
  };

  const downloadApplicantResume = async (applicationId, studentName) => {
    return resumeAPI.downloadApplicantResume(applicationId, studentName);
  };

  const previewApplicantResume = async (applicationId) => {
    return resumeAPI.previewApplicantResume(applicationId);
  };

  // Reset demo data helper
  const resetDemoData = () => {
    setOpportunities(INITIAL_OPPORTUNITIES);
    setApplications(INITIAL_APPLICATIONS);
    setStudentProfile(INITIAL_STUDENT_PROFILE);
    setTeacherProfile(INITIAL_TEACHER_PROFILE);
    setSavedOpportunities(INITIAL_SAVED);
    setNotifications([]);
    localStorage.clear();
  };

  return (
    <ScholarContext.Provider
      value={{
        // Data
        opportunities,
        applications,
        studentProfile,
        teacherProfile,
        savedOpportunities,
        notifications,
        unreadNotificationsCount,
        unreadMessagesCount,
        refreshUnreadMessagesCount,
        dbStatus,
        isSyncing,
        syncWithDatabase,

        // Opportunity operations
        createOpportunity,
        closeOpportunity,
        updateOpportunity,
        deleteOpportunity,

        // Student application operations
        hasApplied,
        applyForOpportunity,
        updateApplicationStatus,
        updateBulkApplicationStatus,

        // Notifications operations
        markNotificationAsRead,
        markAllNotificationsAsRead,

        // Saved opportunities operations
        toggleSaveOpportunity,
        isSaved,

        // Profile updates
        updateStudent,
        updateTeacher,
        refreshVerificationStatus,

        // Phase 9: Resume Operations
        uploadResume,
        downloadMyResume,
        previewMyResume,
        deleteResume,
        refreshResumeInfo,

        // Phase 9: Teacher Export & Applicant Dossier
        exportApplicantsExcel,
        exportApplicantsPdf,
        downloadApplicantResume,
        previewApplicantResume,

        // Helper
        resetDemoData,
      }}
    >
      {children}
    </ScholarContext.Provider>
  );
}

export { useScholar } from './useScholar';
