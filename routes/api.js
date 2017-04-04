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
  
  app.get('/user', isLoggedIn, function(req, res, next) {
    async.parallel({
      myBooks: function(callback){
        return Book.find({'username': req.user.local.username}, function(err, books) {
          return callback(err, books);
        });
      },
      myReposts: function(callback){
        return Book.find({'reposts':{$elemMatch: {'user':req.user.local.username}}}, function(err, rep) {
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
