const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const Users = require('./routes/users');
const Quiz = require('./routes/quiz');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const db = require('./config/keys').mongoURL;
mongoose.connect(db, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => console.log('db connected'))
.catch((err) => console.log(err));

require("./config/passport")(passport)
app.use(passport.initialize());

app.use('/users', Users);
app.use('/quiz', Quiz);

app.use('/register', (req, res) => {
    res.send('hello')
})

const port = process.env.PORT || 9000;

app.listen(port, () => console.log('Listening on port ', port));