/**
 * 简单的使用示例，无需 Express
 */
const path = require('path');
const converter = require('../index');

// 初始化转换器
converter.init();

// 样例：转换图片
async function convertImage(sourcePath, format, options = {}) {
  try {
    console.log(`开始转换图片: ${sourcePath} 到 ${format} 格式...`);
    
    const result = await converter.convert(
      sourcePath,
      format,
      {
        ...options,
        // 不要删除源文件（示例中使用）
        cleanupAfterConversion: false
      }
    );
    
    console.log(`图片转换成功! 输出路径: ${result.outputPath}`);
    return result;
  } catch (error) {
    console.error(`图片转换失败: ${error.message}`);
    throw error;
  }
}

// 样例：使用特定转换器
async function convertPdfToImage(pdfPath, imageFormat) {
  try {
    console.log(`开始将PDF转换为图片: ${pdfPath} 到 ${imageFormat} 格式...`);
    
    const result = await converter.pdfConverter.convertPdf(
      pdfPath,
      imageFormat,
      {
        quality: 100,
        density: 300,
        pages: [1, 2] // 转换前两页
      }
    );
    
    console.log(`PDF转换成功! 输出路径: ${result.outputPath}`);
    return result;
  } catch (error) {
    console.error(`PDF转换失败: ${error.message}`);
    throw error;
  }
}

// 运行样例（如果直接执行此文件）
if (require.main === module) {
  // 这里放入你想要转换的文件路径
  const imagePath = path.join(__dirname, 'sample.jpg');

  // 转换图片示例
  convertImage(imagePath, 'png', { 
    width: 800,
    quality: 90 
  }).then(() => {
    console.log('示例执行完成');
  }).catch(err => {
    console.error('示例执行失败:', err);
  });
  
  // 注释: 要运行PDF示例，取消下面的注释并提供PDF路径
  /*
  const pdfPath = path.join(__dirname, 'sample.pdf');
  convertPdfToImage(pdfPath, 'jpg').then(() => {
    console.log('PDF示例执行完成');
  });
  */
} 