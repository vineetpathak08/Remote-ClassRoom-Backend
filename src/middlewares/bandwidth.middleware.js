import { BANDWIDTH_LEVELS } from '../config/constants.js';

export const detectBandwidth = (req, res, next) => {
  // Simple bandwidth detection based on connection type header
  const connectionType = req.headers['connection-type'] || 'unknown';
  
  let bandwidthLevel = BANDWIDTH_LEVELS.MEDIUM;
  
  if (connectionType.includes('4g') || connectionType.includes('wifi')) {
    bandwidthLevel = BANDWIDTH_LEVELS.HIGH;
  } else if (connectionType.includes('3g')) {
    bandwidthLevel = BANDWIDTH_LEVELS.MEDIUM;
  } else if (connectionType.includes('2g')) {
    bandwidthLevel = BANDWIDTH_LEVELS.LOW;
  }
  
  req.bandwidthLevel = bandwidthLevel;
  next();
};