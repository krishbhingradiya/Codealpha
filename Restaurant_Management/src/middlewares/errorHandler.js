// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // API request
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Web request
  res.status(statusCode).render('errors/500', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
    layout: 'layouts/main'
  });
};

module.exports = errorHandler;
