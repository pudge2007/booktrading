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
    
    // API-интерфейс JSON для удаления репоста
    socket.on('deleteRepost', function(data, callback) {
      callback(true);
      Pin.update({_id: data.id}, {$pull: {reposts: {user: data.user}}, $inc: {totalReposts: -1}}, function(err) {
        if (err) throw err;
        Pin.findById(data.id, function(err, pin) {
          io.sockets.emit('getReposts', {reposts: pin.reposts, id: pin._id, status: 'delete'});
        })
      })
    })
    
    //API для лайков
    socket.on('setLike', function(data) {
      Pin.findById(data.id, function(err, pin) {
        if (err) throw err;
        var checkVoted = pin.likes.some(function(like) {
          return like.user === data.user;
        })
        if(!checkVoted) {
          pin.likes.push({ user: data.user });
          pin.totalLikes++;
          pin.save(function(err, doc) {
            if (err) throw err;
            io.sockets.emit('getLikes', {likes: pin.likes, id: pin._id, status: 'add'});
          });
        } else {
          Pin.update({_id: data.id}, {$pull: {likes: {user: data.user}}, $inc: {totalLikes: -1}}, function(err) {
            if (err) throw err;
            Pin.findById(data.id, function(err, pin) {
              io.sockets.emit('getLikes', {likes: pin.likes, id: pin._id, status: 'delete'});
            })
          })
        }
      });
    });
    
    //API для репостов
    socket.on('setRepost', function(data) {
      Pin.findById(data.id, function(err, pin) {
        if (err) throw err;
        var checkRep = pin.reposts.some(function(repost) {
          return repost.user === data.user;
        })
        if(!checkRep) {
          pin.reposts.push({ user: data.user });
          pin.totalReposts++;
          pin.save(function(err, doc) {
            if (err) throw err;
            io.sockets.emit('getReposts', {reposts: pin.reposts, id: pin._id, status: 'add'});
          });
        } else {
          Pin.update({_id: data.id}, {$pull: {reposts: {user: data.user}}, $inc: {totalReposts: -1}}, function(err) {
            if (err) throw err;
            Pin.findById(data.id, function(err, pin) {
              io.sockets.emit('getReposts', {reposts: pin.reposts, id: pin._id, status: 'delete'});
            })
          })
        }
      });
    });
  });
};