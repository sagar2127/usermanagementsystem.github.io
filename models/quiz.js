// quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;

const leaderboardSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;