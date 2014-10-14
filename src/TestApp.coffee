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

class TestApp extends App
  constructor: ->
    return [

      #'ng',
      #'serviceUtilities',
      'restangular',

      #'ngCordova.plugins.device'


      'ngCordova.plugins.sqlite'
    ]

module.exports = TestApp
