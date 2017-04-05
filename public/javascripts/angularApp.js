var app = angular.module('booktrading', ['ngResource', 'ngRoute']);

app.factory('loggedInterceptor', ['$rootScope', '$q', '$location', function($rootScope, $q, $location) {
  return { 
    responseError: function(response) { 
      if (response.status === 401){
        $location.url('/login');
        return $q.reject(response);
      }
      else
        return $q.reject(response); 
    } 
  };
}]);

app.factory('socket',['$rootScope', function($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  }]);

app.factory('getUsername', ['$rootScope', '$http', function($rootScope, $http) {
  return $http.get('/loggedin');
}]);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
  
  var checkLoggedin = function($q, $http, $location, $rootScope){
    var deferred = $q.defer();
    $http.get('/loggedin').then(function(response){
      if (response.data !== '0') {
        deferred.resolve();
      }
      else { 
        $location.url('/login');
        deferred.reject();
      } 
    }); 
    return deferred.promise; 
  };

  $routeProvider
    .when('/', { templateUrl: 'partials/home.ejs', controller: 'ListCtrl'})
    .when('/profile',{ templateUrl: 'partials/profile.ejs', controller: 'UserCtrl', resolve: { loggedin: checkLoggedin } })
    .when('/settings',{ templateUrl: 'partials/settings.ejs', controller: 'UserCtrl', resolve: { loggedin: checkLoggedin } })
    .when('/login',{ templateUrl: 'partials/login.ejs', controller: 'LoginCtrl'})
    .when('/signup',{ templateUrl: 'partials/signup.ejs', controller: 'SignupCtrl'});
    
  $routeProvider.otherwise({ redirectTo: "/" });
  $locationProvider.html5Mode({ enabled: true, requireBase: false});
  $httpProvider.interceptors.push('loggedInterceptor');

}]);

app.run(['$http', '$rootScope', 'getUsername', 'socket', function($http, $rootScope, getUsername, socket){
  getUsername.then(function(response) {
    $rootScope.username = response.data;
  })
}])

//nav buttons
app.controller('MainCtrl', ['$scope', '$rootScope','getUsername', function($scope, $rootScope, getUsername){
  getUsername.then(function(response) {
    response.data === '0' ? $scope.showing = false : $scope.showing = true;
  })
}]);

//all polls to index page
app.controller('ListCtrl', ['$scope','$http', '$rootScope','socket', function($scope, $http, $rootScope, socket){
  
  $scope.checkUs = $rootScope.username;
  (($scope.checkUs !== '0') && ($scope.checkUs !== undefined)) ? $scope.disabled = false : $scope.disabled = true;
  
  $http.get('/books').then(function(response){
    $scope.books = response.data;
    $scope.books.forEach(function(item) {
      if(!$scope.disabled) {
        item.traded = item.trade.some(function (u) {
          return u.user === $scope.checkUs;
        })
      } else
        item.traded = false;
    })
  });
  
  socket.on('getBook', function(data) {
    $scope.books.push(data);
  });
  
  socket.on('removeBook', function(data) {
    for (var j = 0; j < $scope.books.length; j++) {
      console.log($scope.books[j]);
      if ($scope.books[j]._id === data) {
        $scope.books.splice(j, 1);
        break;
      }
    }
  });
  
  $scope.trade = function (id) {
    if(!$scope.disabled){
      var tradeBook = {id: id, user: $scope.checkUs}
      socket.emit('trade', tradeBook);
    }
  }
  
  socket.on('trade', function(data) {    
    $scope.books = data;
    $scope.books.forEach(function(item) {
      item.traded = item.trade.some(function (u) {
        return u.user === $scope.checkUs;
      })
    })
  });
  
}]);

//profile controller
app.controller('UserCtrl', ['$scope', '$rootScope', '$route', '$http','socket', '$location', function($scope, $rootScope, $route, $http, socket, $location){
  
  $scope.username = $rootScope.username;
  
  $http.get('/user').then(function(response){
    $scope.city = response.data.myProfile.local.city;
    $scope.state = response.data.myProfile.local.state;
    $scope.userBooks = response.data.myBooks;
    $scope.userTrades = response.data.myTrades;
  })
  
  $scope.addBook = function() {
    var book = {title: $scope.title, username: $rootScope.username};
    $scope.title ='';
    socket.emit('postBook', book, function(data) {
      if(data) $route.reload();
    });
  };
  
  $scope.deleteBook = function(id){
    socket.emit('deleteBook', id, function(data) {
      if(data) $route.reload();
    });
  }
  
  $scope.deleteReq = function(id){
    socket.emit('deleteReq', {id:id, user: $scope.username}, function(data) {
      if(data) $route.reload();
    });
  }
  
  function ucFirst(str) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
  }
  
  $scope.updateProfile = function() {
    var updated = {city: ucFirst($scope.city), state: ucFirst($scope.state), username: $rootScope.username};
    $scope.city ='';
    $scope.state ='';
    $http.put('/update', updated).then(function(response) {
      $location.path('/profile');
    })
  }
  
  socket.on('deleteReqFrom', function(data) {
    console.log(data)
  })
    
}]);

//login and sigup errors
app.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $http.get('/loginErrors').then(function(response) {
    $scope.errorMsg = response.data[0];
  })
}]);
app.controller('SignupCtrl', ['$scope', '$http', function($scope, $http){
  $http.get('signupErrors').then(function(response) {
    $scope.errorMsg = response.data[0];
  })
}]);