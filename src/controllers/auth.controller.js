import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    const token = generateToken(user._id);

    logger.info(`User registered: ${user.email}`);

    return successResponse(res, 201, 'User registered successfully', {
      user,
      token
    });
  } catch (error) {
    logger.error('Error in register:', error);
    return errorResponse(res, 500, 'Error registering user');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    return successResponse(res, 200, 'Login successful', {
      user,
      token
    });
  } catch (error) {
    logger.error('Error in login:', error);
    return errorResponse(res, 500, 'Error logging in');
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return successResponse(res, 200, 'User fetched successfully', user);
  } catch (error) {
    logger.error('Error in getMe:', error);
    return errorResponse(res, 500, 'Error fetching user');
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    return successResponse(res, 200, 'Logout successful');
  } catch (error) {
    logger.error('Error in logout:', error);
    return errorResponse(res, 500, 'Error logging out');
  }
};