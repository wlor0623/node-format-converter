const ffmpeg = require('fluent-ffmpeg');
const { generatePaths } = require('../utils/fileHelper');

/**
 * Convert video from one format to another
 * @param {Object} file - Uploaded file object
 * @param {String} targetFormat - Target format (mp4, avi, mkv, mov)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertVideo = (file, targetFormat, options = {}) => {
  return new Promise((resolve, reject) => {
    // Generate paths
    const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat);
    
    // Parse options
    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    
    // Set default options
    const {
      resolution,
      videoBitrate,
      audioBitrate = '128k',
      fps
    } = parsedOptions;
    
    // Create ffmpeg command
    const command = ffmpeg(uploadPath);
    
    // Set video settings based on options
    if (resolution) command.size(resolution);
    if (videoBitrate) command.videoBitrate(videoBitrate);
    if (audioBitrate) command.audioBitrate(audioBitrate);
    if (fps) command.fps(fps);
    
    // Start conversion
    command
      .output(outputPath)
      .on('end', () => {
        resolve({
          outputPath,
          outputFilename
        });
      })
      .on('error', (err) => {
        reject(new Error(`Video conversion failed: ${err.message}`));
      })
      .run();
  });
};

module.exports = {
  convertVideo
}; 