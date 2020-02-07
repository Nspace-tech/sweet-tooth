const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");

//load User Model
const Admins = require("../models/Admin");

module.exports = passport => {
  passport.use(
    new LocalStrategy(
      {usernameField: "email", passwordField: "password"},
      (email, password, done) => {
        //Match User
        Admins.findOne({email: email})
          .then(user => {
            if (!user) {
              return done(null, false, {
                message: "That email is not registered."
              });
            }

            //Match Password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                return done(null, user);
              } else {
                return done(null, false, {message: "Password incorrect"});
              }
            });
          })
          .catch(err => console.log(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    Admins.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
