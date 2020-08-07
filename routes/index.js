const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var mongoose = require("mongoose");
var multer = require("multer");
mongoose.Promise = global.Promise;
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("../config/passport")(passport);
const winston = require('winston');

// Logger configuration
const logConfiguration = {
  "transports":[
      new winston.transports.File({
          filename:"./views/index.log"
      })
      ]
};
// create logger
const logger = winston.createLogger(logConfiguration);


var cors = require("cors");
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");


const Admins = require("../models/Admin");
const Menus = require("../models/Menu");
const Contacts = require("../models/Contact");

mongoose.set("useCreateIndex", true);

const uri =
  "mongodb+srv://***********************************";
const client = mongoose.createConnection(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client
  .once("open", () => {
    logger.info("Bakery database connected!")
    console.log('Bakery database connected');
    
  })
  .catch(err => {
    logger.info(err)
    console.log(err);
    
  });

//authentication
const { ensureAuthenticated } = require('../config/auth');


router.get("/", (req, res) => { res.render("home"); });
router.get('/menu', (req,res) => {
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        Menus.find()
          .sort({time: -1})
          .exec((err, docs) => {
            if (err) return next(err);
            res.render("menu", {alldocs: docs});
          });
      })
    client.close();
  });
  //about
  router.get('/about', (req, res) => res.render('about'));
  //contact
  router.get('/contact', (req, res) => res.render('contact'));
  router.post("/contact", (req, res) => {
    var myData = new Contacts(req.body);
  
    myData.save();
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        res.redirect("contact");
      })
    client.close();
  });
  
  
  //admin login
  router.get("/index", ensureAuthenticated, (req, res) => res.render("index"));
  router.get("/logs", (req,res)=> res.render("info"));
  
  // SET STORAGE
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
  });
   
  var upload = multer({ storage: storage });
  
  router.get("/admenu", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        Menus.find()
          .exec((err, docs) => {
            if (err) return next(err);
            res.render("admenu", {alldocs: docs});
          });
      })
    client.close();
  });
  
  router.post('/uploadpicture', upload.single('myImage'), ensureAuthenticated, function (req, res){ 
      var newItem = new Menus({
        description: req.body.description,
        filename: req.file.filename
      });
  
      newItem.save(); 
      mongoose
        .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(client => {
          res.redirect("admenu");
        })
        .catch(err => {
        });
      client.close();
  });  
  
  router.get("/edit/:id", ensureAuthenticated, (req, res) => {
    mongoose
    .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(client => {
       Menus.findById({_id: req.params.id}, (err, docs) => {
         if (err) throw err;
         console.log(docs);
         res.render("./edit", {docs: docs});
       });
    })
    client.close();
  })
  
  router.post("/edit/:id", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .then(client => {
        Menus.findOneAndUpdate(
          req.params.id,
          {$set: {description: req.body.description}},
          {new: true},
          (err, doc) => {
            if (err) throw err;
            res.redirect("/admenu");
          }
        );
      });
    client.close();
  });
  
  router.get("/delete/:id", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      })
      .then(client => {
        Menus.findByIdAndRemove({_id: req.params.id}, (err, doc) => {
          if (err) throw err;
          fs.unlink(path.join("public/uploads/", doc.filename), err => {
            if (err) throw err;
            res.redirect("/admenu");
          });
        });
      })
    client.close();
  });
  
  router.get("/adabout", ensureAuthenticated, (req, res) => {
          res.render("adabout");
  });
  
  router.post("/about", ensureAuthenticated, (req, res) => {
    var myData = new Abouts(req.body);
  
    myData.save();
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        res.redirect("adabout");
      })
    client.close();
  });
  
  router.get("/adcontact", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        Contacts.find({}, (err, contacts) => {
          if (err) return next(err);
          res.render("adcontact", {allContacts: contacts});
        });
      })
    client.close();
  });
  
  router.get("/deletecontact/:id", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      })
      .then(client => {
        Contacts.findByIdAndRemove({_id: req.params.id}, (err, contact) => {
          if (err) throw err;
          res.redirect("/adcontact");
        });
      })
    client.close();
  });
  
  router.get("/signup", (req, res) => {
    res.render("signup");
  });
  router.post("/signup", (req, res) => {
    const {email, password} = req.body;
    let errors = [];
  
    
       //check password length
      if(password.length < 6) {
          errors.push({msg: "password should be at least 6 characters"});
      }
  
    if (errors.length > 0) {
      res.render("signup", {
        errors,
        email,
        password
      });
    } else {
      //validation passed
     mongoose
       .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
       .then(client => {
        Admins.findOne({email: email})
        .then(user => {
          if (user) {
            //User exists
            errors.push({msg: "Email is already registered"});
            console.log("email exists");
            res.render("signup", {
              errors,
              email,
              password
            });
          } else {
            const newUser = new Admins({
              email,
              password
            });
            //Hash password
            bcrypt.genSalt(10, (err, salt) =>
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                //set password to hashed
                newUser.password = hash;
                //save user
                newUser
                  .save()
                  .then(user => {
                    req.flash("success_msg", "You are now registered");
                    res.redirect("/admin");
                  })
              })
            );
          }
        });
       })
     client.close();
  
      
    }
  });
  
  //Log in Handle
  router.get("/admin", (req, res) => res.render("login"));
  router.post("/login", (req, res, next) => {
   mongoose
     .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
     .then(client => {
        passport.authenticate("local", {
          successRedirect: "/index",
          failureRedirect: "/admin",
          requestFlash: true
        })(req, res, next);
     })
   client.close();
  
  });
  
  //logout Handle
  router.get("/logout", ensureAuthenticated, (req, res) => {
    mongoose
      .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(client => {
        req.logout();
        res.redirect("/admin");
      })
    client.close();
  });


module.exports = router;
