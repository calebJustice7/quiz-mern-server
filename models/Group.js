const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
    createdById: String,
    users: Array,
    createdByName: String,
    quizzes: Array,
    name: String
});

module.exports = Group = mongoose.model('Groups', GroupSchema);