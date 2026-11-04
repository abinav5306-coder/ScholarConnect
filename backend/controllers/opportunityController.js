import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import {
  notifyRelevantStudentsOfOpportunity,
  notifyApplicantsOfOpportunityClosed,
} from '../services/notificationEmailService.js';

/**
 * Create a new Opportunity
 * POST /api/opportunities
 */
export async function createOpportunity(req, res) {
  try {
    const {
      title,
      category = 'Research Project',
      shortDescription = '',
      description = '',
      detailedDescription = '',
      objectives = '',
      researchObjectives = '',
      requiredSkills = [],
      skills = [],
      eligibleYears = [],
      eligibilityYears = [],
      eligibleDegrees = ['All Degrees'],
      eligibleDepartments = '',
      positions = 1,
      participationType = 'Individual',
      institution = '',
      department = '',
      duration = '',
      workMode = 'Hybrid',
      deadline,
      startDate = '',
      benefits = '',
      instructions = '',
      teacherId,
      teacherName,
      teacherEmail,
      status = 'Accepting Applications',
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Opportunity title is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Opportunity category is required.' });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, message: 'Application deadline is required.' });
    }

    const { opportunities, users } = getCollections();

    // Determine teacher identification
    const resolvedTeacherId = req.user?.userId || teacherId || 'teacher-default';
    const resolvedTeacherName = req.user?.name || teacherName || 'Faculty Mentor';
    const resolvedTeacherEmail = req.user?.email || teacherEmail || 'faculty@university.edu';

    // Verify faculty academic identity before publishing
    if (resolvedTeacherId && resolvedTeacherId !== 'teacher-default') {
      let teacherQuery = {};
      if (ObjectId.isValid(resolvedTeacherId)) {
        teacherQuery = { _id: new ObjectId(resolvedTeacherId) };
      } else {
        teacherQuery = { $or: [{ email: resolvedTeacherEmail }, { id: resolvedTeacherId }] };
      }

      const teacherDoc = await users.findOne(teacherQuery);
      if (teacherDoc && teacherDoc.role === 'teacher' && teacherDoc.verificationStatus !== 'Verified') {
        return res.status(403).json({
          success: false,
          code: 'UNVERIFIED_TEACHER',
          message: 'Only verified faculty members can publish research opportunities. Please complete Academic Identity Verification in your profile.',
          verificationStatus: teacherDoc.verificationStatus || 'Not Submitted',
        });
      }
    }

    const mergedSkills = skills && skills.length > 0 ? skills : requiredSkills;
    const mergedYears = eligibilityYears && eligibilityYears.length > 0 ? eligibilityYears : eligibleYears;

    const newOpportunity = {
      title: title.trim(),
      category,
      shortDescription: shortDescription.trim() || description.trim().slice(0, 160),
      description: (detailedDescription || description || '').trim(),
      detailedDescription: (detailedDescription || description || '').trim(),
      objectives: (researchObjectives || objectives || '').trim(),
      researchObjectives: (researchObjectives || objectives || '').trim(),
      requiredSkills: Array.isArray(mergedSkills) ? mergedSkills : [],
      skills: Array.isArray(mergedSkills) ? mergedSkills : [],
      eligibleYears: Array.isArray(mergedYears) ? mergedYears : ['All Years'],
      eligibilityYears: Array.isArray(mergedYears) ? mergedYears : ['All Years'],
      eligibleDegrees: Array.isArray(eligibleDegrees) ? eligibleDegrees : ['All Degrees'],
      eligibleDepartments: eligibleDepartments || '',
      positions: Number(positions) || 1,
      participationType: participationType || 'Individual',
      institution: institution || 'Academic Institution',
      department: department || 'Department',
      duration: duration || 'Not specified',
      workMode: workMode || 'Hybrid',
      deadline,
      startDate: startDate || '',
      benefits: benefits || '',
      instructions: instructions || '',
      teacherId: resolvedTeacherId,
      teacherName: resolvedTeacherName,
      teacherEmail: resolvedTeacherEmail,
      status: status || 'Accepting Applications',
      applicantsCount: 0,
      postedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await opportunities.insertOne(newOpportunity);
    newOpportunity._id = result.insertedId.toString();
    newOpportunity.id = result.insertedId.toString();

    // Dispatch opportunity announcements to matching verified students (Asynchronous / Non-blocking)
    notifyRelevantStudentsOfOpportunity({
      opportunityId: newOpportunity.id,
      opportunityTitle: newOpportunity.title,
      category: newOpportunity.category,
      institution: newOpportunity.institution,
      teacherName: newOpportunity.teacherName,
      requiredSkills: newOpportunity.skills,
      eligibilityYears: newOpportunity.eligibilityYears,
      department: newOpportunity.department,
      deadline: newOpportunity.deadline,
      shortDescription: newOpportunity.shortDescription,
    }).catch((err) => console.warn('[Opportunity Announcement Notice]:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Opportunity published successfully!',
      opportunity: newOpportunity,
    });
  } catch (err) {
    console.error('Error creating opportunity:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create opportunity.',
      error: err.message,
    });
  }
}

