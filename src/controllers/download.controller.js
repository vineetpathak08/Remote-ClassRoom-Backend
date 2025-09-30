import Download from '../models/Download.model.js';
import Lecture from '../models/Lecture.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export const trackDownload = async (req, res) => {
  try {
    const { lectureId, quality } = req.body;

    const lecture = await Lecture.findById(lectureId);
    
    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    const download = new Download({
      lectureId,
      quality,
      fileSize: lecture.fileSize.compressed[quality] || lecture.fileSize.original
    });

    await download.save();

    // Increment download count
    lecture.downloads += 1;
    await lecture.save();

    logger.info(`Download tracked: ${lectureId}`);
    return successResponse(res, 201, 'Download tracked successfully', download);
  } catch (error) {
    logger.error('Error tracking download:', error);
    return errorResponse(res, 500, 'Failed to track download');
  }
};

export const getDownloadStats = async (req, res) => {
  try {
    const stats = await Download.aggregate([
      {
        $group: {
          _id: '$quality',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]);

    return successResponse(res, 200, 'Download stats fetched successfully', stats);
  } catch (error) {
    logger.error('Error fetching download stats:', error);
    return errorResponse(res, 500, 'Failed to fetch download stats');
  }
};

export const downloadLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = 'medium' } = req.query;

    const lecture = await Lecture.findById(id);
    
    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    const videoPath = lecture.videoUrl.compressed[quality] || lecture.videoUrl.original;
    
    if (!videoPath || !fs.existsSync(videoPath)) {
      return errorResponse(res, 404, 'Video file not found');
    }

    const fileName = path.basename(videoPath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    const fileStream = fs.createReadStream(videoPath);
    fileStream.pipe(res);

    // Track download
    const download = new Download({
      lectureId: id,
      quality,
      fileSize: lecture.fileSize.compressed[quality]
    });
    await download.save();

    lecture.downloads += 1;
    await lecture.save();

  } catch (error) {
    logger.error('Error downloading lecture:', error);
    return errorResponse(res, 500, 'Failed to download lecture');
  }
};