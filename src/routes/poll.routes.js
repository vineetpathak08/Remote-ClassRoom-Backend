import express from 'express';
import {
  createPoll,
  submitPollResponse,
  getPollResults,
  getActivePoll,
  closePoll
} from '../controllers/poll.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('instructor'), createPoll);
router.post('/response', protect, submitPollResponse);
router.get('/:pollId/results', protect, getPollResults);
router.get('/active/:liveClassId', protect, getActivePoll);
router.put('/:pollId/close', protect, restrictTo('instructor'), closePoll);

export default router;