/**
 * Retrieve Opportunities with search, category, and eligibility filtering
 * GET /api/opportunities
 */
export async function getOpportunities(req, res) {
  try {
    const {
      search,
      category,
      institution,
      skill,
      year,
      status,
      teacherId,
      includeClosed = 'true',
    } = req.query;

    const filter = {};

    // 1. Teacher Filter (for Teacher's "My Opportunities")
    if (teacherId) {
      filter.teacherId = teacherId;
    }

    // 2. Closed Status Filter (hide closed from active student browse if requested)
    if (includeClosed === 'false') {
      filter.status = { $ne: 'Closed' };
    }

    // 3. Status filter
    if (status && status !== 'All Statuses') {
      filter.status = status;
    } else if (!teacherId) {
      // Exclude draft records from public student view
      filter.status = { ...(filter.status || {}), $ne: 'Draft' };
    }

    // 4. Category Filter
    if (category && category !== 'All Categories' && category !== 'All') {
      filter.category = category;
    }

    // 5. Institution Filter
    if (institution) {
      filter.institution = institution;
    }

    // 6. Skill Filter
    if (skill) {
      const skillArray = skill.split(',').map((s) => s.trim());
      filter.$or = [
        { skills: { $in: skillArray } },
        { requiredSkills: { $in: skillArray } },
      ];
    }

    // 7. Academic Year Eligibility Filter
    if (year) {
      filter.$or = [
        { eligibilityYears: { $regex: year, $options: 'i' } },
        { eligibleYears: { $regex: year, $options: 'i' } },
      ];
    }

    // 8. Text/Keyword Search across fields
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { title: regex },
        { shortDescription: regex },
        { detailedDescription: regex },
        { description: regex },
        { skills: { $in: [regex] } },
        { requiredSkills: { $in: [regex] } },
        { category: regex },
        { institution: regex },
        { teacherName: regex },
      ];
    }

    const { opportunities } = getCollections();
    const list = await opportunities
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Map _id to id for seamless frontend compatibility
    const formatted = list.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      opportunities: formatted,
    });
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunities.',
      error: err.message,
    });
  }
}

/**
 * Get a single Opportunity by ID
 * GET /api/opportunities/:id
 */
export async function getOpportunityById(req, res) {
  try {
    const { id } = req.params;
    const { opportunities } = getCollections();

    let query = { id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id }] };
    }

    const opp = await opportunities.findOne(query);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    return res.status(200).json({
      success: true,
      opportunity: {
        ...opp,
        id: opp._id.toString(),
        _id: opp._id.toString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Update an Opportunity (Edit details or close applications)
 * PUT /api/opportunities/:id
 */
export async function updateOpportunity(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { opportunities } = getCollections();

    let query = { id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id }] };
    }

    const existing = await opportunities.findOne(query);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    // Role ownership check: Teachers can only edit their own opportunities
    if (req.user && req.user.role === 'teacher' && existing.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only modify opportunities you published.',
      });
    }

    delete updates._id;
    delete updates.id;
    updates.updatedAt = new Date();

    await opportunities.updateOne(query, { $set: updates });
    const updated = await opportunities.findOne(query);

    // Notify applicants if opportunity is closed (Asynchronous / Non-blocking)
    if (updates.status === 'Closed' && existing.status !== 'Closed') {
      notifyApplicantsOfOpportunityClosed({
        opportunityId: existing._id ? existing._id.toString() : id,
        opportunityTitle: existing.title,
        teacherName: existing.teacherName,
      }).catch((err) => console.warn('[Opportunity Closed Email Notice]:', err.message));
    }

    return res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully.',
      opportunity: {
        ...updated,
        id: updated._id.toString(),
        _id: updated._id.toString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Delete an Opportunity
 * DELETE /api/opportunities/:id
 */
export async function deleteOpportunity(req, res) {
  try {
    const { id } = req.params;
    const { opportunities, applications } = getCollections();

    let query = { id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id }] };
    }

    const existing = await opportunities.findOne(query);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    if (req.user && req.user.role === 'teacher' && existing.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete opportunities you published.',
      });
    }

    await opportunities.deleteOne(query);

    // Also remove associated applications
    await applications.deleteMany({ opportunityId: id });

    return res.status(200).json({
      success: true,
      message: 'Opportunity and associated applications deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

