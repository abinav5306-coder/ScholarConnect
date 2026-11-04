import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

/**
 * URL Validator Helper for Security & Integrity
 */
export function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return true;
  const trimmed = string.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get Student Profile by ID or Email
 * GET /api/students/:id
 */
export async function getStudentProfile(req, res) {
  try {
    const { id } = req.params;
    const { users } = getCollections();

    let query = { role: 'student' };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ email: id.toLowerCase() }, { studentId: id }];
    }

    const student = await users.findOne(query);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    // Exclude passwordHash from response
    const { passwordHash, ...safeStudent } = student;
    return res.status(200).json({
      success: true,
      student: {
        id: student._id.toString(),
        ...safeStudent,
      },
    });
  } catch (error) {
    console.error('getStudentProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile.',
      error: error.message,
    });
  }
}

/**
 * Update Student Profile & Extended Portfolio Information
 * PUT /api/students/:id
 */
export async function updateStudentProfile(req, res) {
  try {
    const { id } = req.params;
    const { users } = getCollections();

    const {
      name,
      fullName,
      institution,
      department,
      degree,
      academicYear,
      graduationYear,
      skills,
      technicalSkills,
      programmingLanguages,
      researchInterests,
      linkedin,
      github,
      portfolioUrl,
      bio,
      previousProjects,
      projects,
      certifications,
      achievements,
      gpa,
    } = req.body;

    // Validate Portfolio and Social URLs
    if (linkedin && !isValidHttpUrl(linkedin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid LinkedIn URL format. Must start with http:// or https://',
      });
    }

    if (github && !isValidHttpUrl(github)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub URL format. Must start with http:// or https://',
      });
    }

    if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Portfolio URL format. Must start with http:// or https://',
      });
    }

    // Validate Project URLs if provided
    const projectList = Array.isArray(projects || previousProjects) ? (projects || previousProjects) : [];
    for (const proj of projectList) {
      if (proj.liveUrl && !isValidHttpUrl(proj.liveUrl)) {
        return res.status(400).json({
          success: false,
          message: `Invalid Live Demo URL format for project "${proj.title}". Must start with http:// or https://`,
        });
      }
      if (proj.githubUrl && !isValidHttpUrl(proj.githubUrl)) {
        return res.status(400).json({
          success: false,
          message: `Invalid GitHub URL format for project "${proj.title}". Must start with http:// or https://`,
        });
      }
      if (proj.link && !isValidHttpUrl(proj.link)) {
        return res.status(400).json({
          success: false,
          message: `Invalid link format for project "${proj.title}". Must start with http:// or https://`,
        });
      }
    }

    // Validate Certification URLs if provided
    const certList = Array.isArray(certifications) ? certifications : [];
    for (const cert of certList) {
      if (cert.credentialUrl && !isValidHttpUrl(cert.credentialUrl)) {
        return res.status(400).json({
          success: false,
          message: `Invalid credential URL format for certification "${cert.name}". Must start with http:// or https://`,
        });
      }
    }

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = {
        $or: [
          { email: id.toLowerCase() },
          { id: id },
          { studentId: id },
        ],
      };
    }

    const updateFields = {
      updatedAt: new Date(),
    };

    if (name || fullName) updateFields.name = (fullName || name).trim();
    if (fullName) updateFields.fullName = fullName.trim();
    if (institution !== undefined) updateFields.institution = institution.trim();
    if (department !== undefined) updateFields.department = department.trim();
    if (degree !== undefined) updateFields.degree = degree.trim();
    if (academicYear !== undefined) updateFields.academicYear = academicYear.trim();
    if (graduationYear !== undefined) updateFields.graduationYear = graduationYear;

    // Skills & Technical Skills
    if (skills !== undefined || technicalSkills !== undefined) {
      const mergedSkills = Array.isArray(skills || technicalSkills)
        ? (skills || technicalSkills)
        : [];
      updateFields.skills = mergedSkills;
      updateFields.technicalSkills = mergedSkills;
    }

    // Programming Languages
    if (programmingLanguages !== undefined) {
      updateFields.programmingLanguages = Array.isArray(programmingLanguages)
        ? programmingLanguages
        : typeof programmingLanguages === 'string'
        ? programmingLanguages.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // Research Interests
    if (researchInterests !== undefined) {
      updateFields.researchInterests = Array.isArray(researchInterests)
        ? researchInterests
        : typeof researchInterests === 'string'
        ? researchInterests.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // Social & Portfolio URLs
    if (linkedin !== undefined) updateFields.linkedin = linkedin.trim();
    if (github !== undefined) updateFields.github = github.trim();
    if (portfolioUrl !== undefined) updateFields.portfolioUrl = portfolioUrl.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (gpa !== undefined) updateFields.gpa = gpa;

    // Projects
    if (projects !== undefined || previousProjects !== undefined) {
      updateFields.projects = projectList;
      updateFields.previousProjects = projectList;
    }

    // Certifications
    if (certifications !== undefined) {
      updateFields.certifications = certList;
    }

    // Achievements
    if (achievements !== undefined) {
      updateFields.achievements = Array.isArray(achievements) ? achievements : [];
    }

    const result = await users.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found to update.',
      });
    }

    const { passwordHash, ...safeStudent } = result;

    return res.status(200).json({
      success: true,
      message: 'Student profile and portfolio information updated successfully.',
      student: {
        id: result._id.toString(),
        ...safeStudent,
      },
    });
  } catch (error) {
    console.error('updateStudentProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student profile.',
      error: error.message,
    });
  }
}
