import express from 'express';
import {
  createLiveClass,
  getAllLiveClasses,
  getLiveClassById,
  startLiveClass,
  endLiveClass,
  getLiveNotifications
} from '../controllers/liveClass.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('instructor'), createLiveClass);
router.get('/', protect, getAllLiveClasses);
router.get('/notifications', protect, getLiveNotifications);
router.get('/:id', protect, getLiveClassById);
router.post('/:id/start', protect, restrictTo('instructor'), startLiveClass);
router.post('/:id/end', protect, restrictTo('instructor'), endLiveClass);

export default router;