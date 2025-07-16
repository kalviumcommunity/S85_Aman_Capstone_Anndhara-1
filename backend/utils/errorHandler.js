/**
 * Sends a standardized server error response.
 * @param {object} res - Express response object
 * @param {Error} error - The error object
 * @param {string} [message] - Optional custom message
 * @param {number} [status=500] - HTTP status code
 */
function handleServerError(res, error, message = 'Server error', status = 500) {
  return res.status(status).json({
    success: false,
    message,
    error: error?.message || 'Unknown error',
  });
}

module.exports = { handleServerError }; 