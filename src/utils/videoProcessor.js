import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export const compressVideo = (inputPath, quality = 'medium') => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace('.mp4', `_${quality}.mp4`);
    
    const settings = {
      high: { size: '1280x720', bitrate: '1500k' },
      medium: { size: '854x480', bitrate: '800k' },
      low: { size: '640x360', bitrate: '400k' }
    };
    
    const config = settings[quality] || settings.medium;
    
    ffmpeg(inputPath)
      .size(config.size)
      .videoBitrate(config.bitrate)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

export const extractAudio = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace('.mp4', '_audio.mp3');
    
    ffmpeg(inputPath)
      .noVideo()
      .audioBitrate('64k')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};