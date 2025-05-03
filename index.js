/**
 * node-format-converter
 * Universal file format conversion library for Node.js
 */

const path = require('path');
const fs = require('fs-extra');

// 确保目录存在
const ensureDirectories = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const convertedDir = path.join(process.cwd(), 'converted');
  
  fs.ensureDirSync(uploadsDir);
  fs.ensureDirSync(convertedDir);
  
  return {
    uploadsDir,
    convertedDir
  };
};

// 检查是否安装了可选依赖
const hasExpressDependencies = () => {
  try {
    require.resolve('express');
    require.resolve('multer');
    return true;
  } catch (error) {
    return false;
  }
};

// 导出转换器模块
module.exports = {
  // 工具
  fileHelper: require('./lib/utils/fileHelper'),
  
  // 转换器服务
  imageConverter: require('./lib/services/imageConverter'),
  videoConverter: require('./lib/services/videoConverter'),
  audioConverter: require('./lib/services/audioConverter'),
  docConverter: require('./lib/services/docConverter'),
  excelConverter: require('./lib/services/excelConverter'),
  pdfConverter: require('./lib/services/pdfConverter'),
  
  // Express 路由中间件 (可选)
  getExpressRouter: (options = {}) => {
    if (!hasExpressDependencies()) {
      throw new Error(
        'Express and Multer are required for using the Express router. ' +
        'Please install them with: npm install express multer'
      );
    }
    const createRouter = require('./lib/convertRouter');
    return createRouter(options);
  },
  
  // 初始化函数
  init: (options = {}) => {
    const dirs = ensureDirectories(options);
    return {
      ...dirs,
      ready: true
    };
  },
  
  // 简单便捷的转换函数
  convert: async (filePath, targetFormat, options = {}) => {
    // 自动检测文件类型
    const { determineFileType } = require('./lib/utils/fileHelper');
    const fileType = options.type || determineFileType(filePath);
    
    if (!fileType) {
      throw new Error('Could not determine file type. Please specify options.type parameter.');
    }
    
    // 添加默认选项
    const convertOptions = { 
      ...options,
      cleanupAfterConversion: options.cleanupAfterConversion !== false
    };
    
    // 选择合适的转换器
    let result;
    switch (fileType.toLowerCase()) {
      case 'image':
        result = await require('./lib/services/imageConverter').convertImage(filePath, targetFormat, convertOptions);
        break;
      case 'video':
        result = await require('./lib/services/videoConverter').convertVideo(filePath, targetFormat, convertOptions);
        break;
      case 'audio':
        result = await require('./lib/services/audioConverter').convertAudio(filePath, targetFormat, convertOptions);
        break;
      case 'doc':
      case 'document':
        result = await require('./lib/services/docConverter').convertDocument(filePath, targetFormat, convertOptions);
        break;
      case 'excel':
      case 'spreadsheet':
        result = await require('./lib/services/excelConverter').convertExcel(filePath, targetFormat, convertOptions);
        break;
      case 'pdf':
        result = await require('./lib/services/pdfConverter').convertPdf(filePath, targetFormat, convertOptions);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // 可选的清理
    if (convertOptions.cleanupAfterConversion && options.cleanupFile !== false) {
      const { cleanupFiles } = require('./lib/utils/fileHelper');
      await cleanupFiles(filePath);
    }
    
    return result;
  }
}; 