const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

// Folder to publish (can be changed via command line argument)
const PUBLISH_FOLDER = process.argv.length > 2 ? path.resolve(process.cwd(), process.argv[2]) : process.cwd();

// Middleware to parse static files
app.use('/static', express.static(PUBLISH_FOLDER));

// Helper function to get file stats and format them
async function getFileInfo(filePath, fileName) {
  const stats = await fs.stat(filePath);
  return {
    name: fileName,
    isDirectory: stats.isDirectory(),
    size: stats.isDirectory() ? '-' : formatBytes(stats.size),
    modified: stats.mtime.toLocaleString(),
    path: filePath
  };
}

// Format bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Browse and list files
app.get('*', async (req, res) => {
  try {
    const requestedPath = decodeURIComponent(req.path);
    const fullPath = path.join(PUBLISH_FOLDER, requestedPath);
    
    // Security check: ensure path is within PUBLISH_FOLDER
    const resolvedPath = path.resolve(fullPath);
    const resolvedBase = path.resolve(PUBLISH_FOLDER);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return res.status(403).send('Access denied');
    }

    const stats = await fs.stat(fullPath);

    // If it's a file, download it
    if (stats.isFile()) {
      return res.download(fullPath);
    }

    // If it's a directory and download query param is present, zip and download
    if (stats.isDirectory() && req.query.download === 'true') {
      const folderName = path.basename(fullPath) || 'folder';
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.attachment(`${folderName}.zip`);
      archive.pipe(res);
      
      archive.directory(fullPath, false);
      await archive.finalize();
      return;
    }

    // If it's a directory, list contents
    if (stats.isDirectory()) {
      const files = await fs.readdir(fullPath);
      const fileInfos = await Promise.all(
        files.map(file => getFileInfo(path.join(fullPath, file), file))
      );

      // Sort: directories first, then by name
      fileInfos.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Generate HTML
      const currentPath = requestedPath === '/' ? '' : requestedPath;
      const parentPath = currentPath ? path.dirname(currentPath) : null;
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Publish Folder - ${currentPath || '/'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      flex: 1;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .breadcrumb {
      font-size: 14px;
      opacity: 0.9;
    }
    .download-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }
    .download-btn:hover {
      background: #2980b9;
    }
    .breadcrumb a {
      color: #3498db;
      text-decoration: none;
    }
    .breadcrumb a:hover {
      text-decoration: underline;
    }
    .file-list {
      list-style: none;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid #ecf0f1;
      transition: background 0.2s;
    }
    .file-item:hover {
      background: #f8f9fa;
    }
    .file-icon {
      width: 24px;
      margin-right: 12px;
      font-size: 20px;
    }
    .file-name {
      flex: 1;
      color: #2c3e50;
      text-decoration: none;
      font-weight: 500;
    }
    .file-name:hover {
      color: #3498db;
    }
    .file-size {
      width: 100px;
      text-align: right;
      color: #7f8c8d;
      font-size: 14px;
      margin-right: 20px;
    }
    .file-date {
      width: 200px;
      text-align: right;
      color: #7f8c8d;
      font-size: 14px;
    }
    .empty {
      padding: 40px 20px;
      text-align: center;
      color: #7f8c8d;
    }
    .back-link {
      background: #ecf0f1;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .file-size, .file-date {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>📁 Published Folder</h1>
        <div class="breadcrumb">
          <a href="/">${path.basename(PUBLISH_FOLDER)}</a>${currentPath.split('/').filter(p => p).map((part, i, arr) => {
            const pathTo = '/' + arr.slice(0, i + 1).join('/');
            return ` / <a href="${pathTo}">${part}</a>`;
          }).join('')}
        </div>
      </div>
      <a href="?download=true" class="download-btn">📥 Download Folder</a>
    </div>
    <ul class="file-list">
      ${parentPath !== null ? `
      <li class="file-item back-link">
        <span class="file-icon">⬆️</span>
        <a href="${parentPath || '/'}" class="file-name">..</a>
        <span class="file-size"></span>
        <span class="file-date"></span>
      </li>
      ` : ''}
      ${fileInfos.length === 0 ? '<li class="empty">This folder is empty</li>' : ''}
      ${fileInfos.map(file => {
        const icon = file.isDirectory ? '📁' : '📄';
        const filePath = path.join(currentPath, file.name);
        return `
        <li class="file-item">
          <span class="file-icon">${icon}</span>
          <a href="${filePath}" class="file-name">${file.name}</a>
          <span class="file-size">${file.size}</span>
          <span class="file-date">${file.modified}</span>
        </li>
        `;
      }).join('')}
    </ul>
  </div>
</body>
</html>
      `;
      
      res.send(html);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).send('File or directory not found');
    } else {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 File server running!`);
  console.log(`📂 Publishing folder: ${PUBLISH_FOLDER}`);
  console.log(`🌐 Browse at: http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
