import express from 'express';
import {
  createLiveClass,
  getAllLiveClasses,
  getLiveClassById,
  startLiveClass,
  endLiveClass
} from '../controllers/liveClass.controller.js';

const router = express.Router();

router.post('/', createLiveClass);
router.get('/', getAllLiveClasses);
router.get('/:id', getLiveClassById);
router.post('/:id/start', startLiveClass);
router.post('/:id/end', endLiveClass);

export default router;