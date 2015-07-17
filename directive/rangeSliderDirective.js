(function($angular, _) {
    'use strict';

    $angular.module('app').directive('rangeSlider', ['$window', function ngRangeSlider($window) {

        return {
            restrict: 'E',
            replace: true,
            scope: {
                config: '=?',
                model: '='
            },

            controller: ['$scope', function controller($scope) {
                $scope.iter = function iter(max) {
                    return _.range(0, max);
                };

                $scope._supportThrottle = function _supportThrottle() {
                    return ($angular.isDefined(_) && typeof _.throttle === 'function');
                };

                $scope._notInRunLoop = function _notInRunLoop() {
                    return !$scope.$root.$$phase;
                };
            }],

            template: '' +
                '<div class="range-slider">' +
                    '<datalist ng-id="{{config.datalist}}" ng-if="config.datalist">' +
                        '<option ng-repeat="index in iter(config.max)">{{index}}</option>' +
                    '</datalist>' +
                    '<input class="exclude" type="range" ng-change="_which=0" ng-model="_model[0]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" ng-attr-list="config.datalist" />' +
                    '<input class="exclude" type="range" ng-change="_which=1" ng-model="_model[1]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" />' +
                '</div>',

            link: function link(scope, element) {
                var defaultConfig = {
                    min: 0,
                    max: 100,
                    gap: 1,
                    step: 0.5,
                    throttle: 0,
                    datalist: false
                };

                scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);

                scope.$watch('config', function(n, o) {
                    scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);
                    if(n && o && n !== o) {
                        _reevaluateInputs();
                        if(n.min !== o.min) {
                            updateMinMax.bind('min');
                        }
                        if(n.max !== o.max) {
                            updateMinMax.bind('max');
                        }
                    }
                }, true);

                scope._model = [
                    scope.model.from,
                    scope.model.to
                ];

                scope._values = {
                    min: scope.config.min || 0,
                    max: scope.config.max || 100
                };

                scope._step = scope.config.step || 1;

                scope._gap = $window.parseFloat(scope.config.gap) || 0;

                var _reevaluateInputs = function() {
                    var inputElements = element.find('input');

                    _.each(inputElements, function (inputElement, index) {
                        inputElement = $angular.element(inputElement);

                        inputElement.val('');
                        inputElement.val(scope._model[index]);
                    });
                };

                // Listen for any changes to the original model.
                scope.$watch('model', function alteredValues() {
                    scope._model = [scope.model.from, scope.model.to];
                    _reevaluateInputs();
                }, true);

                var updateMinMax = function updateMinMax() {
                    scope._values[this] = scope[this];
                    _reevaluateInputs();
                };

                // Listen for changes to the min/max models.
                // scope.$watch('config.min', updateMinMax.bind('min'));
                // scope.$watch('config.max', updateMinMax.bind('max'));

                // Responsible for determining which slider the user was moving,
                // which help us resolve occurrences of sliders overlapping.
                scope._which = 0;

                var _updateModel = function _updateModel(model) {
                    if ($angular.isArray(scope.model)) {
                        // Developer defined an array.
                        scope.model = [model[0], model[1]];
                    } else {
                        // Otherwise it's an object.
                        scope.model = {from: model[0], to: model[1]};
                    }

                    if (scope._notInRunLoop()) {
                        try {
                            // Sometimes we're outside of the Angular run-loop,
                            // and therefore need to manually invoke the `apply` method!
                            scope.$apply();
                        } catch(e) {}
                    }
                };

                if (scope.config.throttle && scope._supportThrottle()) {
                    // Use the throttled version if we support it,
                    // and the developer has defined the throttle attribute.
                    _updateModel = _.throttle(_updateModel, $window.parseFloat(scope.config.throttle));
                }

                // Observe the `_model` for any changes.
                scope.$watchCollection('_model', function modelChanged() {

                    scope._model[0] = $window.parseFloat(scope._model[0]);
                    scope._model[1] = $window.parseFloat(scope._model[1]);

                    // User was moving the first slider.
                    if (scope._which === 0 && scope._model[1] - scope._gap < scope._model[0]) {
                        scope._model[1] = scope._model[0] + scope._gap;
                    }

                    // Otherwise they were moving the second slider.
                    if (scope._which === 1 && scope._model[0] + scope._gap > scope._model[1]) {
                        scope._model[0] = scope._model[1] - scope._gap;
                    }


                    // Constrain to the min/max values.
                    (function constrainMinMax() {

                        if (scope._model[0] < scope._values.min) {
                            scope._model[0] = scope._values.min;
                        }

                        if (scope._model[1] < scope._values.min) {
                            scope._model[1] = scope._values.min;
                        }

                        if (scope._model[0] > scope._values.max) {
                            scope._model[0] = scope._values.max;
                        }

                        if (scope._model[1] > scope._values.max) {
                            scope._model[1] = scope._values.max;
                        }

                        // mind the gap
                        var _m0Gap = scope._model[0] + scope._gap;
                        var _m1Gap = scope._model[1] - scope._gap;

                        if(scope._model[0] > _m1Gap) {
                            scope._model[0] = _m1Gap;
                        }

                        if(scope._model[1] < _m0Gap) {
                            scope._model[1] = _m0Gap;
                        }

                    })();

                    window.console.log(scope._model);

                    // Update the model!
                    _updateModel(scope._model);

                });
            }
        };
    }]);
})(window.angular, window._);
