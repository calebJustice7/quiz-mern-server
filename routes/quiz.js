const express = require('express');
const router = express.Router();;
const Quiz = require('../models/Quiz');
const checkAuth = require('../middleware/check-auth');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const schema = require('mongoose');

router.post('/create-quiz', checkAuth, (req, res) => {
    if(!req.body.quizName || !req.body.description || !req.body.category) {
        res.json({"message": "Fill in all fields!"});
        return;
    }

    let { quizName, description, category, mustBeAuth, makePrivate } = req.body;
    let newQuiz = new Quiz({
        quizName,
        typeOfQuestions: req.body.questionType,
        createdBy: req.body.name,
        id: req.body._id,
        description,
        category,
        mustBeAuth,
        likes: 0,
        views: 0,
        questions: [],
        viewers: [],
        comments: [],
        makePrivate
    })

    newQuiz.save().then((data) => {
        res.json({"message": "Quiz created!", "data": data})
    }).catch((err) => console.log(err));
});

router.post('/get-users-quizzes', (req, res) => {
    if(!req.body._id) {
        return res.json({"message": "Something went wrong, try again"});
    }
    const db = mongoose.connection;
    db.collection('quizzes').find({id: {$eq: req.body._id}}, (err, cursor) => {
        let query = cursor.toArray().then(resp => {
            if(resp.length == 0) {
                res.json({"message": "no quizzes found", "data": []});
            } else {
                res.json({"message": "success", "data": resp})
            }
        }).catch(err => console.log(err));
    })
})

router.post('/add-question', (req, res) => {
    Quiz.findOne({_id: req.body._id}).then(foundObj => {
        foundObj.questions.push({
            questionName: req.body.questionName,
            answers: req.body.answers,
            correctAnswer: req.body.correctAnswer
        });
        foundObj.save();
        let data = foundObj.questions[foundObj.questions.length - 1];
        res.json({"message": "Question added!", "data": data})
    }).catch(err => console.log(err));
})

router.post('/like-quiz', async (req, res) => {
    let data;
    let { userId, quizId } = req.body;
    let continueAdd = true;
    await User.findOne({_id: userId}).then(foundObj => {
        if(foundObj.likedQuizzes.includes(quizId)) {
            data = foundObj.likedQuizzes[foundObj.likedQuizzes.length - 1];
            continueAdd = false;
            return;
        }
        foundObj.likedQuizzes.push(quizId);
        foundObj.save();
        data = foundObj.likedQuizzes[foundObj.likedQuizzes.length - 1];
    }).catch(err => console.log(err));

    Quiz.findOne({_id: quizId}).then(foundObj => {
        if(continueAdd) {
            foundObj.likes++;
            foundObj.save();
        }
        res.json({"message": "success", "data": {"newLikes": foundObj.likes, likedQuizzes: data}})
    }).catch(err => console.log(err));
})

router.post('/unlike', async (req, res) => {
    let cont = true;
    let { userId, quizId } = req.body;
    await User.findOne({_id: userId}).then(foundObj => {
        let idx = foundObj.likedQuizzes.indexOf(quizId);
        if(idx != -1) {
            foundObj.likedQuizzes.splice(idx, 1);
            foundObj.save();
        } else {
            cont = false;
        }
    }).catch(err => console.log(err));

    await Quiz.findOne({_id: quizId}).then(foundObj => {
        if(cont) {
            foundObj.likes--;
            foundObj.save();
        }
        res.json({"message": "success"})
    }).catch(err => console.log(err));
})

router.post('/get-quiz', (req, res) => {
    let isVerified = schema.Types.ObjectId.isValid(req.body._id);
    if(!isVerified) {
        res.json({"message": "No quiz found"});
        return;
    };
    Quiz.findOne({_id: req.body._id}).then(data => {
        res.json({"message": "success", "data": data})
    }).catch(err => console.log(err));
})

router.post('/get-all-quizzes', (req, res) => {
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
    Quiz.find({makePrivate: false, Date: {
        $lt: newDate,
        $gte: `${year}-${newMonth}-01T01:09:26.613Z`
    }}).then(data => {
        res.send(data);
    })
})

