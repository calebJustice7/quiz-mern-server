const express = require('express');
const router = express.Router();
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const Users = require('../models/User');
const validator = require('../validators/validators');
const checkAuth = require('../middleware/check-auth');
const {cloudinary} = require('../config/cloudinary');

router.post('/get-all-users', (req, res) => {
    let newDate = new Date();
    let month = newDate.getMonth();
    let newMonth;
    let year = newDate.getFullYear();
    if(month == 0) {
        newMonth = 12;
        Number(year--)
    } else {
        newMonth = month;
    }
    if(newMonth < 10) {
        newMonth = `0${newMonth}`
    }

    Users.find({email: {$ne: req.body.email}, Date:{
        $lt: newDate,
        $gte: `${year}-${newMonth}-01T01:09:26.613Z`
    }}).then(resp => {
        res.json({"message": "success", "data": resp});
    })
})

router.post('/search-for-users', (req, res) => {
    Users.find({firstName: {$regex: req.body.name, $options: 'i'}, email: {$ne: req.body.email}}).then(data => {
        if(data.length === 0) {
            Users.find({lastName: {$regex: req.body.name, $options: 'i'}, email: {$ne: req.body.email}}).then(data2 => {
                if(data2.length === 0) {
                    res.json({"message": "success", "data": data2})
                } else {
                    res.json({"message": "success", "data": data2})
                }
            });
            return;
        }
        res.json({"message": "success", "data": data})
    })
})

router.post('/get-users', (req, res) => {
    if(req.body.ids.length === 0) {
        res.json({"message": "unsuccess"});
        return;
    }
    Users.find({_id: {$in: req.body.ids}}).then(data => {
        res.json({"message": "success", "data": data})
    }).catch(() => console.log('err'))
})

router.post('/get-user', (req, res) => {
    Users.findOne({_id: req.body._id}).then(data => {
        if(data != null) res.json({"message": "success", "data": data});
        else res.json({"message": "unsuccess"})
    })
})

router.post('/login', (req, res) => {
    const { errors, isValid } = validator.loginValidator(req.body);
    if (!isValid) {
        res.status(404).json(errors);
    } else {
        Users.findOne({email: req.body.email})
            .then((user) => {
                if(!user) {
                    res.json({"message": "Email does not exist", "success": "false"})
                } else {
                    bcrypt.compare(req.body.password, user.password)
                    .then((isMatch) => {
                        if(!isMatch) {
                            res.json({'message': 'Password does not match', 'success': 'false'});
                        } else {
                            const payload = {
                                id: user._id,
                                name: user.firstName
                            }
                            jwt.sign(
                                payload,
                                keys.secretOrKey,
                                {
                                    expiresIn: 2155926
                                },
                                (err, token) => {
                                    res.json({
                                        user: user,
                                        token: 'Bearer token: ' + token,
                                        success: true,
                                        message: 'Signed in successfully!'
                                    })
                                }
                            )
                        }
                    })
                }
            })
    }
})

router.post('/upload-image', async (req, res) => {
    try {
        const fileStr = req.body.data;
        const uploadedResponse = await cloudinary.uploader.upload(fileStr);
        Users.findOne({_id: req.body._id}).then(data => {
            data.profilePicture = uploadedResponse.url;
            data.save();
            res.json({"message": "Image Saved", "data": uploadedResponse.url})
        })
    } catch (error) {
        res.json({"message": "SOMETHING WENT WRONG"});
        console.log('error');
    }
})

router.post('/register', (req, res) => {
    const { errors, isValid } = validator.registerValidator(req.body);
    if (!isValid) {
        res.status(404).json(errors);
    } else {
        Users.findOne({ email: req.body.email })
            .then((user) => {
                if (user) {
                    res.json({ "message": "Email is already in use!", "success": "false" });
                } else {
                    const registerUser = new Users({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: req.body.password,
                        likedQuizzes: [],
                        quizzesTaken: [],
                        profilePicture: ''
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(registerUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            registerUser.password = hash;
                            registerUser.save().then((user) => {
                                res.json({"message": "User created successfully!", "success": "true"});
                            })
                                .catch((err) => console.log(err));
                        })
                    })
                }
            })
    }
})

module.exports = router;