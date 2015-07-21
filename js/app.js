(function($angular, _) {
    'use strict';

    $angular.module('app', ['jamfu'])
    .controller('AppController', ['$scope', function($scope) {

        $scope.headline = 'Range Slider';
        $scope.icon = 'sliders';

        $scope.rangeConfig = {
            min: 0,
            max: 100,
            gap: 1,
            step: 1,
            debounce: 0,
            handles: {
                minPrefix: 'Start Day',
                minSuffix: '',
                maxPrefix: 'End Day',
                maxSuffix: ''
            },
            labels: {
                minPrefix: '',
                minSuffix: '/ Today',
                maxPrefix: '',
                maxSuffix: 'Days Ago'
            }

        };

        $scope.range = {
            from:10,
            to:50
        };

    }]);
})(window.angular, window._);
