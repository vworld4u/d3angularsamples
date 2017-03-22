(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .controller('AboutCtrl', Controller);

  Controller.$inject = [];

  /* @ngInject */
  function Controller() {
    var vm = this;
    vm.title = 'Controller';

    activate();

    ////////////////

    function activate() {}
  }
})();
