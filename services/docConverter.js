const fs = require('fs-extra');
const { generatePaths } = require('../utils/fileHelper');
const { convertAsync } = require('libreoffice-convert');

/**
 * Convert documents from one format to another (Word, PDF, PPT)
 * @param {Object} file - Uploaded file object
 * @param {String} targetFormat - Target format (pdf, docx, pptx)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertDocument = async (file, targetFormat, options = {}) => {
  // Generate paths
  const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat);
  
  try {
    // Read the file
    const docBuffer = await fs.readFile(uploadPath);
    
    // Format extension handling
    let format = targetFormat.toLowerCase();
    if (format === 'word' || format === 'doc') format = 'docx';
    if (format === 'ppt') format = 'pptx';
    if (format === 'pdf') format = 'pdf';
    
    // Convert the document
    const resultBuffer = await convertAsync(docBuffer, format, undefined);
    
    // Write the converted file
    await fs.writeFile(outputPath, resultBuffer);
    
    return {
      outputPath,
      outputFilename
    };
  } catch (error) {
    throw new Error(`Document conversion failed: ${error.message}`);
  }
};

module.exports = {
  convertDocument
}; 