const sharp = require('sharp');
const { generatePaths } = require('../utils/fileHelper');

/**
 * Convert image from one format to another
 * @param {Object} file - Uploaded file object
 * @param {String} targetFormat - Target format (jpg, png, webp, avif, tiff)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertImage = async (file, targetFormat, options = {}) => {
  // Generate paths
  const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat);
  
  // Parse options
  const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
  
  // Set default options
  const {
    width,
    height,
    quality = 80,
    fit = 'cover'
  } = parsedOptions;
  
  try {
    // Create sharp instance
    let sharpInstance = sharp(uploadPath);
    
    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize({
        width: width || null,
        height: height || null,
        fit: fit
      });
    }
    
    // Convert to target format with options
    switch (targetFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        await sharpInstance.jpeg({ quality }).toFile(outputPath);
        break;
      case 'png':
        await sharpInstance.png({ quality }).toFile(outputPath);
        break;
      case 'webp':
        await sharpInstance.webp({ quality }).toFile(outputPath);
        break;
      case 'avif':
        await sharpInstance.avif({ quality }).toFile(outputPath);
        break;
      case 'tiff':
        await sharpInstance.tiff({ quality }).toFile(outputPath);
        break;
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
    
    return {
      outputPath,
      outputFilename
    };
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};

module.exports = {
  convertImage
}; 