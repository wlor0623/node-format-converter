const express = require('express');
const path = require('path');
const converter = require('../index');

// 初始化转换器，确保必要目录存在
const { uploadsDir, convertedDir } = converter.init();
console.log(`Uploads directory: ${uploadsDir}`);
console.log(`Converted files directory: ${convertedDir}`);

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 使用转换器的Express路由
app.use('/convert', converter.getExpressRouter({
  maxFileSize: 200 * 1024 * 1024, // 设置最大文件大小为200MB
}));

// 添加一个简单的前端页面，展示如何使用转换服务
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>文件格式转换器</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 5px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        select, input[type="file"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <h1>文件格式转换服务</h1>
      <div class="container">
        <form id="convertForm" enctype="multipart/form-data">
          <div class="form-group">
            <label for="file">选择文件:</label>
            <input type="file" id="file" name="file" required>
          </div>
          
          <div class="form-group">
            <label for="format">目标格式:</label>
            <select id="format" name="format" required>
              <option value="">-- 选择格式 --</option>
              <optgroup label="图片格式">
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="avif">AVIF</option>
                <option value="tiff">TIFF</option>
              </optgroup>
              <optgroup label="视频格式">
                <option value="mp4">MP4</option>
                <option value="avi">AVI</option>
                <option value="mkv">MKV</option>
                <option value="mov">MOV</option>
              </optgroup>
              <optgroup label="音频格式">
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="flac">FLAC</option>
                <option value="ogg">OGG</option>
              </optgroup>
              <optgroup label="文档格式">
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="pptx">PPTX</option>
              </optgroup>
              <optgroup label="表格格式">
                <option value="xlsx">XLSX</option>
                <option value="csv">CSV</option>
              </optgroup>
              <optgroup label="PDF处理">
                <option value="txt">提取文本 (TXT)</option>
              </optgroup>
            </select>
          </div>
          
          <div class="form-group">
            <label for="options">转换选项 (JSON格式，可选):</label>
            <input type="text" id="options" name="options" placeholder='{"quality": 90, "width": 800}'>
          </div>
          
          <button type="submit">开始转换</button>
        </form>
        
        <div id="result" style="margin-top: 20px; display: none;">
          <h3>转换结果</h3>
          <div id="resultContent"></div>
        </div>
      </div>
      
      <div style="margin-top: 30px;">
        <h2>使用说明</h2>
        <p>该服务支持多种文件格式的转换，包括图片、视频、音频、文档、表格和PDF处理。</p>
        <p>您也可以通过API直接使用该服务：</p>
        <pre>
POST /convert
Content-Type: multipart/form-data

参数:
- file: 文件
- format: 目标格式 (jpg, mp4, pdf等)
- options: 转换选项 (JSON格式)
        </pre>
      </div>
      
      <script>
        document.getElementById('convertForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const fileInput = document.getElementById('file');
          const format = document.getElementById('format').value;
          const options = document.getElementById('options').value;
          
          if (!fileInput.files[0]) {
            alert('请选择文件');
            return;
          }
          
          if (!format) {
            alert('请选择目标格式');
            return;
          }
          
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          formData.append('format', format);
          
          if (options) {
            formData.append('options', options);
          }
          
          try {
            const response = await fetch('/convert', {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              // 创建下载链接
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileInput.files[0].name.split('.')[0] + '.' + format;
              a.textContent = '下载转换后的文件';
              a.className = 'button';
              a.style.display = 'block';
              a.style.marginTop = '10px';
              a.style.textDecoration = 'none';
              a.style.padding = '10px 15px';
              a.style.backgroundColor = '#4CAF50';
              a.style.color = 'white';
              a.style.borderRadius = '4px';
              a.style.textAlign = 'center';
              
              document.getElementById('resultContent').innerHTML = '<p>文件转换成功! 👍</p>';
              document.getElementById('resultContent').appendChild(a);
              document.getElementById('result').style.display = 'block';
            } else {
              const error = await response.json();
              document.getElementById('resultContent').innerHTML = `<p>转换失败: ${error.error}</p>`;
              document.getElementById('result').style.display = 'block';
            }
          } catch (error) {
            document.getElementById('resultContent').innerHTML = `<p>错误: ${error.message}</p>`;
            document.getElementById('result').style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`- 转换服务endpoint: http://localhost:${PORT}/convert`);
  console.log(`- 交互式demo页面: http://localhost:${PORT}`);
}); 