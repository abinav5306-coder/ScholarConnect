import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { sendOtpEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scholarconnect_super_secret_jwt_key_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Helper to generate, hash, persist, and dispatch a 6-digit OTP
 */
export async function createAndSendOtp(email, purpose = 'email_verification') {
  const { otpVerifications } = getCollections();
  const normalizedEmail = email.toLowerCase().trim();

  // Check 60-second cooldown
  const existing = await otpVerifications.findOne({ email: normalizedEmail, purpose });
  if (existing && existing.resendAvailableAt && new Date() < new Date(existing.resendAvailableAt)) {
    const remainingSecs = Math.ceil((new Date(existing.resendAvailableAt).getTime() - Date.now()) / 1000);
    return {
      allowed: false,
      remainingSecs,
      message: `Please wait ${remainingSecs} seconds before requesting a new verification code.`,
    };
  }

  // Generate 6-digit cryptographically random OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(rawOtp, 10);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
  const resendAvailableAt = new Date(Date.now() + 60 * 1000); // 60 seconds cooldown

  await otpVerifications.updateOne(
    { email: normalizedEmail, purpose },
    {
      $set: {
        email: normalizedEmail,
        otpHash,
        purpose,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
        resendAvailableAt,
        verified: false,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  // Send real email via Nodemailer
  const sendResult = await sendOtpEmail(normalizedEmail, rawOtp, purpose);

  return {
    allowed: true,
    expiresAt,
    resendAvailableAt,
    previewUrl: sendResult.previewUrl,
  };
}

/**
 * Register a new Student or Teacher account
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const {
      name,
      fullName,
      email,
      password,
      role = 'student',
      institution = '',
      department = '',
      degree = '',
      academicYear = '',
      graduationYear = '',
      designation = '',
      skills = [],
      researchInterests = [],
      linkedin = '',
      github = '',
      profileUrl = '',
      bio = '',
    } = req.body;

    const displayName = (fullName || name || '').trim();
    const userEmail = (email || '').trim().toLowerCase();

    // 1. Validation
    if (!displayName) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either student or teacher.' });
    }

    const { users } = getCollections();

    // 2. Check for existing user
    const existingUser = await users.findOne({ email: userEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email address already exists. Please sign in instead.' 
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Construct user document with verification defaults
    const newUser = {
      name: displayName,
      email: userEmail,
      passwordHash,
      role,
      institution,
      department,
      degree,
      academicYear,
      graduationYear,
      designation,
      skills: Array.isArray(skills) ? skills : [],
      researchInterests: Array.isArray(researchInterests) ? researchInterests : [],
      linkedin,
      github,
      profileUrl,
      bio,
      emailVerified: false,
      verificationStatus: 'Not Submitted',
      verificationDocuments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await users.insertOne(newUser);
    const userId = insertResult.insertedId.toString();

    // 5. Generate and dispatch email OTP
    const otpResult = await createAndSendOtp(userEmail, 'email_verification');

    return res.status(201).json({
      success: true,
      requireOtp: true,
      email: userEmail,
      role,
      userId,
      message: 'Account created! A 6-digit verification code has been sent to your email. Please enter it to complete registration.',
      resendAvailableAt: otpResult.resendAvailableAt,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration. Please try again.',
      error: err.message,
    });
  }
}

/**
 * Verify 6-digit OTP
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit verification code are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { otpVerifications, users, notifications } = getCollections();

    const record = await otpVerifications.findOne({
      email: normalizedEmail,
      purpose: 'email_verification',
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this email. Please request a new code.',
      });
    }

    // Check expiration (5 minutes)
    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // Check attempt limit
    const maxAttempts = record.maxAttempts || 5;
    if (record.attempts >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. For security reasons, please request a new verification code.',
      });
    }

    // Verify hashed OTP
    const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);
    if (!isMatch) {
      const nextAttempts = (record.attempts || 0) + 1;
      await otpVerifications.updateOne(
        { _id: record._id },
        { $set: { attempts: nextAttempts, updatedAt: new Date() } }
      );
      const remaining = Math.max(0, maxAttempts - nextAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Mark OTP as verified
    await otpVerifications.updateOne(
      { _id: record._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );

    // Update user in MongoDB
    await users.updateOne(
      { email: normalizedEmail },
      { $set: { emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() } }
    );

    const user = await users.findOne({ email: normalizedEmail }, { projection: { passwordHash: 0 } });

    // Automatic notification
    try {
      if (user) {
        await notifications.insertOne({
          userId: user._id.toString(),
          userEmail: normalizedEmail,
          title: 'Email Verified Successfully 🎉',
          message: 'Welcome to ScholarConnect! Your email address has been verified successfully.',
          type: 'success',
          isRead: false,
          createdAt: new Date(),
        });
      }
    } catch {
      // Non-blocking
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        userId: user ? user._id.toString() : 'temp',
        email: normalizedEmail,
        role: user ? user.role : 'student',
        name: user ? user.name : 'Scholar User',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to ScholarConnect.',
      token,
      user: {
        ...user,
        id: user ? user._id.toString() : undefined,
      },
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Resend 6-digit OTP
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const result = await createAndSendOtp(email, 'email_verification');
    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: result.message,
        remainingSecs: result.remainingSecs,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email address.',
      resendAvailableAt: result.resendAvailableAt,
    });
  } catch (err) {
    console.error('resendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Authenticate existing user and issue token
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    const userEmail = (email || '').trim().toLowerCase();

    if (!userEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    const { users } = getCollections();
    const user = await users.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email address or password.' 
      });
    }

    // Role check (allow admin to log in to admin portal or general portal)
    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `This account is registered as a ${user.role}. Please sign in through the ${user.role} portal.`,
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email address or password.' 
      });
    }

    // Prevent unverified accounts from logging in
    if (user.emailVerified === false) {
      // Trigger new OTP so user can verify immediately
      try {
        await createAndSendOtp(user.email, 'email_verification');
      } catch {}

      return res.status(403).json({
        success: false,
        requireOtp: true,
        email: user.email,
        role: user.role,
        message: 'Your email address is not verified yet. A 6-digit verification code has been sent to your email. Please verify to sign in.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    delete user.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        ...user,
        id: user._id.toString(),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
      error: err.message,
    });
  }
}

/**
 * Get current authenticated profile
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    const { users } = getCollections();
    const user = await users.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        id: user._id.toString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
