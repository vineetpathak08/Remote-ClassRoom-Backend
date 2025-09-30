import express from 'express';
import {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
  getStreamUrl
} from '../controllers/lecture.controller.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.post(
  '/',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'slides', maxCount: 50 }
  ]),
  createLecture
);

router.get('/', getAllLectures);
router.get('/:id', getLectureById);
router.get('/:id/stream', getStreamUrl);
router.put('/:id', updateLecture);
router.delete('/:id', deleteLecture);

export default router;