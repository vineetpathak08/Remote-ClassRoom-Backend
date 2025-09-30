export const BANDWIDTH_LEVELS = {
    HIGH: 'high',        // > 1 Mbps
    MEDIUM: 'medium',    // 256-512 Kbps
    LOW: 'low',          // 128-256 Kbps
    VERY_LOW: 'very_low' // < 128 Kbps
  };
  
  export const VIDEO_QUALITIES = {
    HIGH: { resolution: '720p', bitrate: '1500k' },
    MEDIUM: { resolution: '480p', bitrate: '800k' },
    LOW: { resolution: '360p', bitrate: '400k' },
    AUDIO_ONLY: { resolution: 'audio', bitrate: '64k' }
  };
  
  export const LECTURE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  };
  
  export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB