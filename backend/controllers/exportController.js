import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

/**
 * Helper to fetch and filter applications for an authorized teacher
 */
async function getFilteredApplicantsForTeacher(user, filters = {}) {
  const { applications, opportunities, users } = getCollections();
  const userId = user.userId;
  const userEmail = (user.email || '').toLowerCase().trim();
  const isAdmin = user.role === 'admin';

  // 1. Find opportunities owned by this teacher
  let teacherOppQuery = {};
  if (!isAdmin) {
    teacherOppQuery = {
      $or: [
        { teacherId: userId },
        { teacherId: String(userId) },
        { teacherEmail: userEmail },
      ],
    };
  }

  const teacherOpps = await opportunities.find(teacherOppQuery).toArray();
  const teacherOppIds = teacherOpps.map((o) => (o._id ? o._id.toString() : o.id));
  const oppMap = new Map();
  teacherOpps.forEach((o) => {
    oppMap.set(o._id ? o._id.toString() : o.id, o);
    if (o.id) oppMap.set(o.id, o);
  });

  // 2. Build application query
  const query = {};

  if (!isAdmin) {
    query.$or = [
      { opportunityId: { $in: teacherOppIds } },
      { teacherId: userId },
      { teacherId: String(userId) },
      { teacherEmail: userEmail },
    ];
  }

  // Filter: specific applicant IDs (e.g. from table selection or visible filtered set)
  if (Array.isArray(filters.applicantIds) && filters.applicantIds.length > 0) {
    const objIds = filters.applicantIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const strIds = filters.applicantIds.map((id) => String(id));
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { _id: { $in: objIds } },
        { id: { $in: strIds } },
      ],
    });
  }

  // Filter: specific opportunity
  if (filters.opportunityId && filters.opportunityId !== 'All') {
    query.opportunityId = String(filters.opportunityId);
  }

  // Filter: status
  if (filters.status && filters.status !== 'All Statuses') {
    query.status = filters.status;
  }

  // Filter: department
  if (filters.department && filters.department !== 'All Departments') {
    query.$or = query.$or || [];
    const deptRegex = new RegExp(filters.department.trim(), 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { studentDepartment: deptRegex },
        { department: deptRegex },
      ],
    });
  }

  // Filter: academic year
  if (filters.academicYear && filters.academicYear !== 'All Years') {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { studentAcademicYear: filters.academicYear },
        { academicYear: filters.academicYear },
      ],
    });
  }

  // Filter: institution
  if (filters.institution && filters.institution !== 'All Institutions') {
    const instRegex = new RegExp(filters.institution.trim(), 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { studentInstitution: instRegex },
        { institution: instRegex },
      ],
    });
  }

  const rawApplicants = await applications.find(query).sort({ createdAt: -1 }).toArray();

  // Filter by skills in memory (since skills can be array of strings)
  let filtered = rawApplicants;
  if (filters.skills && filters.skills !== 'All Skills') {
    const targetSkill = String(filters.skills).toLowerCase().trim();
    filtered = rawApplicants.filter((app) => {
      const skillsArr = Array.isArray(app.studentSkills || app.skills)
        ? (app.studentSkills || app.skills)
        : (app.studentSkills || app.skills || '').split(',').map((s) => s.trim());
      return skillsArr.some((s) => String(s).toLowerCase().includes(targetSkill));
    });
  }

  // Enrich student data from users collection (e.g. registerNumber, portfolioUrl, etc.)
  const studentEmails = filtered.map((a) => (a.studentEmail || a.email || '').toLowerCase()).filter(Boolean);
  const studentUsers = await users.find({ email: { $in: studentEmails } }).toArray();
  const userMap = new Map();
  studentUsers.forEach((u) => {
    userMap.set(u.email.toLowerCase(), u);
  });

  const enrichedApplicants = filtered.map((app) => {
    const userEmail = (app.studentEmail || app.email || '').toLowerCase();
    const studentUser = userMap.get(userEmail) || {};
    const opp = oppMap.get(app.opportunityId) || {};

    const skillsArr = Array.isArray(app.studentSkills || app.skills || studentUser.skills)
      ? (app.studentSkills || app.skills || studentUser.skills)
      : [];

    const interestsArr = Array.isArray(studentUser.researchInterests)
      ? studentUser.researchInterests
      : [];

    return {
      id: app._id ? app._id.toString() : app.id,
      studentName: app.studentName || app.fullName || studentUser.name || 'Student Applicant',
      studentEmail: app.studentEmail || app.email || studentUser.email || '',
      institution: app.studentInstitution || app.institution || studentUser.institution || '',
      department: app.studentDepartment || app.department || studentUser.department || '',
      academicYear: app.studentAcademicYear || app.academicYear || studentUser.academicYear || '',
      registerNumber: studentUser.registerNumber || studentUser.studentId || 'N/A',
      opportunityTitle: app.opportunityTitle || opp.title || 'Academic Opportunity',
      applicationDate: app.appliedAt || (app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : ''),
      status: app.status || 'Submitted',
      resumeAttached: app.resume && app.resume.fileName ? 'Yes' : 'No',
      resumeFileName: app.resume ? app.resume.originalName : null,
      skills: skillsArr.join(', '),
      researchInterests: interestsArr.join(', '),
      linkedin: app.linkedin || studentUser.linkedin || '',
      github: app.github || studentUser.github || '',
      portfolioUrl: app.portfolioUrl || studentUser.portfolioUrl || '',
      statementOfInterest: app.statementOfInterest || app.whyInterested || '',
    };
  });

  return {
    applicants: enrichedApplicants,
    totalCount: enrichedApplicants.length,
    teacher: user,
  };
}

/**
 * Export Filtered Applicants to Excel (.xlsx)
 * POST /api/teachers/export/excel
 */
export async function exportApplicantsExcel(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const filters = req.body || {};
    const { applicants, teacher } = await getFilteredApplicantsForTeacher(user, filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ScholarConnect Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Applicants Dossier', {
      views: [{ showGridLines: true }],
    });

    // 1. Title Banner Row
    worksheet.mergeCells('A1:P1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'SCHOLARCONNECT ACADEMIC COLLABORATION PLATFORM — APPLICANT DOSSIER REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }, // Teal 700
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // 2. Metadata Sub-header
    worksheet.mergeCells('A2:P2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Faculty Mentor: ${teacher.name || teacher.email} | Export Date: ${new Date().toLocaleDateString()} | Total Filtered Candidates: ${applicants.length}`;
    metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0FDFA' }, // Teal 50
    };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 22;

    // Blank row
    worksheet.getRow(3).height = 10;

    // 3. Table Column Headers
    const headers = [
      { header: '#', key: 'index', width: 6 },
      { header: 'Student Name', key: 'studentName', width: 22 },
      { header: 'Student Email', key: 'studentEmail', width: 26 },
      { header: 'Institution', key: 'institution', width: 24 },
      { header: 'Department', key: 'department', width: 22 },
      { header: 'Academic Year', key: 'academicYear', width: 16 },
      { header: 'Register No.', key: 'registerNumber', width: 15 },
      { header: 'Opportunity Title', key: 'opportunityTitle', width: 28 },
      { header: 'Application Status', key: 'status', width: 18 },
      { header: 'Applied Date', key: 'applicationDate', width: 14 },
      { header: 'Resume Attached', key: 'resumeAttached', width: 16 },
      { header: 'Technical Skills', key: 'skills', width: 28 },
      { header: 'Research Interests', key: 'researchInterests', width: 28 },
      { header: 'LinkedIn URL', key: 'linkedin', width: 24 },
      { header: 'GitHub URL', key: 'github', width: 24 },
      { header: 'Portfolio URL', key: 'portfolioUrl', width: 24 },
    ];

    const headerRow = worksheet.getRow(4);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h.header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF0F766E' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      worksheet.getColumn(i + 1).width = h.width;
    });
    headerRow.height = 26;

    // 4. Data Rows
    applicants.forEach((app, idx) => {
      const rowIdx = idx + 5;
      const row = worksheet.getRow(rowIdx);
      const isEven = idx % 2 === 0;

      const rowValues = [
        idx + 1,
        app.studentName,
        app.studentEmail,
        app.institution,
        app.department,
        app.academicYear,
        app.registerNumber,
        app.opportunityTitle,
        app.status,
        app.applicationDate,
        app.resumeAttached,
        app.skills,
        app.researchInterests,
        app.linkedin,
        app.github,
        app.portfolioUrl,
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colIdx === 0 || colIdx === 8 || colIdx === 9 || colIdx === 10 ? 'center' : 'left',
          wrapText: colIdx === 11 || colIdx === 12,
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Status coloring
        if (colIdx === 8) {
          if (val === 'Selected') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF6B21A8' } };
          } else if (val === 'Shortlisted') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
          } else if (val === 'Waiting List') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };
          }
        }
      });
      row.height = 22;
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ScholarConnect_Applicants_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportApplicantsExcel error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Excel report.', error: err.message });
  }
}

/**
 * Export Filtered Applicants to PDF Report
 * POST /api/teachers/export/pdf
 */
