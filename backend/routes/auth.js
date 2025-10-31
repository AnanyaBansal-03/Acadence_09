const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const supabase = require("../db");

// LOGIN - Support both Supabase Auth and direct database users (admins)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Get user from database first
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, email, password, name, role, email_verified')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (dbError || !user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is admin or has email_verified = true (bypass Supabase Auth for these)
    if (user.role === 'admin' || user.email_verified === true) {
      // Direct password check for admins and verified users
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
      
      return res.json({ 
        token, 
        role: user.role, 
        name: user.name,
        id: user.id,
        email: user.email
      });
    }

    // For non-admin users without verified email, check Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });

    if (authError) {
      // Check if it's an email not confirmed error
      if (authError.message.includes('Email not confirmed')) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in. Check your inbox for the verification link.",
          emailNotVerified: true,
          email: email.toLowerCase().trim()
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified in Supabase Auth
    if (!authData.user.email_confirmed_at) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        emailNotVerified: true,
        email: email.toLowerCase().trim()
      });
    }

    // Update email_verified in our table
    await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    res.json({ 
      token, 
      role: user.role, 
      name: user.name,
      id: user.id,
      email: user.email
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// SIGNUP - Using Supabase Auth for email verification
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validate role
  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: "Role must be 'student' or 'teacher'" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    // Use Supabase Auth to create user with email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          name: name.trim(),
          role: role.toLowerCase()
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (authError) {
      console.error("Supabase auth signup error:", authError);
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(500).json({ message: authError.message || "Error creating account" });
    }

    // Hash password for our users table
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert into our users table (without id - let it auto-generate)
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: role.toLowerCase(),
          email_verified: false // Will be updated when user clicks verification link
        }
      ])
      .select('id, name, email, role, created_at');

    if (error) {
      console.error("Database insert error:", error);
      // Try to clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ message: "Error creating account" });
    }

    res.status(201).json({ 
      message: "Account created successfully! Please check your email to verify your account before logging in.",
      email: data[0].email,
      requiresVerification: true
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// RESEND VERIFICATION EMAIL - Using Supabase Auth
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Resend confirmation email using Supabase Auth
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
      }
    });

    if (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({ message: "Error sending verification email" });
    }

    res.status(200).json({ 
      message: "Verification email sent! Please check your inbox." 
    });

  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;