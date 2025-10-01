import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { errorResponse } from '../utils/response.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return errorResponse(res, 401, 'User not found');
      }

      next();
    } catch (error) {
      return errorResponse(res, 401, 'Not authorized, token failed');
    }
  } catch (error) {
    return errorResponse(res, 500, 'Server error in auth middleware');
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, `User role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};