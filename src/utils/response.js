export const successResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  export const errorResponse = (res, statusCode, message, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors })
    });
  };