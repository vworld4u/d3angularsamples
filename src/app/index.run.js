(function() {
  'use strict';

  angular
    .module('mindmapsample')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
