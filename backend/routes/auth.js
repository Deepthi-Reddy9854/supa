import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { verifyFirebaseToken } from '../middleware/firebase.js';

const router = express.Router();

// Google login simulation / Firebase Google auth endpoint
router.post('/google-login', async (req, res) => {
  try {
    const { idToken, email: bodyEmail, name: bodyName, image: bodyImage, password } = req.body;
    
    let email = bodyEmail;
    let name = bodyName;
    let image = bodyImage;

    if (idToken) {
      try {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'automobile-distributor';
        const decodedToken = await verifyFirebaseToken(idToken, projectId);
        email = decodedToken.email;
        name = decodedToken.name;
        image = decodedToken.picture;
      } catch (err) {
        console.error('Firebase token verification failed:', err);
        return res.status(401).json({ message: 'Invalid Google Sign-In token: ' + err.message });
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Find user by email
    let user = await db.findOne('users', { email: email.toLowerCase() });
    
    if (user) {
      if (user.blocked) {
        return res.status(403).json({ message: 'This user account has been blocked.' });
      }

      // Block passwordless Google login bypass for the Owner/Admin account
      if (user.role === 'admin' && !password) {
        return res.status(401).json({ message: 'Owner accounts must log in using the standard email and password form.' });
      }

      // If password was provided, verify it (or save it if they don't have one set yet)
      if (password) {
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password for this account.' });
          }
        } else {
          // Store password on first login for seeded users
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          user = await db.update('users', { id: user.id }, { password: hashedPassword });
        }
      }
    } else {
      // Create new customer account dynamically on registration
      const isAutoAdmin = email.toLowerCase() === 'manishamaxx@gmail.com' || email.toLowerCase() === 'manishamxx@gmail.com' || email.toLowerCase().startsWith('admin+');
      
      if (isAutoAdmin && !password) {
        return res.status(401).json({ message: 'Owner accounts must log in using the standard email and password form.' });
      }
      const isAutoDelivery = email.toLowerCase().startsWith('delivery+') || email.toLowerCase().endsWith('@delivery.com') || email.toLowerCase() === 'delivery1@autodist.com' || email.toLowerCase() === 'delivery2@autodist.com';
      const isAutoManager = email.toLowerCase().startsWith('manager+') || email.toLowerCase().endsWith('@manager.com') || email.toLowerCase() === 'manager1@autodist.com' || email.toLowerCase() === 'manager2@autodist.com' || email.toLowerCase() === 'manager3@autodist.com';

      let determinedRole = 'customer';
      if (isAutoAdmin) determinedRole = 'admin';
      else if (isAutoDelivery) determinedRole = 'delivery';
      else if (isAutoManager) determinedRole = 'manager';
      
      let hashedPassword = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      let defaultName = name;
      if (!defaultName && email) {
        const prefix = email.split('@')[0];
        const baseName = prefix.replace(/\d+$/, '');
        if (baseName.toLowerCase() === 'santhoshreddyranabthu') {
          defaultName = 'Santhosh Reddy';
        } else {
          defaultName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
        }
      }

      const newCustomer = {
        name: defaultName || 'Customer',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: determinedRole,
        blocked: false,
        image: image || null,
        createdAt: new Date().toISOString()
      };
      
      user = await db.insert('users', newCustomer);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'automobile_distributor_jwt_secret_token_18273981273918273',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        blocked: user.blocked,
        shopId: user.shopId || null,
        wishlist: user.wishlist || []
      }
    });
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
});

// Mobile Login & OTP Simulation
router.post('/mobile-otp-login', async (req, res) => {
  try {
    const { phone, otp, name, role } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    if (otp !== '123456') {
      return res.status(401).json({ message: 'Invalid OTP code. Use "123456" for testing.' });
    }

    // Find user by phone number
    let user = await db.findOne('users', { phone });

    if (user) {
      if (user.blocked) {
        return res.status(403).json({ message: 'This user account has been blocked.' });
      }
    } else {
      // Register new user with this phone
      const newUser = {
        name: name || `User ${phone.slice(-4)}`,
        phone: phone,
        email: `${phone}@autohub.com`,
        role: role || 'customer',
        blocked: false,
        createdAt: new Date().toISOString()
      };
      user = await db.insert('users', newUser);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'automobile_distributor_jwt_secret_token_18273981273918273',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.image,
        blocked: user.blocked,
        shopId: user.shopId || null,
        wishlist: user.wishlist || []
      }
    });
  } catch (error) {
    console.error('OTP login error:', error);
    return res.status(500).json({ message: 'Server error during mobile authentication.' });
  }
});

// Get currently logged-in user profile
router.get('/me', verifyToken, (req, res) => {
  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone || null,
    role: req.user.role,
    image: req.user.image || null,
    blocked: req.user.blocked || false,
    shopId: req.user.shopId || null,
    vehicle: req.user.vehicle || null,
    earnings: req.user.earnings || 0,
    latitude: req.user.latitude || null,
    longitude: req.user.longitude || null,
    loyaltyPoints: req.user.loyaltyPoints || 0,
    addresses: req.user.addresses || [],
    wishlist: req.user.wishlist || []
  });
});

export default router;
