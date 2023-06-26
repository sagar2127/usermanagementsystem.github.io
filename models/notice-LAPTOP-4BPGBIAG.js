const mongoose = require('mongoose');
const moment = require('moment');

const noticeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true,

    }


});

const Notices = mongoose.model('Notices', noticeSchema);

module.exports = Notices;