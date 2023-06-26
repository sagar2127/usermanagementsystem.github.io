const mongoose = require('mongoose');
const moment = require('moment');

const studentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true,

    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        require: true,
    },
    wing: {
        type: String,
        enum: ['Air-Wing', 'Army-Wing', 'Navy-Wing'],
        required: true
    }
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;