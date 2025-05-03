const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique filename for an uploaded file
 * @param {String} originalName - Original filename
 * @param {String} ext - Target extension (without dot)
 * @returns {String} Generated filename
 */
const generateFilename = (originalName, ext) => {
  const baseName = path.basename(originalName, path.extname(originalName));
  return `${baseName}-${uuidv4().substring(0, 8)}.${ext}`;
};

/**
 * Generate paths for upload and converted files
 * @param {Object} file - Uploaded file object
 * @param {String} targetFormat - Target format
 * @param {Object} options - Options including output directory
 * @returns {Object} Paths for upload and converted files
 */
const generatePaths = (file, targetFormat, options = {}) => {
  const { outputDir = path.join(process.cwd(), 'converted') } = options;
  const uploadPath = file.path || file.filepath || file; // 支持多种文件对象格式
  const outputFilename = generateFilename(
    file.originalname || path.basename(uploadPath), 
    targetFormat
  );
  const outputPath = path.join(outputDir, outputFilename);
  
  return {
    uploadPath,
    outputPath,
    outputFilename
  };
};

/**
 * Clean up temporary files after conversion
 * @param {String} uploadPath - Path to the uploaded file
 * @param {String} outputPath - Path to the converted file (optional)
 */
const cleanupFiles = async (uploadPath, outputPath = null) => {
  try {
    // Always remove the uploaded file
    if (uploadPath && await fs.pathExists(uploadPath)) {
      await fs.remove(uploadPath);
    }
    
    // Optionally remove the output file
    if (outputPath && await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
};

/**
 * Determine file type based on file extension
 * @param {String} filename - Original filename
 * @returns {String} File type (image, video, audio, doc, excel, pdf)
 */
const determineFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase().substring(1);
  
  // Image formats
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'tiff', 'bmp', 'svg'].includes(ext)) {
    return 'image';
  }
  
  // Video formats
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', '3gp'].includes(ext)) {
    return 'video';
  }
  
  // Audio formats
  if (['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'].includes(ext)) {
    return 'audio';
  }
  
  // Document formats
  if (['doc', 'docx', 'ppt', 'pptx', 'odt', 'rtf'].includes(ext)) {
    return 'doc';
  }
  
  // Excel formats
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return 'excel';
  }
  
  // PDF format
  if (ext === 'pdf') {
    return 'pdf';
  }
  
  // Default: unknown
  return null;
};

/**
 * Ensure required directories exist
 * @param {Object} options - Options with directory paths
 * @returns {Object} Directory paths
 */
const ensureDirectories = (options = {}) => {
  const uploadsDir = options.uploadsDir || path.join(process.cwd(), 'uploads');
  const convertedDir = options.convertedDir || path.join(process.cwd(), 'converted');
  
  fs.ensureDirSync(uploadsDir);
  fs.ensureDirSync(convertedDir);
  
  return { uploadsDir, convertedDir };
};

module.exports = {
  generateFilename,
  generatePaths,
  cleanupFiles,
  determineFileType,
  ensureDirectories
}; 