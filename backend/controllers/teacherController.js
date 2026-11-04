import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

/**
 * Get Teacher Profile by ID or Email
 * GET /api/teachers/:id
 */
export async function getTeacherProfile(req, res) {
  try {
    const { id } = req.params;
    const { users } = getCollections();

    let query = { role: 'teacher' };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ email: id.toLowerCase() }, { teacherId: id }];
    }

    const teacher = await users.findOne(query);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found.',
      });
    }

    const { passwordHash, ...safeTeacher } = teacher;
    return res.status(200).json({
      success: true,
      teacher: {
        id: teacher._id.toString(),
        ...safeTeacher,
      },
    });
  } catch (error) {
    console.error('getTeacherProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve teacher profile.',
      error: error.message,
    });
  }
}

/**
 * Update Teacher Profile
 * PUT /api/teachers/:id
 */
export async function updateTeacherProfile(req, res) {
  try {
    const { id } = req.params;
    const { users } = getCollections();

    const {
      name,
      fullName,
      title,
      institution,
      department,
      labName,
      officeLocation,
      bio,
      researchInterests,
      publications,
      linkedin,
      googleScholar,
      website,
    } = req.body;

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = {
        $or: [
          { email: id.toLowerCase() },
          { id: id },
          { teacherId: id },
        ],
      };
    }

    const updateFields = {
      updatedAt: new Date(),
    };

    if (name || fullName) updateFields.name = (fullName || name).trim();
    if (title !== undefined) updateFields.title = title.trim();
    if (institution !== undefined) updateFields.institution = institution.trim();
    if (department !== undefined) updateFields.department = department.trim();
    if (labName !== undefined) updateFields.labName = labName.trim();
    if (officeLocation !== undefined) updateFields.officeLocation = officeLocation.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (linkedin !== undefined) updateFields.linkedin = linkedin.trim();
    if (googleScholar !== undefined) updateFields.googleScholar = googleScholar.trim();
    if (website !== undefined) updateFields.website = website.trim();
    if (researchInterests !== undefined) {
      updateFields.researchInterests = Array.isArray(researchInterests)
        ? researchInterests
        : typeof researchInterests === 'string'
        ? researchInterests.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (publications !== undefined) {
      updateFields.publications = Array.isArray(publications) ? publications : [];
    }

    const result = await users.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found to update.',
      });
    }

    const { passwordHash, ...safeTeacher } = result;

    return res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully.',
      teacher: {
        id: result._id.toString(),
        ...safeTeacher,
      },
    });
  } catch (error) {
    console.error('updateTeacherProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update teacher profile.',
      error: error.message,
    });
  }
}

