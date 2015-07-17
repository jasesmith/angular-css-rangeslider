angular.module('app', ['jamfu'])
    .controller('AppController', ['$scope', function($scope) {

        $scope.headline = 'Range Slider';
        $scope.icon = 'sliders';

        $scope.rangeConfig = {
            min: 0,
            max: 11,
            gap: 1,
            step: 0.5,
            datalist: 'numbers'
        };

        $scope.range = {
            from:3,
            to:6
        };

    }]);