export async function exportApplicantsPdf(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const filters = req.body || {};
    const { applicants, teacher } = await getFilteredApplicantsForTeacher(user, filters);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: 'ScholarConnect Applicant Dossier Report',
        Author: 'ScholarConnect Platform',
        Subject: 'Faculty Applicant Review Dossier',
      },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ScholarConnect_Applicants_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Color Palette
    const primaryColor = '#0F766E'; // Teal 700
    const slateDark = '#0F172A'; // Slate 900
    const slateMuted = '#64748B'; // Slate 500
    const borderLight = '#E2E8F0'; // Slate 200

    // Header Banner
    doc.rect(40, 40, 515, 65).fill('#F0FDFA').stroke(primaryColor);

    doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
      .text('ScholarConnect', 55, 52);
    
    doc.fillColor(slateMuted).fontSize(8).font('Helvetica')
      .text('Academic Collaboration & Research Gateway', 55, 70);

    doc.fillColor(slateDark).fontSize(12).font('Helvetica-Bold')
      .text('APPLICANT DOSSIER & SELECTION REPORT', 260, 52, { align: 'right', width: 280 });

    doc.fillColor(slateMuted).fontSize(8).font('Helvetica')
      .text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 260, 70, { align: 'right', width: 280 });

    doc.fillColor(slateMuted).fontSize(8).font('Helvetica')
      .text(`Faculty Mentor: ${teacher.name || teacher.email}`, 260, 82, { align: 'right', width: 280 });

    doc.y = 120;

    // Status Summary Statistics Bar
    const statusCounts = applicants.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    doc.rect(40, doc.y, 515, 36).fill('#F8FAFC').stroke(borderLight);
    doc.fillColor(slateDark).fontSize(9).font('Helvetica-Bold')
      .text(`Summary Overview (${applicants.length} Total Filtered Applicants):`, 50, doc.y + 12);

    let summaryX = 300;
    const statsOrder = ['Selected', 'Shortlisted', 'Waiting List', 'Submitted', 'Not Selected'];
    statsOrder.forEach((st) => {
      const count = statusCounts[st] || 0;
      if (count > 0 && summaryX < 530) {
        doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
          .text(`${st}: ${count}   `, summaryX, doc.y - 1);
        summaryX += 55;
      }
    });

    doc.y += 50;

    // Applicants List
    if (applicants.length === 0) {
      doc.fillColor(slateMuted).fontSize(10).font('Helvetica-Oblique')
        .text('No applicants match the current filter selection.', 50, doc.y, { align: 'center' });
    } else {
      applicants.forEach((app, idx) => {
        // Multi-page handling check
        if (doc.y > 680) {
          doc.addPage();
          doc.y = 45;
        }

        const startY = doc.y;

        // Card Container
        doc.roundedRect(40, startY, 515, 115, 6).fill('#FFFFFF').stroke(borderLight);

        // Header inside card
        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
          .text(`${idx + 1}. ${app.studentName}`, 52, startY + 10);

        // Status pill
        doc.rect(430, startY + 8, 110, 18).fill('#F1F5F9').stroke('#CBD5E1');
        doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold')
          .text(`Status: ${app.status}`, 435, startY + 13, { width: 100, align: 'center' });

        // Academic & Contact details
        doc.fillColor(slateMuted).fontSize(8.5).font('Helvetica')
          .text(`Email: ${app.studentEmail}  |  Dept: ${app.department}  |  Year: ${app.academicYear}`, 52, startY + 28);
        doc.text(`Institution: ${app.institution}  |  Target Opportunity: ${app.opportunityTitle}`, 52, startY + 41);

        // Skills & Interests
        doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold')
          .text('Technical Skills: ', 52, startY + 56, { continued: true })
          .font('Helvetica').fillColor(slateMuted).text(app.skills || 'None specified');

        // Resume status & Portfolio links
        const resumeStatus = app.resumeAttached === 'Yes' ? `Attached (${app.resumeFileName || 'PDF'})` : 'Not Attached';
        doc.fillColor(slateDark).fontSize(8).font('Helvetica-Bold')
          .text('Resume: ', 52, startY + 70, { continued: true })
          .font('Helvetica').fillColor(app.resumeAttached === 'Yes' ? '#0F766E' : slateMuted).text(`${resumeStatus}   `)
          .font('Helvetica-Bold').fillColor(slateDark).text('Links: ', { continued: true })
          .font('Helvetica').fillColor('#2563EB')
          .text(`${app.linkedin ? 'LinkedIn  ' : ''}${app.github ? 'GitHub  ' : ''}${app.portfolioUrl ? 'Portfolio' : ''}`);

        // Statement of interest excerpt
        if (app.statementOfInterest) {
          const excerpt = app.statementOfInterest.length > 120
            ? app.statementOfInterest.slice(0, 120) + '...'
            : app.statementOfInterest;
          doc.fillColor(slateDark).fontSize(7.5).font('Helvetica-Oblique')
            .text(`" ${excerpt} "`, 52, startY + 86, { width: 490 });
        }

        doc.y = startY + 125;
      });
    }

    // Add page numbers and footers across all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.rect(40, 785, 515, 0.5).fill('#CBD5E1');
      doc.fillColor(slateMuted).fontSize(7.5).font('Helvetica')
        .text(
          `ScholarConnect Academic Systems — Page ${i + 1} of ${range.count}`,
          40,
          795,
          { align: 'center', width: 515 }
        );
    }

    doc.end();
  } catch (err) {
    console.error('exportApplicantsPdf error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF report.', error: err.message });
  }
}

