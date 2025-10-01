import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String,
    joinedAt: Date,
    leftAt: Date
  }],
  recordingUrl: {
    type: String
  },
  recordingStartedAt: {
    type: Date
  },
  recordingEndedAt: {
    type: Date
  },
  slides: [{
    url: String,
    displayedAt: Date
  }],
  maxParticipants: {
    type: Number,
    default: 100
  },
  isRecording: {
    type: Boolean,
    default: false
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  }
}, {
  timestamps: true
});

liveClassSchema.index({ scheduledTime: 1, status: 1 });
liveClassSchema.index({ instructor: 1 });
liveClassSchema.index({ roomId: 1 });

const LiveClass = mongoose.model('LiveClass', liveClassSchema);

export default LiveClass;