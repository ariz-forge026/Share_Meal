export function notFound(request, response, next) {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  const statusCode = error.statusCode || error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : 500);
  let message = statusCode === 500 ? 'An unexpected server error occurred.' : error.message;
  let details;
  if (statusCode === 400 && error.message.startsWith('[')) {
    try { details = JSON.parse(error.message); } catch { message = error.message; }
    if (details) message = 'Please correct the highlighted fields.';
  }
  if (statusCode === 500) console.error(`${request.method} ${request.originalUrl}: ${error.message}`);
  if (error.code === 11000) {
    if (error.keyPattern?.email) message = 'An account with this email already exists.';
    else if (error.keyPattern?.donation && error.keyPattern?.ngo) message = 'This NGO has already requested this donation.';
    else message = 'A record for this donation already exists in this workflow.';
  }
  response.status(statusCode).json({ success: false, message, ...(details ? { errors: details } : {}) });
}
