const express = require('express');
const multer = require('multer');
const uuid = require('uuid').v4;
const fs = require('fs-extra');
const path = require('path');

const app = express();
const port = 3000;

// Directory for storing files
const uploadDir = path.join(__dirname, 'uploads');

// Ensure the upload directory exists
fs.ensureDirSync(uploadDir);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // store files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Generate unique filename using UUID
    const uniqueName = uuid() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter to validate uploaded files (e.g., allow only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Modify as needed
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Create multer instance
const upload = multer({ storage, fileFilter });

// Endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully', fileId: req.file.filename });
});

// Endpoint to retrieve files by their unique identifier
app.get('/files/:fileId', (req, res) => {
  const filePath = path.join(uploadDir, req.params.fileId);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Endpoint to delete a file
app.delete('/files/:fileId', (req, res) => {
  const filePath = path.join(uploadDir, req.params.fileId);

  if (fs.existsSync(filePath)) {
    fs.removeSync(filePath); // Delete the file
    res.json({ message: 'File deleted successfully' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Endpoint to rename a file
app.put('/files/:fileId/rename', (req, res) => {
  const oldFilePath = path.join(uploadDir, req.params.fileId);
  const newFileName = req.query.newName; // Assuming new file name is passed in the query parameter
  const newFilePath = path.join(uploadDir, newFileName);

  if (fs.existsSync(oldFilePath)) {
    fs.renameSync(oldFilePath, newFilePath); // Rename the file
    res.json({ message: 'File renamed successfully', newFileName });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Endpoint to move a file to a different directory
app.put('/files/:fileId/move', (req, res) => {
  const oldFilePath = path.join(uploadDir, req.params.fileId);
  const newDirectory = req.query.newDirectory; // New directory passed in query parameter
  const newFilePath = path.join(newDirectory, req.params.fileId);

  if (fs.existsSync(oldFilePath)) {
    fs.ensureDirSync(newDirectory); // Ensure the new directory exists
    fs.moveSync(oldFilePath, newFilePath); // Move the file
    res.json({ message: 'File moved successfully', newLocation: newFilePath });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
