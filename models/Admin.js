const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  email: {type: String, unique: true, required: true},
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  date: {type: Date, default: Date.now}
});

UserSchema.plugin(passportLocalMongoose)

const Admins = mongoose.model("Admin", UserSchema);

module.exports = Admins;