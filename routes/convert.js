const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { cleanupFiles, determineFileType } = require('../utils/fileHelper');

// Import converters
const { convertImage } = require('../services/imageConverter');
const { convertVideo } = require('../services/videoConverter');
const { convertAudio } = require('../services/audioConverter');
const { convertDocument } = require('../services/docConverter');
const { convertExcel } = require('../services/excelConverter');
const { convertPdf } = require('../services/pdfConverter');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit
  }
});

/**
 * Main conversion route
 * POST /convert
 * 
 * Request body (multipart/form-data):
 * - file: The file to convert
 * - type: File type (image, video, audio, doc, pdf, excel) - 可选，如果不提供会自动判断
 * - format: Target format (jpg, mp4, mp3, pdf, etc.)
 * - options: JSON string with conversion options
 */
router.post('/', upload.single('file'), async (req, res) => {
  const { file } = req;
  
  // Check if file exists
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Get conversion parameters
  let { type, format } = req.body;
  let { options } = req.body;
  
  // 如果没有提供类型，尝试自动检测
  if (!type) {
    type = determineFileType(file.originalname);
    if (!type) {
      await cleanupFiles(file.path);
      return res.status(400).json({ 
        error: 'Could not determine file type. Please provide a type parameter.' 
      });
    }
  }
  
  // 检查格式参数
  if (!format) {
    await cleanupFiles(file.path);
    return res.status(400).json({ 
      error: 'Missing required parameter: format' 
    });
  }
  
  // Parse options if provided
  if (options && typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (error) {
      await cleanupFiles(file.path);
      return res.status(400).json({ 
        error: 'Invalid options JSON format' 
      });
    }
  } else {
    options = {};
  }
  
  try {
    let result;
    
    // Select the appropriate converter based on file type
    switch (type.toLowerCase()) {
      case 'image':
        result = await convertImage(file, format, options);
        break;
      case 'video':
        result = await convertVideo(file, format, options);
        break;
      case 'audio':
        result = await convertAudio(file, format, options);
        break;
      case 'doc':
      case 'document':
        result = await convertDocument(file, format, options);
        break;
      case 'excel':
      case 'spreadsheet':
        result = await convertExcel(file, format, options);
        break;
      case 'pdf':
        result = await convertPdf(file, format, options);
        break;
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
    
    // Return the converted file
    res.download(result.outputPath, result.outputFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      
      // Clean up files after sending
      cleanupFiles(file.path, result.outputPath);
    });
  } catch (error) {
    // Clean up the uploaded file on error
    await cleanupFiles(file.path);
    
    // Log the error and return appropriate response
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: `Conversion failed: ${error.message}` 
    });
  }
});

module.exports = router; 