# node-format-converter

一个使用 Node.js 构建的通用文件格式转换库，支持多种文件类型的转换，无需 Express 即可使用。

## 功能特点

- **图片转换**：支持 jpg, png, webp, avif, tiff 等格式互转
- **视频转换**：支持 mp4, avi, mkv, mov 等格式转换
- **音频转换**：支持 mp3, wav, flac 等格式互转
- **文档转换**：支持 Word、PPT、PDF 互转
- **表格转换**：支持 Excel 和 CSV 互转
- **PDF 处理**：支持 PDF 转图片、提取文本
- **无依赖模式**：可以不依赖 Express，直接在任意 Node.js 项目中使用
- **Express 集成**：可选集成到 Express 应用中

## 安装

```bash
npm install node-format-converter
```

## 前置要求

- Node.js (v14+)
- 对于视频和音频转换：需要安装 FFmpeg
- 对于文档转换：需要安装 LibreOffice

## 使用方法

### 直接使用（无需 Express）

最简单的使用方式，直接调用转换函数：

```javascript
const converter = require('node-format-converter');

// 初始化（可选）
converter.init();

// 直接转换文件 - 最简单的 API
async function convertFile() {
  try {
    const result = await converter.convert(
      '/path/to/image.png',  // 源文件路径
      'jpg',                 // 目标格式
      {                      // 选项（可选）
        quality: 90,         // 图片质量
        width: 800,          // 输出宽度
        type: 'image'        // 可选，如不提供会自动判断
      }
    );
    
    console.log(`转换成功! 输出文件路径: ${result.outputPath}`);
    return result;
  } catch (error) {
    console.error('转换失败:', error);
  }
}
```

### 使用特定转换器

你也可以直接使用特定的转换器模块：

```javascript
const { imageConverter, pdfConverter } = require('node-format-converter');

// 使用图片转换器
async function convertImage() {
  try {
    const result = await imageConverter.convertImage(
      '/path/to/image.png',  // 文件路径
      'jpg',                 // 目标格式
      {                      // 选项（可选）
        width: 800,
        height: 600,
        quality: 90
      }
    );
    
    console.log(`图片转换成功! 输出文件路径: ${result.outputPath}`);
    return result;
  } catch (error) {
    console.error('图片转换失败:', error);
  }
}
```

### 在 Express 项目中集成（可选）

如果你想在 Express 应用中使用，需要安装额外的依赖：

```bash
npm install express multer
```

然后可以轻松将转换服务集成到 Express 应用中：

```javascript
const express = require('express');
const converter = require('node-format-converter');

// 初始化应用
const app = express();
converter.init(); // 确保目录存在

// 使用转换路由中间件
app.use('/convert', converter.getExpressRouter({
  maxFileSize: 100 * 1024 * 1024, // 100MB 限制
}));

// 启动服务器
app.listen(3000, () => {
  console.log('转换服务已启动，访问: http://localhost:3000/convert');
});
```

## API 文档

### 核心 API

#### `convert(filePath, targetFormat, options)`

最简单的转换 API，自动处理文件类型检测和转换。

```javascript
const result = await converter.convert('/path/to/file.jpg', 'png', {
  quality: 90,
  type: 'image' // 可选，如不提供会自动检测
});
```

#### `init(options)`

初始化转换器，创建必要的目录。

```javascript
converter.init({
  uploadsDir: '/custom/uploads/path', // 可选
  convertedDir: '/custom/converted/path' // 可选
});
```

### 专用转换器模块

- **imageConverter**: 图片转换服务
- **videoConverter**: 视频转换服务
- **audioConverter**: 音频转换服务
- **docConverter**: 文档转换服务
- **excelConverter**: 表格转换服务
- **pdfConverter**: PDF处理服务

### 各转换器方法

每个转换器模块都提供了相应的转换方法：

#### 图片转换

```javascript
const { outputPath } = await imageConverter.convertImage(file, targetFormat, options);
```

#### 视频转换

```javascript
const { outputPath } = await videoConverter.convertVideo(file, targetFormat, options);
```

#### 音频转换

```javascript
const { outputPath } = await audioConverter.convertAudio(file, targetFormat, options);
```

#### 文档转换

```javascript
const { outputPath } = await docConverter.convertDocument(file, targetFormat, options);
```

#### 表格转换

```javascript
const { outputPath } = await excelConverter.convertExcel(file, targetFormat, options);
```

#### PDF处理

```javascript
const { outputPath } = await pdfConverter.convertPdf(file, targetFormat, options);
```

### 参数说明

- **file/filePath**: 文件路径字符串或文件对象
- **targetFormat**: 目标格式（如'jpg', 'mp4', 'pdf'等）
- **options**: 选项对象，根据不同的转换类型有不同的选项

## 转换选项

### 通用选项

```javascript
{
  type: 'image',                  // 文件类型，可选（自动检测）
  cleanupAfterConversion: true,   // 转换后是否删除源文件
  outputDir: '/custom/output'     // 自定义输出目录
}
```

### 图片转换选项

```javascript
{
  width: 800,        // 输出宽度
  height: 600,       // 输出高度
  quality: 90,       // 质量 (1-100)
  fit: 'cover'       // 调整大小方式: cover, contain, fill 等
}
```

### 视频转换选项

```javascript
{
  resolution: '1280x720',   // 分辨率
  videoBitrate: '2000k',    // 视频比特率
  audioBitrate: '128k',     // 音频比特率
  fps: 30                   // 帧率
}
```

### 音频转换选项

```javascript
{
  audioBitrate: '192k',     // 音频比特率
  audioChannels: 2,         // 音频通道数
  sampleRate: 44100         // 采样率
}
```

### Excel/CSV 转换选项

```javascript
{
  sheetName: 'Sheet1',      // 工作表名称
  delimiter: ','            // CSV分隔符
}
```

### PDF 转换选项

```javascript
{
  density: 300,             // DPI
  quality: 100,             // 图像质量
  pages: [1, 2, 3]          // 要转换的页码 (或 ["all"] 表示全部)
}
```

## Express 路由 API（可选）

如果你安装了 Express 和 Multer，可以使用 `getExpressRouter()` 创建的路由：

### 文件转换接口

**端点**：`POST /convert`

**请求格式**：`multipart/form-data`

**参数说明**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| file  | File | 是   | 要转换的文件 |
| type  | String | 否  | 文件类型，如不提供，将根据文件后缀自动判断 |
| format | String | 是 | 目标格式，如 jpg, mp4, pdf 等 |
| options | String (JSON) | 否 | 转换参数，根据不同类型有不同选项 |

## 支持的文件类型和格式

### 图片
- 支持的格式：jpg/jpeg, png, webp, avif, tiff, bmp, gif, svg

### 视频
- 支持的格式：mp4, avi, mkv, mov, wmv, flv, webm, 3gp

### 音频
- 支持的格式：mp3, wav, flac, ogg, aac, m4a, wma

### 文档
- 支持的格式：doc, docx, ppt, pptx, pdf, odt, rtf

### 表格
- 支持的格式：xlsx, xls, csv

### PDF
- 可转换为：jpg, png, txt (文本提取)

## 注意事项

- 默认情况下，文件大小限制为 100MB（在 Express 路由中可配置）
- 转换完成后，原始文件会自动删除（可通过 `cleanupAfterConversion: false` 选项禁用）
- 使用自动类型检测功能时，如果无法识别文件类型，请明确指定 `type` 参数

## 许可

MIT 