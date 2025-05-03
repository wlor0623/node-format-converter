const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const convertRouter = require('./routes/convert');

// Create the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload and convert directories exist
fs.ensureDirSync(path.join(__dirname, 'uploads'));
fs.ensureDirSync(path.join(__dirname, 'converted'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/convert', convertRouter);

// Default route
app.get('/', (req, res) => {
  res.send('hi');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 