const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
    destination: './uploads',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 } // Limit file size if needed
}).single('file');

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((err) => {
    console.error('Failed to connect to MongoDB Atlas', err);
});

// Create a Mongoose model for the uploaded files
const File = mongoose.model('File', {
    filename: String,
    path: String
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the public folder
app.use(express.static('public'));

// Home page route
app.get('/', (req, res) => {
    res.render('upload');
});

// File upload route
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('upload', { error: err });
        } else {
            // Save the file details to MongoDB
            const file = new File({
                filename: req.file.filename,
                path: req.file.path
            });

            file.save()
                .then(() => {
                    res.redirect('/files');
                })
                .catch((err) => {
                    console.error('Failed to save file', err);
                    res.render('upload', { error: 'Failed to save file' });
                });
        }
    });
});

// Display uploaded files route
app.get('/files', (req, res) => {
    File.find()
        .then((files) => {
            res.render('files', { files: files });
        })
        .catch((err) => {
            console.error('Failed to fetch files', err);
            res.render('files', { files: [] });
        });
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});