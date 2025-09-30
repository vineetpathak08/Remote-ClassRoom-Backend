import LiveClass from '../models/LiveClass.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const createLiveClass = async (req, res) => {
  try {
    const { title, instructor, subject, scheduledTime, duration } = req.body;

    const liveClass = new LiveClass({
      title,
      instructor,
      subject,
      scheduledTime: new Date(scheduledTime),
      duration: parseInt(duration),
      roomId: uuidv4()
    });

    await liveClass.save();

    logger.info(`Live class created: ${liveClass._id}`);
    return successResponse(res, 201, 'Live class created successfully', liveClass);
  } catch (error) {
    logger.error('Error creating live class:', error);
    return errorResponse(res, 500, 'Failed to create live class');
  }
};

export const getAllLiveClasses = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.scheduledTime = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'live'] };
    }

    const liveClasses = await LiveClass.find(query)
      .sort({ scheduledTime: 1 })
      .limit(20);

    return successResponse(res, 200, 'Live classes fetched successfully', liveClasses);
  } catch (error) {
    logger.error('Error fetching live classes:', error);
    return errorResponse(res, 500, 'Failed to fetch live classes');
  }
};

export const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return errorResponse(res, 404, 'Live class not found');
    }

    return successResponse(res, 200, 'Live class fetched successfully', liveClass);
  } catch (error) {
    logger.error('Error fetching live class:', error);
    return errorResponse(res, 500, 'Failed to fetch live class');
  }
};

export const startLiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findByIdAndUpdate(
      id,
      { status: 'live' },
      { new: true }
    );

    if (!liveClass) {
      return errorResponse(res, 404, 'Live class not found');
    }

    logger.info(`Live class started: ${liveClass._id}`);
    return successResponse(res, 200, 'Live class started successfully', liveClass);
  } catch (error) {
    logger.error('Error starting live class:', error);
    return errorResponse(res, 500, 'Failed to start live class');
  }
};

export const endLiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findByIdAndUpdate(
      id,
      { status: 'ended' },
      { new: true }
    );

    if (!liveClass) {
      return errorResponse(res, 404, 'Live class not found');
    }

    logger.info(`Live class ended: ${liveClass._id}`);
    return successResponse(res, 200, 'Live class ended successfully', liveClass);
  } catch (error) {
    logger.error('Error ending live class:', error);
    return errorResponse(res, 500, 'Failed to end live class');
  }
};