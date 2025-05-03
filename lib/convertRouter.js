const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { cleanupFiles, determineFileType, ensureDirectories } = require('./utils/fileHelper');

// Import converters
const { convertImage } = require('./services/imageConverter');
const { convertVideo } = require('./services/videoConverter');
const { convertAudio } = require('./services/audioConverter');
const { convertDocument } = require('./services/docConverter');
const { convertExcel } = require('./services/excelConverter');
const { convertPdf } = require('./services/pdfConverter');

// 创建Express路由
const createRouter = (options = {}) => {
  const router = express.Router();
  
  // 确保必要的目录存在
  const { uploadsDir, convertedDir } = ensureDirectories(options);
  
  // 配置multer用于文件上传
  const upload = multer({
    dest: uploadsDir,
    limits: {
      fileSize: options.maxFileSize || 100 * 1024 * 1024, // 默认100MB
    }
  });
  
  /**
   * 主转换路由
   * POST /convert
   * 
   * 请求体 (multipart/form-data):
   * - file: 要转换的文件
   * - type: 文件类型，可选，如不提供会自动判断
   * - format: 目标格式
   * - options: JSON字符串，可选参数
   */
  router.post('/', upload.single('file'), async (req, res) => {
    const { file } = req;
    
    // 检查文件是否存在
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 获取转换参数
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
    
    // 解析选项（如果有）
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
    
    // 添加输出目录到选项
    options.outputDir = convertedDir;
    
    try {
      let result;
      
      // 根据文件类型选择合适的转换器
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
      
      // 返回转换后的文件
      res.download(result.outputPath, result.outputFilename, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
        
        // 下载后清理文件
        if (options.cleanupAfterDownload !== false) {
          cleanupFiles(file.path, result.outputPath);
        }
      });
    } catch (error) {
      // 出错时清理上传的文件
      await cleanupFiles(file.path);
      
      // 记录错误并返回适当的响应
      console.error('Conversion error:', error);
      res.status(500).json({ 
        error: `Conversion failed: ${error.message}` 
      });
    }
  });
  
  return router;
};

module.exports = createRouter; 