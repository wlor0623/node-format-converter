/**
 * 创建 Express 路由
 * 注意：这个模块需要安装 express 和 multer 才能使用
 */

// 检查必要的依赖是否存在
const checkDependencies = () => {
  try {
    // 动态引入 express 和 multer
    require('express');
    require('multer');
    return true;
  } catch (error) {
    throw new Error(
      'Express and Multer are required for using this router. ' +
      'Please install them with: npm install express multer'
    );
  }
};

/**
 * 创建转换服务的 Express 路由
 * @param {Object} options - 配置选项
 * @returns {Object} Express 路由对象
 */
const createRouter = (options = {}) => {
  // 确保依赖已安装
  if (!checkDependencies()) return null;
  
  // 动态引入依赖
  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs-extra');
  const { cleanupFiles, determineFileType, ensureDirectories } = require('./utils/fileHelper');
  
  // 引入转换器
  const { convertImage } = require('./services/imageConverter');
  const { convertVideo } = require('./services/videoConverter');
  const { convertAudio } = require('./services/audioConverter');
  const { convertDocument } = require('./services/docConverter');
  const { convertExcel } = require('./services/excelConverter');
  const { convertPdf } = require('./services/pdfConverter');

  // 创建 Express 路由
  const router = express.Router();
  
  // 确保必要的目录存在
  const { uploadsDir, convertedDir } = ensureDirectories(options);
  
  // 配置 multer 上传
  const upload = multer({
    dest: uploadsDir,
    limits: {
      fileSize: options.maxFileSize || 100 * 1024 * 1024, // 默认 100MB
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
    let { options: conversionOptions } = req.body;
    
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
    
    // 解析选项
    if (conversionOptions && typeof conversionOptions === 'string') {
      try {
        conversionOptions = JSON.parse(conversionOptions);
      } catch (error) {
        await cleanupFiles(file.path);
        return res.status(400).json({ 
          error: 'Invalid options JSON format' 
        });
      }
    } else {
      conversionOptions = {};
    }
    
    // 添加输出目录到选项
    conversionOptions.outputDir = convertedDir;
    
    try {
      let result;
      
      // 根据文件类型选择合适的转换器
      switch (type.toLowerCase()) {
        case 'image':
          result = await convertImage(file, format, conversionOptions);
          break;
        case 'video':
          result = await convertVideo(file, format, conversionOptions);
          break;
        case 'audio':
          result = await convertAudio(file, format, conversionOptions);
          break;
        case 'doc':
        case 'document':
          result = await convertDocument(file, format, conversionOptions);
          break;
        case 'excel':
        case 'spreadsheet':
          result = await convertExcel(file, format, conversionOptions);
          break;
        case 'pdf':
          result = await convertPdf(file, format, conversionOptions);
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
        if (conversionOptions.cleanupAfterDownload !== false) {
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