const keys = require('./keys');
const mongoose = require('mongoose');
const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;

const Users = require('../models/User');

const opts = {};
opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

module.exports = passport => {
    passport.use(
        new jwtStrategy(opts, (jwtPayload, done) => {
            Users.findById(jwtPayload.id)
            .then((user) => {
                if(user) {
                    return done(null, user);
                } 
                return done(null, false);
            })
            .catch((Err) => console.log(Err));
        })
    );
}