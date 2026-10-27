import AppError from './AppError.js';

export function parseCoordinates(query) {
  const hasLatitude = query.lat !== undefined;
  const hasLongitude = query.lng !== undefined;
  if (hasLatitude !== hasLongitude) throw new AppError(400, 'Provide both lat and lng coordinates.');
  if (!hasLatitude) return null;

  const latitude = Number(query.lat);
  const longitude = Number(query.lng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new AppError(400, 'Coordinates are outside the valid latitude/longitude range.');
  }
  return { type: 'Point', coordinates: [longitude, latitude] };
}

export function parseRadius(query, defaultKm = 25) {
  if (query.radiusKm === undefined) return defaultKm;
  const radiusKm = Number(query.radiusKm);
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 250) {
    throw new AppError(400, 'Search radius must be between 1 and 250 km.');
  }
  return radiusKm;
}

export function parsePagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 12);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new AppError(400, 'Page must be positive and page size must be between 1 and 50.');
  }
  return { page, limit, skip: (page - 1) * limit };
}
