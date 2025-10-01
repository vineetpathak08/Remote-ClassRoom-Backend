// import Lecture from '../models/Lecture.model.js';
// import { successResponse, errorResponse } from '../utils/response.js';
// import { logger } from '../utils/logger.js';

// export const createLecture = async (req, res) => {
//   try {
//     const { title, description, instructor, subject, duration } = req.body;
    
//     const lecture = new Lecture({
//       title,
//       description,
//       instructor,
//       subject,
//       duration: parseInt(duration),
//       thumbnail: req.files?.thumbnail?.[0]?.path || null,
//       videoUrl: {
//         original: req.files?.video?.[0]?.path || null
//       },
//       slides: req.files?.slides?.map((file, index) => ({
//         url: file.path,
//         order: index
//       })) || []
//     });

//     await lecture.save();
    
//     logger.info(`Lecture created: ${lecture._id}`);
//     return successResponse(res, 201, 'Lecture created successfully', lecture);
//   } catch (error) {
//     logger.error('Error creating lecture:', error);
//     return errorResponse(res, 500, 'Failed to create lecture');
//   }
// };

// export const getAllLectures = async (req, res) => {
//   try {
//     const { subject, status = 'published', page = 1, limit = 10 } = req.query;
    
//     const query = { status };
//     if (subject) query.subject = subject;

//     const lectures = await Lecture.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .select('-transcript'); // Exclude large fields for list view

//     const count = await Lecture.countDocuments(query);

//     return successResponse(res, 200, 'Lectures fetched successfully', {
//       lectures,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       total: count
//     });
//   } catch (error) {
//     logger.error('Error fetching lectures:', error);
//     return errorResponse(res, 500, 'Failed to fetch lectures');
//   }
// };

// export const getLectureById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const lecture = await Lecture.findById(id);
    
//     if (!lecture) {
//       return errorResponse(res, 404, 'Lecture not found');
//     }

//     // Increment view count
//     lecture.views += 1;
//     await lecture.save();

//     return successResponse(res, 200, 'Lecture fetched successfully', lecture);
//   } catch (error) {
//     logger.error('Error fetching lecture:', error);
//     return errorResponse(res, 500, 'Failed to fetch lecture');
//   }
// };

// export const updateLecture = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     const lecture = await Lecture.findByIdAndUpdate(
//       id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     );

//     if (!lecture) {
//       return errorResponse(res, 404, 'Lecture not found');
//     }

//     logger.info(`Lecture updated: ${lecture._id}`);
//     return successResponse(res, 200, 'Lecture updated successfully', lecture);
//   } catch (error) {
//     logger.error('Error updating lecture:', error);
//     return errorResponse(res, 500, 'Failed to update lecture');
//   }
// };

// export const deleteLecture = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const lecture = await Lecture.findByIdAndDelete(id);

//     if (!lecture) {
//       return errorResponse(res, 404, 'Lecture not found');
//     }

//     logger.info(`Lecture deleted: ${id}`);
//     return successResponse(res, 200, 'Lecture deleted successfully');
//   } catch (error) {
//     logger.error('Error deleting lecture:', error);
//     return errorResponse(res, 500, 'Failed to delete lecture');
//   }
// };

// export const getStreamUrl = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { quality = 'medium' } = req.query;

//     const lecture = await Lecture.findById(id);
    
//     if (!lecture) {
//       return errorResponse(res, 404, 'Lecture not found');
//     }

//     // Get appropriate video URL based on requested quality
//     const videoUrl = lecture.videoUrl.compressed[quality] || 
//                      lecture.videoUrl.original;

//     return successResponse(res, 200, 'Stream URL fetched successfully', {
//       url: videoUrl,
//       quality,
//       fileSize: lecture.fileSize.compressed[quality]
//     });
//   } catch (error) {
//     logger.error('Error fetching stream URL:', error);
//     return errorResponse(res, 500, 'Failed to fetch stream URL');
//   }
// };


import Lecture from '../models/Lecture.model.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';

export const createLecture = async (req, res) => {
  try {
    const { title, description, instructor, subject, duration } = req.body;
    
    const lecture = new Lecture({
      title,
      description,
      instructor,
      subject,
      duration: parseInt(duration),
      thumbnail: req.files?.thumbnail?.[0]?.path || null,
      videoUrl: {
        original: req.files?.video?.[0]?.path || null
      },
      slides: req.files?.slides?.map((file, index) => ({
        url: file.path,
        order: index
      })) || [],
      fileSize: {
        original: req.files?.video?.[0]?.size || 0
      },
      status: 'published'
    });

    await lecture.save();
    
    logger.info(`Lecture created: ${lecture._id}`);
    return successResponse(res, 201, 'Lecture created successfully', lecture);
  } catch (error) {
    logger.error('Error creating lecture:', error);
    return errorResponse(res, 500, 'Failed to create lecture');
  }
};

export const getAllLectures = async (req, res) => {
  try {
    const { subject, status = 'published', page = 1, limit = 50 } = req.query;
    
    const query = { status };
    if (subject) query.subject = subject;

    const lectures = await Lecture.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-transcript');

    const count = await Lecture.countDocuments(query);

    return successResponse(res, 200, 'Lectures fetched successfully', {
      lectures,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    logger.error('Error fetching lectures:', error);
    return errorResponse(res, 500, 'Failed to fetch lectures');
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lecture = await Lecture.findById(id);
    
    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    lecture.views += 1;
    await lecture.save();

    return successResponse(res, 200, 'Lecture fetched successfully', lecture);
  } catch (error) {
    logger.error('Error fetching lecture:', error);
    return errorResponse(res, 500, 'Failed to fetch lecture');
  }
};

export const updateLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const lecture = await Lecture.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    logger.info(`Lecture updated: ${lecture._id}`);
    return successResponse(res, 200, 'Lecture updated successfully', lecture);
  } catch (error) {
    logger.error('Error updating lecture:', error);
    return errorResponse(res, 500, 'Failed to update lecture');
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await Lecture.findByIdAndDelete(id);

    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    logger.info(`Lecture deleted: ${id}`);
    return successResponse(res, 200, 'Lecture deleted successfully');
  } catch (error) {
    logger.error('Error deleting lecture:', error);
    return errorResponse(res, 500, 'Failed to delete lecture');
  }
};

export const getStreamUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality = 'medium' } = req.query;

    const lecture = await Lecture.findById(id);
    
    if (!lecture) {
      return errorResponse(res, 404, 'Lecture not found');
    }

    const videoUrl = lecture.videoUrl.compressed?.[quality] || lecture.videoUrl.original;

    return successResponse(res, 200, 'Stream URL fetched successfully', {
      url: videoUrl,
      quality,
      fileSize: lecture.fileSize.compressed?.[quality] || lecture.fileSize.original
    });
  } catch (error) {
    logger.error('Error fetching stream URL:', error);
    return errorResponse(res, 500, 'Failed to fetch stream URL');
  }
};