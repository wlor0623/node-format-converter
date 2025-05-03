const ffmpeg = require('fluent-ffmpeg');
const { generatePaths } = require('../utils/fileHelper');

/**
 * Convert audio from one format to another
 * @param {Object} file - Uploaded file object or file path
 * @param {String} targetFormat - Target format (mp3, wav, flac, ogg)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertAudio = (file, targetFormat, options = {}) => {
  return new Promise((resolve, reject) => {
    // Generate paths
    const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat, options);
    
    // Parse options
    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    
    // Set default options
    const {
      audioBitrate = '192k',
      audioChannels = 2,
      sampleRate
    } = parsedOptions;
    
    // Create ffmpeg command
    const command = ffmpeg(uploadPath);
    
    // Set audio settings based on options
    if (audioBitrate) command.audioBitrate(audioBitrate);
    if (audioChannels) command.audioChannels(audioChannels);
    if (sampleRate) command.audioFrequency(sampleRate);
    
    // Start conversion
    command
      .output(outputPath)
      .on('end', () => {
        resolve({
          outputPath,
          outputFilename,
          success: true
        });
      })
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`));
      })
      .run();
  });
};

module.exports = {
  convertAudio
}; 