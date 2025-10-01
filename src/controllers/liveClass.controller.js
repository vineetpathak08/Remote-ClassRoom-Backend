import LiveClass from "../models/LiveClass.model.js";
import User from "../models/User.model.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export const createLiveClass = async (req, res) => {
  try {
    const { title, subject, scheduledTime, duration } = req.body;

    const liveClass = new LiveClass({
      title,
      instructor: req.user.id,
      instructorName: req.user.name,
      subject,
      scheduledTime: new Date(scheduledTime),
      duration: parseInt(duration),
      roomId: uuidv4(),
    });

    await liveClass.save();

    logger.info(`Live class created: ${liveClass._id} by ${req.user.name}`);
    return successResponse(
      res,
      201,
      "Live class created successfully",
      liveClass
    );
  } catch (error) {
    logger.error("Error creating live class:", error);
    return errorResponse(res, 500, "Failed to create live class");
  }
};

export const getAllLiveClasses = async (req, res) => {
  try {
    const { status, upcoming, myClasses } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.scheduledTime = { $gte: new Date() };
      query.status = { $in: ["scheduled", "live"] };
    }

    // For instructors: show their own classes + other teachers' live classes
    if (req.user.role === "instructor") {
      if (myClasses === "true") {
        // Only show instructor's own classes
        query.instructor = req.user.id;
      } else {
        // Show instructor's own classes + other instructors' live classes
        query = {
          ...query,
          $or: [
            { instructor: req.user.id }, // Their own classes (all statuses)
            {
              instructor: { $ne: req.user.id }, // Other instructors' classes
              status: "live", // Only live classes from others
            },
          ],
        };
      }
    }

    const liveClasses = await LiveClass.find(query)
      .populate("instructor", "name email subject")
      .sort({ scheduledTime: 1 })
      .limit(50);

    return successResponse(
      res,
      200,
      "Live classes fetched successfully",
      liveClasses
    );
  } catch (error) {
    logger.error("Error fetching live classes:", error);
    return errorResponse(res, 500, "Failed to fetch live classes");
  }
};

export const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id).populate(
      "instructor",
      "name email subject"
    );

    if (!liveClass) {
      return errorResponse(res, 404, "Live class not found");
    }

    return successResponse(
      res,
      200,
      "Live class fetched successfully",
      liveClass
    );
  } catch (error) {
    logger.error("Error fetching live class:", error);
    return errorResponse(res, 500, "Failed to fetch live class");
  }
};

export const startLiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return errorResponse(res, 404, "Live class not found");
    }

    // Check if user is the instructor
    if (liveClass.instructor.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, "Only the instructor can start the class");
    }

    liveClass.status = "live";
    liveClass.actualStartTime = new Date();
    await liveClass.save();

    logger.info(`Live class started: ${liveClass._id} by ${req.user.name}`);
    return successResponse(
      res,
      200,
      "Live class started successfully",
      liveClass
    );
  } catch (error) {
    logger.error("Error starting live class:", error);
    return errorResponse(res, 500, "Failed to start live class");
  }
};

export const endLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { recordingUrl } = req.body;

    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return errorResponse(res, 404, "Live class not found");
    }

    // Check if user is the instructor
    if (liveClass.instructor.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, "Only the instructor can end the class");
    }

    liveClass.status = "ended";
    liveClass.actualEndTime = new Date();
    if (recordingUrl) {
      liveClass.recordingUrl = recordingUrl;
    }
    await liveClass.save();

    logger.info(`Live class ended: ${liveClass._id} by ${req.user.name}`);
    return successResponse(
      res,
      200,
      "Live class ended successfully",
      liveClass
    );
  } catch (error) {
    logger.error("Error ending live class:", error);
    return errorResponse(res, 500, "Failed to end live class");
  }
};

export const getInstructorClasses = async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return errorResponse(
        res,
        403,
        "Access denied. Instructor role required."
      );
    }

    const { status } = req.query;
    let query = { instructor: req.user.id };

    if (status) {
      query.status = status;
    }

    // Get instructor's own classes
    const myClasses = await LiveClass.find(query)
      .populate("instructor", "name email subject")
      .sort({ scheduledTime: -1 });

    // Get other instructors' currently live classes
    const otherLiveClasses = await LiveClass.find({
      instructor: { $ne: req.user.id },
      status: "live",
    })
      .populate("instructor", "name email subject")
      .sort({ actualStartTime: -1 });

    return successResponse(
      res,
      200,
      "Instructor classes fetched successfully",
      {
        myClasses,
        otherLiveClasses,
      }
    );
  } catch (error) {
    logger.error("Error fetching instructor classes:", error);
    return errorResponse(res, 500, "Failed to fetch instructor classes");
  }
};

export const getLiveNotifications = async (req, res) => {
  try {
    // Get live classes that are currently live or starting in next 15 minutes
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

    const notifications = await LiveClass.find({
      $or: [
        { status: "live" },
        {
          status: "scheduled",
          scheduledTime: {
            $gte: now,
            $lte: fifteenMinutesLater,
          },
        },
      ],
    })
      .populate("instructor", "name")
      .sort({ scheduledTime: 1 });

    return successResponse(
      res,
      200,
      "Notifications fetched successfully",
      notifications
    );
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return errorResponse(res, 500, "Failed to fetch notifications");
  }
};
