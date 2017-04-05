var async = require('async');
var Book = require('../models/Books');
var User = require('../models/Users');

module.exports = function (app, passport) {
    
  var isLoggedIn = function (req, res, next) {
  	if (!req.isAuthenticated())
  	  res.send(401);
  	else
      next();		
  }
  
  
  app.get('/books', function(req, res) {
    Book.find({}, function(error, books) {
      res.json(books);
    });
  });
  
  app.put('/update', isLoggedIn, function(req, res) {
    User.findOneAndUpdate({'local.username': req.user.local.username}, { $set:{'local.city': req.body.city, 'local.state': req.body.state}
    }, {new: true}, function(err, r) {
      if (err) throw err;
      res.sendStatus(200)
    })
  });
  
  app.get('/user', isLoggedIn, function(req, res) {
    async.parallel({
      myBooks: function(callback){
        return Book.find({'username': req.user.local.username}, function(err, books) {
          return callback(err, books);
        });
      },
      myProfile: function(callback){
        return User.findOne({'local.username': req.user.local.username}, function(err, user) {
          return callback(err, user);
        });
      },
      myTrades: function(callback){
        return Book.find({'trade':{$elemMatch: {'user':req.user.local.username}}}, function(err, rep) {
          return callback(err, rep);
        });
      },
    }, function(err, results){
      if(err) throw err;
      res.json(results);
    })
  });
  
  // auth
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile',
      failureRedirect : '/signup',
      failureFlash : true
  }));

  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile',
      failureRedirect : '/login',
      failureFlash : true
  }));

	app.get('/logout', isLoggedIn, function (req, res) { 
	  req.logout();
	  res.redirect('/login'); 
	});
	
  app.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user.local.username : '0');
  });
  
  app.get('/signupErrors', function(req, res) {
    res.send(req.flash('signupMessage'))
  });
  
  app.get('/loginErrors', function(req, res) {
    res.send(req.flash('loginMessage'))
  });
  
};
