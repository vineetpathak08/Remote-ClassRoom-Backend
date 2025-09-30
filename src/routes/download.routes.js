
import express from 'express';
import {
  trackDownload,
  getDownloadStats,
  downloadLecture
} from '../controllers/download.controller.js';

const router = express.Router();

router.post('/track', trackDownload);
router.get('/stats', getDownloadStats);
router.get('/lecture/:id', downloadLecture);

export default router;