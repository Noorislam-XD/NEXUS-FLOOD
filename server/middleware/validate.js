// Input validation middleware for NEXUS FLOOD
// ES module syntax

/**
 * Validates required fields for incident creation.
 * Required: incident_type, description, location (object with at least one field)
 */
export function validateIncident(req, res, next) {
  const { incident_type, description, location } = req.body;

  const errors = [];

  if (!incident_type || typeof incident_type !== 'string') {
    errors.push('incident_type is required and must be a string');
  } else {
    const validTypes = ['flood', 'storm', 'infrastructure_damage', 'rescue_needed', 'road_closure', 'other'];
    if (!validTypes.includes(incident_type)) {
      errors.push(`incident_type must be one of: ${validTypes.join(', ')}`);
    }
  }

  if (!description || typeof description !== 'string') {
    errors.push('description is required and must be a string');
  } else if (description.trim().length < 10) {
    errors.push('description must be at least 10 characters');
  } else if (description.length > 5000) {
    errors.push('description must be at most 5000 characters');
  }

  if (!location) {
    errors.push('location is required');
  } else if (typeof location === 'string') {
    if (location.trim().length === 0) {
      errors.push('location string cannot be empty');
    }
  } else if (typeof location === 'object') {
    const hasAnyField = location.address || location.reported_address || location.latitude || location.longitude || location.area;
    if (!hasAnyField) {
      errors.push('location must have at least one of: address, reported_address, latitude, longitude, area');
    }
    if (location.latitude !== undefined && location.latitude !== null && (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90)) {
      errors.push('latitude must be a number between -90 and 90');
    }
    if (location.longitude !== undefined && location.longitude !== null && (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180)) {
      errors.push('longitude must be a number between -180 and 180');
    }
  } else {
    errors.push('location must be an object or string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
}

/**
 * Validates that at least text content or uploaded files are provided for analysis.
 */
export function validateAnalysis(req, res, next) {
  const hasText = req.body.text && typeof req.body.text === 'string' && req.body.text.trim().length > 0;
  const hasFiles = req.files && req.files.length > 0;

  if (!hasText && !hasFiles) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['At least one of text content or uploaded files must be provided'],
    });
  }

  if (req.body.text && req.body.text.length > 50000) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['Text content must be at most 50,000 characters'],
    });
  }

  next();
}
