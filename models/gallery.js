const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;