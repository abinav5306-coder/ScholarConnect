import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

/**
 * High-performance In-Memory MongoDB Compatible Store
 * Automatically activates when MongoDB Atlas port 27017 is restricted by campus/firewall networks.
 * Keeps all Phase 1-9 application features 100% active, interactive, and functional.
 */

function matchQuery(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      const orMatched = val.some((subQuery) => matchQuery(doc, subQuery));
      if (!orMatched) return false;
      continue;
    }

    if (key === '$and') {
      const andMatched = val.every((subQuery) => matchQuery(doc, subQuery));
      if (!andMatched) return false;
      continue;
    }

    const docVal = doc[key];

    if (val && typeof val === 'object' && !(val instanceof ObjectId) && !(val instanceof Date)) {
      if ('$in' in val) {
        const inVals = val.$in.map((v) => (v instanceof ObjectId ? v.toString() : v));
        const currentVal = docVal instanceof ObjectId ? docVal.toString() : docVal;
        if (!inVals.includes(currentVal)) return false;
        continue;
      }
      if ('$ne' in val) {
        if (docVal === val.$ne) return false;
        continue;
      }
      if ('$regex' in val) {
        const regex = new RegExp(val.$regex, val.$options || 'i');
        if (!regex.test(String(docVal || ''))) return false;
        continue;
      }
      if ('$gte' in val) {
        if (!(docVal >= val.$gte)) return false;
        continue;
      }
      if ('$lte' in val) {
        if (!(docVal <= val.$lte)) return false;
        continue;
      }
    }

    if (val instanceof ObjectId) {
      if (!docVal || docVal.toString() !== val.toString()) return false;
      continue;
    }

    if (typeof docVal === 'string' && typeof val === 'string') {
      if (docVal.toLowerCase() !== val.toLowerCase()) return false;
      continue;
    }

    if (docVal !== val) return false;
  }

  return true;
}

function applyUpdate(doc, update) {
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      doc[k] = v;
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      doc[k] = (doc[k] || 0) + v;
    }
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(doc[k])) doc[k] = [];
      doc[k].push(v);
    }
  }
  return doc;
}

export class InMemoryCollection {
  constructor(name, initialDocs = []) {
    this.name = name;
    this.docs = [...initialDocs];
  }

