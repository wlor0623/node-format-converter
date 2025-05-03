const fs = require('fs-extra');
const path = require('path');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { generatePaths } = require('../utils/fileHelper');

/**
 * Convert between Excel and CSV formats
 * @param {Object} file - Uploaded file object
 * @param {String} targetFormat - Target format (xlsx, csv)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Result with output path and filename
 */
const convertExcel = async (file, targetFormat, options = {}) => {
  // Generate paths
  const { uploadPath, outputPath, outputFilename } = generatePaths(file, targetFormat);
  
  // Parse options
  const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
  
  // Set default options
  const { 
    sheetName = 'Sheet1',
    delimiter = ','
  } = parsedOptions;
  
  const sourceExt = path.extname(file.originalname).toLowerCase();
  const targetExt = `.${targetFormat.toLowerCase()}`;
  
  try {
    // Excel to CSV
    if ((sourceExt === '.xlsx' || sourceExt === '.xls') && targetExt === '.csv') {
      const workbook = XLSX.readFile(uploadPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvContent = XLSX.utils.sheet_to_csv(sheet, { FS: delimiter });
      
      await fs.writeFile(outputPath, csvContent, 'utf8');
    }
    // CSV to Excel
    else if (sourceExt === '.csv' && (targetExt === '.xlsx' || targetExt === '.xls')) {
      const rows = [];
      
      // Read CSV file and parse rows
      await new Promise((resolve, reject) => {
        fs.createReadStream(uploadPath)
          .pipe(csv({ separator: delimiter }))
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write Excel file
      XLSX.writeFile(workbook, outputPath);
    } else {
      throw new Error('Unsupported conversion format');
    }
    
    return {
      outputPath,
      outputFilename
    };
  } catch (error) {
    throw new Error(`Excel/CSV conversion failed: ${error.message}`);
  }
};

module.exports = {
  convertExcel
}; 