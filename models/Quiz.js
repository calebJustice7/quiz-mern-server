const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
    quizName: {
        type: String,
        required: true
    },
    typeOfQuestions: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    makePrivate: {
        type: Boolean
    },
    mustBeAuth: {
        type: Boolean,
        required: true
    },
    likes: {
        type: Number,
    },
    views: {
        type: Number,
    },
    questions: {
        type: Array,
    },
    viewers: {
        type: Array
    },
    comments: {
        type: Array
    },
    Date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: true
    },
    id: {
        type: String
    }
});

module.exports = Quiz = mongoose.model('Quizzes', QuizSchema);