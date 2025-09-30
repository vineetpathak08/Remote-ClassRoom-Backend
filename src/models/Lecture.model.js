import mongoose from 'mongoose';
import { LECTURE_STATUS } from '../config/constants.js';

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  thumbnail: {
    type: String
  },
  videoUrl: {
    original: String,
    compressed: {
      high: String,
      medium: String,
      low: String,
      audioOnly: String
    }
  },
  slides: [{
    url: String,
    order: Number
  }],
  transcript: {
    type: String
  },
  fileSize: {
    original: Number,
    compressed: {
      high: Number,
      medium: Number,
      low: Number,
      audioOnly: Number
    }
  },
  status: {
    type: String,
    enum: Object.values(LECTURE_STATUS),
    default: LECTURE_STATUS.DRAFT
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
lectureSchema.index({ subject: 1, status: 1 });
lectureSchema.index({ createdAt: -1 });

const Lecture = mongoose.model('Lecture', lectureSchema);

export default Lecture;