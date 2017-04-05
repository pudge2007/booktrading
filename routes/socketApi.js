var mongoose = require('mongoose');
var Book = mongoose.model('Book');
var search = require('google-books-search');
var searchOpt = {
    limit: 1,
    type: 'books',
    lang: 'en'
};


module.exports = function(io) {
  
  io.sockets.on('connection', function (socket) {
    
    function find(id) {
      Book.findById(id, function(error, book) {
        socket.broadcast.emit('getBook', book);
      });
    }  
    
    socket.on('postBook', function(data, callback) {
      search.search(data.title, searchOpt, function(err, results) {
        if (err) throw err;
        var book = new Book({title: results[0].title, img: results[0].thumbnail, author: results[0].authors[0], username: data.username});
        book.save(function(err, saved) {
          if(err) throw err;
          callback(true);
          find(saved._id);
        });
      });
    });
    
    socket.on('deleteBook', function(data, callback) {
      Book.remove({ _id: data}, function(err){
        if(err) throw err;
        callback(true);
        socket.broadcast.emit('removeBook', data);
      })
    })
    
    socket.on('deleteReq', function(data, callback) {
      callback(true);
      Book.findOneAndUpdate({_id: data.id}, {$pull: {trade: {user: data.user}}}, function(err, result) {
        if (err) throw err;
        Book.find({}, function(err, books) {
          socket.emit('trade', books);
        })
      })
    })
    
    socket.on('trade', function(data) {
      Book.findById(data.id, function(err, book) {
        if (err) throw err;
        book.trade.push({ user: data.user });
        book.save(function(err) {
          if (err) throw err;
          Book.find({}, function(err, books) {
            socket.emit('trade', books);
          })
        });
      });
    });
    
  });
};