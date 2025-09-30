import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  roomId: {
    type: String,
    unique: true,
    required: true
  },
  participants: [{
    studentId: String,
    joinedAt: Date,
    leftAt: Date
  }],
  recordingUrl: {
    type: String
  },
  slides: [{
    url: String,
    displayedAt: Date
  }]
}, {
  timestamps: true
});

liveClassSchema.index({ scheduledTime: 1, status: 1 });

const LiveClass = mongoose.model('LiveClass', liveClassSchema);

export default LiveClass;