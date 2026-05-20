// Wraps an async route handler so any thrown error is forwarded to
// Express's global error handler rather than crashing the process.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler
