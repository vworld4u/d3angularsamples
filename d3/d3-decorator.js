(function() {
    'use strict';

    angular.module('d3')
        .config(['$provide', function($provide) {

            var customDecorator = function($delegate) {
                var d3Service = $delegate;
                d3Service.d3().then(function(d3) {
                    // build our custom functions on the d3
                    // object here
                });

                return d3Service; // important to return the service
            };

            $provide.decorator('d3Service', customDecorator);
        }]);
})();