router.post('/change-publicity', (req, res) => {
    Quiz.findOne({_id: req.body._id}).then(data => {
        data.makePrivate = !req.body.publicity;
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post("/new-group", (req, res) => {
    let newGroup = new Group({
        users: [],
        quizzes: [],
        createdById: req.body.createdById,
        createdByName: req.body.createdByName,
        name: req.body.name
    })

    newGroup.save().then((data) => {
        res.json({"message": "success", "data": data})
    }).catch((err) => console.log(err));
})

router.post("/my-groups", (req, res) => {
    let id = req.body._id;
    Group.find({createdById: id}).then(data => {
        res.json({"message": "success", "data": data})
    })
})

router.post('/get-group', (req, res) => {
    Group.findOne({_id: req.body._id}).then(data => {
        res.json({"message": "success", "data": data})
    })
})

router.post('/add-user-to-group', (req, res) => {
    Group.findOne({_id: req.body.groupId}).then(data => {
        data.users.push(req.body._id);
        data.save();
        res.json({"message": "success", "data": data});
    })
})

router.post('/unadd-from-group', (req, res) => {
    Group.findOne({_id: req.body.groupId}).then(data => {
        if(data.users.length === 0) return;
        let idx = data.users.indexOf(req.body._id);
        data.users.splice(idx, 1);
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post('/get-quizzes', (req, res) => {
    if(req.body.ids.length === 0) {
        res.json({"message": "unsuccess"});
        return;
    }
    Quiz.find({_id: {$in: req.body.ids}}).then(data => {
        res.json({"message": "success", "data": data})
    })
})

router.post('/share-quiz', (req, res) => {
    Group.findOne({_id: req.body.groupId}).then(data => {
        if(data.quizzes.includes(req.body.quizId)) {
            res.json({"message": "success", "data": data});
            return;
        }
        data.quizzes.push(req.body.quizId);
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post('/unshare-quiz', (req, res) => {
    Group.findOne({_id: req.body.groupId}).then(data => {
        if(!data.quizzes.includes(req.body.quizId)) {
            res.json({"message": "success", "data": data});
            return;
        }
        let idx = data.quizzes.indexOf(req.body.quizId);
        data.quizzes.splice(idx, 1);
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post('/delete-group', (req, res) => {
    Group.deleteOne({_id: req.body._id}).then(data => {
        res.json({"message": "success"})
    })
})

router.post('/unadd-quiz-from-group', (req, res) => {
    Group.findOne({_id: req.body.groupId}).then(data => {
        let idx = data.quizzes.indexOf(req.body._id);
        data.quizzes.splice(idx, 1);
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post('/get-involved-quizzes', (req, res)=>{
    Group.find({users: {$in: req.body._id}}).then(data => {
        res.json({"message": "success", "data": data})
    })
})

router.post('/search-for-quizzes', (req, res) => {
    Quiz.find({quizName: {$regex: req.body.quizName, $options: 'i'}}).then(data => {
        res.json({"message": "success", "data": data});
    })
})

router.post('/add-comment', (req, res) => {
    Quiz.findOne({_id: req.body.quizId}).then(data => {
        let comment = {
            sentFromName: req.body.sentFromName,
            sentFromId: req.body.sentFromId,
            sentFromPicture: req.body.sentFromPicture,
            date: req.body.date,
            comment: req.body.comment
        }
        if(data.id === req.body.sentFromId) {
            data.comments.unshift(comment);
        } else {
            data.comments.push(comment);
        }
        data.save();
        res.json({"message": "success", "data": data})
    })
})

router.post('/delete-quiz', checkAuth, async (req, res) => {
    await Quiz.deleteOne({_id: req.body._id}).then(data => {
        res.json({"message": "success"})
    });
})

router.post("/delete-question", (req, res) => {
    Quiz.findOne({_id: req.body._id}).then(data => {
        let idx = data.questions.findIndex(ques => {
            return ques.questionName === req.body.question.questionName
        })
        data.questions.splice(idx,1);
        data.save();
        res.json({"message": "success", "data": data})
    })
})

module.exports = router;