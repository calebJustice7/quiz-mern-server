const jwt = require('jsonwebtoken');
const key = require('../config/keys');

module.exports = (req, res, next) => {
    try {
        let token = req.headers['authorization'].split(' ')[2];
        const decoded = jwt.verify(token, key.secretOrKey);
        req.userData = decoded;
        next();
    } catch(err){
        return res.status(401).json({"message": "Not authenticated"});
    }
}