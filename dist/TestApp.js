
/*
require 'restangular'
 */

(function() {
  var TestApp,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  require('./common/factories/cordovaSQLite.js');


  /*
  require './db/DBSchemas'
  
  require './services/AggregationModel'
  require './services/AggregationRest'
  require './services/Database'
  require './services/ProviderRestangular'
  require './services/SideMenu'
   */

  require('underscore');

  require('restangular');

  TestApp = (function(_super) {
    __extends(TestApp, _super);

    function TestApp() {
      return ['restangular', 'ngCordova.plugins.sqlite'];
    }

    return TestApp;

  })(App);

  module.exports = TestApp;

}).call(this);
