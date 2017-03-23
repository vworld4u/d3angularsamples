(function() {
  'use strict';

  angular
    .module('mindmapsample')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/about/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      }).state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      });

    $urlRouterProvider.otherwise('/');
  }

})();
