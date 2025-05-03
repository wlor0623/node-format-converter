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
  
  // Express 路由中间件
  getExpressRouter: () => require('./lib/convertRouter'),
  
  // 初始化函数
  init: () => {
    const dirs = ensureDirectories();
    return {
      ...dirs,
      ready: true
    };
  }
}; 