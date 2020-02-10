const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  description: String,
  filename: String,
});
const Menus = mongoose.model('Menu', UserSchema);

module.exports = Menus;