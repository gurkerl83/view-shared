###
require 'restangular'
###

#require './common/factories/cordovaSQLite.js'
require 'ng-cordova-sqlite'

###
require './db/DBSchemas'

require './services/AggregationModel'
require './services/AggregationRest'
require './services/Database'
require './services/ProviderRestangular'
require './services/SideMenu'
###

require 'lodash'
#require 'underscore'
require 'restangular'

#require 'array'

class TestApp
  constructor: ->
    return [

      #'ng',
      #'serviceUtilities',
      'restangular',

      #'ngCordova.plugins.device'


      'ngCordova.plugins.sqlite'
    ]

module.exports = TestApp


angular.module('shared_view.module', TestApp())