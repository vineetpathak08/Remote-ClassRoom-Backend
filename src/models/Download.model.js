import mongoose from 'mongoose';

const downloadSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  quality: {
    type: String,
    enum: ['high', 'medium', 'low', 'audioOnly'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

downloadSchema.index({ lectureId: 1 });

const Download = mongoose.model('Download', downloadSchema);

export default Download;