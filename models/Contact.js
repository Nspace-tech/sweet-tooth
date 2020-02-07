const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  subject: String,
  message: String,
  date: {type: Date, default: Date}
});

const Contacts = mongoose.model("Contact", UserSchema);

module.exports = Contacts;
