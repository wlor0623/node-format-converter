const fs = require('fs-extra');
const path = require('path');
const { fromPath } = require('pdf2pic');
const pdfParse = require('pdf-parse');
const { generatePaths } = require('../utils/fileHelper');

/**
 * Convert PDF to image or extract text
 * @param {Object} file - Uploaded file object or file path
 * @param {String} targetFormat - Target format (jpg, png, txt)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertPdf = async (file, targetFormat, options = {}) => {
  // Generate paths
  const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat, options);
  
  // Parse options
  const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
  
  // Set default options
  const {
    density = 300,
    quality = 100,
    pages = [1],  // Default to first page only
    format = targetFormat
  } = parsedOptions;
  
  try {
    // PDF to text extraction
    if (targetFormat.toLowerCase() === 'txt') {
      const pdfBuffer = await fs.readFile(uploadPath);
      const pdfData = await pdfParse(pdfBuffer);
      await fs.writeFile(outputPath, pdfData.text);
      
      return {
        outputPath,
        outputFilename,
        success: true
      };
    }
    // PDF to image(s)
    else if (['jpg', 'jpeg', 'png'].includes(targetFormat.toLowerCase())) {
      // Configure pdf2pic
      const convertOptions = {
        density,
        quality,
        format: targetFormat.toUpperCase(),
        savePath: path.dirname(outputPath)
      };
      
      const converter = fromPath(uploadPath, convertOptions);
      
      // Convert specific pages or all pages
      if (pages.length === 1 && pages[0] === 1) {
        // Single page conversion (most common case)
        const result = await converter.convert(1);
        
        // Rename file to match expected output path
        await fs.rename(result.path, outputPath);
      } else {
        // Multiple pages conversion
        const pagesToConvert = pages[0] === 'all' 
          ? await getPageCount(uploadPath)
          : pages;
        
        // Convert all specified pages
        const results = await converter.bulk(pagesToConvert);
        
        // If only converting to a single page, we're done
        if (results.length === 1) {
          await fs.rename(results[0].path, outputPath);
        } else {
          // For multiple pages, create a directory and return the first file
          const outputDir = path.join(path.dirname(outputPath), path.basename(outputFilename, path.extname(outputFilename)));
          await fs.ensureDir(outputDir);
          
          // Move all generated images to the output directory
          for (let i = 0; i < results.length; i++) {
            const pageFilename = `page-${i + 1}.${targetFormat}`;
            await fs.rename(results[i].path, path.join(outputDir, pageFilename));
          }
          
          // Return the directory as output
          return {
            outputPath: outputDir,
            outputFilename: path.basename(outputDir),
            success: true
          };
        }
      }
      
      return {
        outputPath,
        outputFilename,
        success: true
      };
    } else {
      throw new Error(`Unsupported target format for PDF conversion: ${targetFormat}`);
    }
  } catch (error) {
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
};

/**
 * Get the total number of pages in a PDF file
 * @param {String} pdfPath - Path to the PDF file
 * @returns {Promise<Number>} Number of pages
 */
const getPageCount = async (pdfPath) => {
  const pdfBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  return pdfData.numpages;
};

module.exports = {
  convertPdf
}; 