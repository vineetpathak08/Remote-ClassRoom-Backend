import Poll from '../models/Poll.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const createPoll = async (req, res) => {
  try {
    const { liveClassId, question, options, type, duration } = req.body;

    const poll = await Poll.create({
      liveClassId,
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      type,
      duration,
      createdBy: req.user.id
    });

    logger.info(`Poll created: ${poll._id}`);
    return successResponse(res, 201, 'Poll created successfully', poll);
  } catch (error) {
    logger.error('Error creating poll:', error);
    return errorResponse(res, 500, 'Error creating poll');
  }
};

export const submitPollResponse = async (req, res) => {
  try {
    const { pollId, answer } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return errorResponse(res, 404, 'Poll not found');
    }

    // Check if user already responded
    const existingResponse = poll.responses.find(
      r => r.userId.toString() === req.user.id.toString()
    );

    if (existingResponse) {
      return errorResponse(res, 400, 'You have already responded to this poll');
    }

    // Add response
    poll.responses.push({
      userId: req.user.id,
      answer
    });

    // Update vote count if multiple choice
    if (poll.type === 'multiple-choice') {
      const optionIndex = parseInt(answer);
      if (poll.options[optionIndex]) {
        poll.options[optionIndex].votes += 1;
      }
    }

    await poll.save();

    logger.info(`Poll response submitted: ${pollId} by ${req.user.id}`);
    return successResponse(res, 200, 'Response submitted successfully', poll);
  } catch (error) {
    logger.error('Error submitting poll response:', error);
    return errorResponse(res, 500, 'Error submitting response');
  }
};

export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId).populate('responses.userId', 'name');
    if (!poll) {
      return errorResponse(res, 404, 'Poll not found');
    }

    return successResponse(res, 200, 'Poll results fetched successfully', poll);
  } catch (error) {
    logger.error('Error fetching poll results:', error);
    return errorResponse(res, 500, 'Error fetching poll results');
  }
};

export const getActivePoll = async (req, res) => {
  try {
    const { liveClassId } = req.params;

    const poll = await Poll.findOne({
      liveClassId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!poll) {
      return successResponse(res, 200, 'No active poll', null);
    }

    return successResponse(res, 200, 'Active poll fetched successfully', poll);
  } catch (error) {
    logger.error('Error fetching active poll:', error);
    return errorResponse(res, 500, 'Error fetching active poll');
  }
};

export const closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findByIdAndUpdate(
      pollId,
      { isActive: false },
      { new: true }
    );

    if (!poll) {
      return errorResponse(res, 404, 'Poll not found');
    }

    logger.info(`Poll closed: ${pollId}`);
    return successResponse(res, 200, 'Poll closed successfully', poll);
  } catch (error) {
    logger.error('Error closing poll:', error);
    return errorResponse(res, 500, 'Error closing poll');
  }
};