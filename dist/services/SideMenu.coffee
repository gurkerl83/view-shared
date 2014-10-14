class SideMenu extends Factory
  constructor: ($serviceScope) ->
    return class SideMenuInstance

      a = -1

      constructor: () ->

        $scope = $serviceScope()

        @login = ->
          # Can trigger events on scopes
          $scope.$emit "logged-in"

          return

###
class SideMenu extends Factory
  constructor: ($serviceScope) ->
    return {

      $scope = $serviceScope

      login: ->

        # Can trigger events on scopes
        $scope.$emit "logged-in"
        
        return

    }
###

###
class SideMenu extends Service

  constructor: () ->

  #constructor: ($cordovaCamera, $cordovaContacts, GalleryService, $cordovaDevice) ->
###

module.exports = SideMenu