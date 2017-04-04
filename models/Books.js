var mongoose = require('mongoose');

var RepostSchema = new mongoose.Schema({ user: String });

var BookSchema = new mongoose.Schema({
  img: String,
  title: String,
  author: String,
  username: String,
  reposts: [RepostSchema],
  totalReposts: {type: Number, default: 0 }
});

module.exports = mongoose.model('Book', BookSchema);