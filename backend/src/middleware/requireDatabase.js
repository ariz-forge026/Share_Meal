import { isDatabaseReady } from '../config/database.js';
import AppError from '../utils/AppError.js';

export function requireDatabase(request, response, next) {
  if (!isDatabaseReady()) {
    return next(new AppError(503, 'Database is unavailable. Configure MongoDB Atlas to use this feature.'));
  }
  return next();
}
