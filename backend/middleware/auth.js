import jwt from 'jsonwebtoken';
import db from '../db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'automobile_distributor_jwt_secret_token_18273981273918273');
    
    // Retrieve user from the JSON database to ensure they still exist and are not blocked
    let user = await db.findOne('users', { id: decoded.id });
    
    if (!user && decoded.email) {
      console.log(`User ${decoded.email} not found in database. Re-creating user from token payload.`);
      
      const emailLower = decoded.email.toLowerCase();
      const prefix = emailLower.split('@')[0];
      const baseName = prefix.replace(/\d+$/, '');
      let defaultName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      if (baseName.toLowerCase() === 'santhoshreddyranabthu') {
        defaultName = 'Santhosh Reddy';
      }

      // Determine role from email format if it matches auto-roles
      const isAutoAdmin = emailLower === 'manishamaxx@gmail.com' || emailLower === 'manishamxx@gmail.com' || emailLower.startsWith('admin+');
      const isAutoDelivery = emailLower.startsWith('delivery+') || emailLower.endsWith('@delivery.com') || emailLower === 'delivery1@autodist.com' || emailLower === 'delivery2@autodist.com';
      const isAutoManager = emailLower.startsWith('manager+') || emailLower.endsWith('@manager.com') || emailLower === 'manager1@autodist.com' || emailLower === 'manager2@autodist.com' || emailLower === 'manager3@autodist.com';

      let determinedRole = decoded.role || 'customer';
      if (isAutoAdmin) determinedRole = 'admin';
      else if (isAutoDelivery) determinedRole = 'delivery';
      else if (isAutoManager) determinedRole = 'manager';

      const newUser = {
        id: decoded.id,
        name: defaultName || 'Customer',
        email: emailLower,
        password: null, // Password cannot be recovered from token, but they are authenticated
        role: determinedRole,
        blocked: false,
        image: null,
        createdAt: new Date().toISOString()
      };
      
      user = await db.insert('users', newUser);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized. Auth required.' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
};
