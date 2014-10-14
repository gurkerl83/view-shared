class ProviderRestangular #Service #Factory

  constructor: (RestangularProvider) ->
  #constructor: (Restangular) ->

    RestangularProvider.setBaseUrl 'http://millipede.me:9001/'

    ###
    Restangular.withConfig (RestangularConfigurer) ->
      RestangularConfigurer.setBaseUrl "http://millipede.me:9001/"
    ###

module.exports = ProviderRestangular

angular.module('shared_view.module')
.config(['RestangularProvider', ProviderRestangular])