  async findOne(query = {}, options = {}) {
    const found = this.docs.find((d) => matchQuery(d, query));
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  find(query = {}, options = {}) {
    const filtered = this.docs.filter((d) => matchQuery(d, query));
    let result = JSON.parse(JSON.stringify(filtered));

    const cursor = {
      _data: result,
      sort(sortObj) {
        if (!sortObj) return cursor;
        const [field, dir] = Object.entries(sortObj)[0] || [];
        if (field) {
          cursor._data.sort((a, b) => {
            const va = a[field] ?? '';
            const vb = b[field] ?? '';
            if (va < vb) return dir === -1 ? 1 : -1;
            if (va > vb) return dir === -1 ? -1 : 1;
            return 0;
          });
        }
        return cursor;
      },
      skip(count) {
        cursor._data = cursor._data.slice(count);
        return cursor;
      },
      limit(count) {
        cursor._data = cursor._data.slice(0, count);
        return cursor;
      },
      async toArray() {
        return cursor._data;
      },
    };

    return cursor;
  }

  async insertOne(doc) {
    const toInsert = {
      _id: doc._id || new ObjectId(),
      ...doc,
      createdAt: doc.createdAt || new Date(),
    };
    this.docs.push(toInsert);
    return { acknowledged: true, insertedId: toInsert._id };
  }

  async insertMany(docs) {
    const insertedIds = {};
    const createdDocs = docs.map((d, i) => {
      const _id = d._id || new ObjectId();
      insertedIds[i] = _id;
      return { _id, ...d, createdAt: d.createdAt || new Date() };
    });
    this.docs.push(...createdDocs);
    return { acknowledged: true, insertedIds, insertedCount: createdDocs.length };
  }

  async updateOne(query, update, options = {}) {
    const index = this.docs.findIndex((d) => matchQuery(d, query));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = { _id: new ObjectId(), ...(update.$setOnInsert || {}) };
        applyUpdate(newDoc, update);
        this.docs.push(newDoc);
        return { acknowledged: true, matchedCount: 0, modifiedCount: 1, upsertedId: newDoc._id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    applyUpdate(this.docs[index], update);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    let modifiedCount = 0;
    for (const doc of this.docs) {
      if (matchQuery(doc, query)) {
        applyUpdate(doc, update);
        modifiedCount++;
      }
    }
    return { acknowledged: true, matchedCount: modifiedCount, modifiedCount };
  }

  async deleteOne(query) {
    const index = this.docs.findIndex((d) => matchQuery(d, query));
    if (index !== -1) {
      this.docs.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(query) {
    const initialLen = this.docs.length;
    this.docs = this.docs.filter((d) => !matchQuery(d, query));
    const deletedCount = initialLen - this.docs.length;
    return { acknowledged: true, deletedCount };
  }

  async countDocuments(query = {}) {
    return this.docs.filter((d) => matchQuery(d, query)).length;
  }

  async distinct(field, query = {}) {
    const filtered = this.docs.filter((d) => matchQuery(d, query));
    const set = new Set();
    for (const doc of filtered) {
      const val = doc[field];
      if (Array.isArray(val)) {
        val.forEach((v) => set.add(v));
      } else if (val !== undefined && val !== null) {
        set.add(val);
      }
    }
    return Array.from(set);
  }

  aggregate(pipeline = []) {
    let result = [...this.docs];
    for (const stage of pipeline) {
      if (stage.$match) {
        result = result.filter((d) => matchQuery(d, stage.$match));
      }
      if (stage.$sort) {
        const [field, dir] = Object.entries(stage.$sort)[0] || [];
        if (field) {
          result.sort((a, b) => {
            const va = a[field] ?? '';
            const vb = b[field] ?? '';
            return va < vb ? (dir === -1 ? 1 : -1) : va > vb ? (dir === -1 ? -1 : 1) : 0;
          });
        }
      }
      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
    }

    return {
      async toArray() {
        return JSON.parse(JSON.stringify(result));
      },
    };
  }
}

let inMemoryStore = null;

export function getInMemoryStore() {
  if (inMemoryStore) return inMemoryStore;

  const demoTeacherId = new ObjectId('6aea2d7ac41b2188f4a03aee');
  const demoStudentId = new ObjectId('6aea2d7ac41b2188f4a03aef');
  const userStudentId = new ObjectId('6aea2d7ac41b2188f4a03aed');
  const demoAdminId = new ObjectId('6aea2d7ac41b2188f4a03af0');

  // Pre-hashed passwords
  const studentHash = bcrypt.hashSync('Abinav1947', 10);
  const alexHash = bcrypt.hashSync('student123', 10);
  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const adminHash = bcrypt.hashSync('adminpassword123', 10);

  const initialUsers = [
    {
      _id: userStudentId,
      name: 'Abinav Saran PN',
      fullName: 'Abinav Saran PN',
      email: 'abinav5306@gmail.com',
      passwordHash: studentHash,
      role: 'student',
      emailVerified: true,
      verificationStatus: 'Verified',
      institution: 'Stanford University',
      department: 'Computer Science & Engineering',
      degree: 'B.Tech in Artificial Intelligence',
      academicYear: 'Third Year',
      graduationYear: '2027',
      gpa: '3.92',
      skills: ['Python', 'React', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Node.js'],
      researchInterests: ['Biomedical AI', 'Computer Vision', 'Generative Models', 'Healthcare ML'],
      linkedin: 'https://linkedin.com/in/abinav-saran',
      github: 'https://github.com/abinav5306-coder',
      portfolioUrl: 'https://scholarconnect.edu/portfolio/abinav',
      programmingLanguages: ['JavaScript', 'Python', 'TypeScript', 'C++'],
      projects: [
        {
          title: 'ScholarConnect Academic Platform',
          description: 'A full-stack research portal bridging students and faculty mentors with automated notifications and real-time messaging.',
          technologies: ['React', 'Node.js', 'MongoDB', 'Socket.IO'],
          projectUrl: 'https://github.com/abinav5306-coder/ScholarConnect',
        },
      ],
      certifications: [
        {
          name: 'Deep Learning Specialization',
          issuer: 'DeepLearning.AI',
          issueDate: '2025-08-15',
          credentialUrl: 'https://coursera.org/verify/dl-specialization',
        },
      ],
      achievements: ['Published paper in Undergraduate AI Symposium 2025', 'First place in University Hackathon 2024'],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date(),
    },
    {
      _id: demoStudentId,
      name: 'Alex Johnson',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@university.edu',
      passwordHash: alexHash,
      role: 'student',
      emailVerified: true,
      verificationStatus: 'Verified',
      institution: 'Stanford University',
      department: 'Computer Science & Engineering',
      academicYear: 'Third Year',
      createdAt: new Date('2026-01-01'),
    },
    {
      _id: demoTeacherId,
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.kumar@abc.edu',
      passwordHash: teacherHash,
      role: 'teacher',
      emailVerified: true,
      verificationStatus: 'Verified',
      title: 'Associate Professor & Principal Investigator',
      institution: 'ABC University',
      department: 'School of Artificial Intelligence',
      labName: 'Biomedical AI Research Lab',
      createdAt: new Date('2026-01-01'),
    },
    {
      _id: demoAdminId,
      name: 'ScholarConnect Verification Officer',
      email: 'admin@scholarconnect.edu',
      passwordHash: adminHash,
      role: 'admin',
      emailVerified: true,
      verificationStatus: 'Verified',
      institution: 'ScholarConnect Central Authority',
      department: 'Academic Verification Board',
      createdAt: new Date('2026-01-01'),
    },
  ];

  const opp1Id = new ObjectId('6aea2d7ac41b2188f4a03b01');
  const opp2Id = new ObjectId('6aea2d7ac41b2188f4a03b02');
  const opp3Id = new ObjectId('6aea2d7ac41b2188f4a03b03');

  const initialOpportunities = [
    {
      _id: opp1Id,
      title: 'Quantum Information & Bio-Molecular Simulation Lab',
      description: 'Collaborative cross-institutional research exploring quantum algorithmic modeling for complex protein folding dynamics and targeted molecular interaction simulations.',
      facultyId: demoTeacherId,
      facultyName: 'Dr. Ramesh Kumar',
      institution: 'ABC University & Stanford Research',
      department: 'Quantum Computing & Biophysics',
      location: 'Hybrid / On-Campus Lab',
      type: 'Research Internship',
      domain: 'Quantum Computing',
      duration: '6 Months',
      stipend: '₹28,000 / month',
      openings: 3,
      status: 'Open',
      requiredSkills: ['Python', 'Quantum Information', 'Qiskit', 'Linear Algebra', 'PyTorch'],
      prerequisites: 'Strong foundation in linear algebra and python programming. Familiarity with quantum circuit simulators preferred.',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    {
      _id: opp2Id,
      title: 'Multi-Modal Computer Vision for Autonomous Medical Diagnostics',
      description: 'Design and benchmark state-of-the-art vision transformers (ViTs) and multimodal diffusion architectures for real-time surgical computer vision and MRI anomaly segmentation.',
      facultyId: demoTeacherId,
      facultyName: 'Dr. Ramesh Kumar',
      institution: 'School of Artificial Intelligence',
      department: 'Computer Science & AI',
      location: 'Remote',
      type: 'Fellowship',
      domain: 'Artificial Intelligence',
      duration: '4 Months',
      stipend: '₹32,000 / month',
      openings: 2,
      status: 'Open',
      requiredSkills: ['Computer Vision', 'PyTorch', 'Transformers', 'OpenCV'],
      prerequisites: 'Experience with deep learning frameworks and image classification pipelines.',
      applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
    {
      _id: opp3Id,
      title: 'Edge AI & Wearable Telemetry for Continuous Patient Monitoring',
      description: 'Developing ultra-low power neural network architectures deployable on microcontrollers for real-time anomaly detection in continuous ECG and photoplethysmography (PPG) streams.',
      facultyId: demoTeacherId,
      facultyName: 'Dr. Ramesh Kumar',
      institution: 'ABC University',
      department: 'Biomedical Engineering',
      location: 'On-Campus',
      type: 'Research Assistantship',
      domain: 'Internet of Things',
      duration: '1 Year',
      stipend: '₹25,000 / month',
      openings: 4,
      status: 'Open',
      requiredSkills: ['Embedded C', 'TinyML', 'Edge AI', 'Signal Processing'],
      prerequisites: 'Coursework in digital signal processing and embedded microcontrollers.',
      applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    },
  ];

  const initialApplications = [
    {
      _id: new ObjectId('6aea2d7ac41b2188f4a03c01'),
      opportunityId: opp1Id,
      studentId: userStudentId,
      teacherId: demoTeacherId,
      studentName: 'Abinav Saran PN',
      studentEmail: 'abinav5306@gmail.com',
      studentInstitution: 'Stanford University',
      studentDepartment: 'Computer Science & Engineering',
      studentAcademicYear: 'Third Year',
      opportunityTitle: 'Quantum Information & Bio-Molecular Simulation Lab',
      coverLetter: 'I am deeply enthusiastic about quantum algorithms and biological simulations. Having built deep learning pipelines in PyTorch and explored quantum simulation frameworks, I am eager to contribute to the lab.',
      status: 'UNDER REVIEW',
      resumeAttachment: {
        originalName: 'Abinav_Saran_Resume.pdf',
        mimeType: 'application/pdf',
        size: 1420580,
        uploadedAt: new Date(),
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
  ];

  const initialNotifications = [
    {
      _id: new ObjectId(),
      userId: userStudentId,
      recipientId: userStudentId,
      title: 'Welcome to ScholarConnect',
      message: 'Your academic profile has been verified. You can now explore research opportunities and connect with faculty mentors.',
      type: 'VERIFICATION',
      isRead: false,
      createdAt: new Date(),
    },
    {
      _id: new ObjectId(),
      userId: userStudentId,
      recipientId: userStudentId,
      title: 'Application Under Review',
      message: 'Your application for "Quantum Information & Bio-Molecular Simulation Lab" is currently under review by Dr. Ramesh Kumar.',
      type: 'APPLICATION',
      isRead: false,
      createdAt: new Date(Date.now() - 3600 * 1000),
    },
  ];

  inMemoryStore = {
    users: new InMemoryCollection('users', initialUsers),
    opportunities: new InMemoryCollection('opportunities', initialOpportunities),
    applications: new InMemoryCollection('applications', initialApplications),
    messages: new InMemoryCollection('messages', []),
    notifications: new InMemoryCollection('notifications', initialNotifications),
    otpVerifications: new InMemoryCollection('otp_verifications', []),
    verificationAudits: new InMemoryCollection('verification_audits', []),
    emailLogs: new InMemoryCollection('email_logs', []),
  };

  return inMemoryStore;
}
