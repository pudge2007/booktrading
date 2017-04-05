var mongoose = require('mongoose');

var ReqSchema = new mongoose.Schema({ user: String });

var BookSchema = new mongoose.Schema({
  img: String,
  title: String,
  author: String,
  username: String,
  trade: [ReqSchema]
});

module.exports = mongoose.model('Book', BookSchema);