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

                $scope._supportDebounce = function _supportDebounce() {
                    return ($angular.isDefined(_) && typeof _.debounce === 'function');
                };

                $scope._notInRunLoop = function _notInRunLoop() {
                    return !$scope.$root.$$phase;
                };
            }],

            template: '' +
                '<div class="range-slider">' +
                    '<datalist id="{{config.datalist}}" ng-if="config.datalist">' +
                        '<option ng-repeat="index in iter(config.max)">{{index}}</option>' +
                    '</datalist>' +
                    '<input class="exclude" type="range" ng-change="_which=0" ng-model="_model[0]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" ng-attr-list="{{config.datalist}}" />' +
                    '<input class="exclude" type="range" ng-change="_which=1" ng-model="_model[1]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" />' +
                '</div>',

            link: function link(scope, element) {
                var defaultConfig = {
                    min: 0,
                    max: 100,
                    gap: 1,
                    step: 0.5,
                    debounce: 300,
                    datalist: false
                };

                scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);

                scope.$watch('config', function(n, o) {
                    scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);
                    if(n && o && n !== o) {
                        scope.config.min = parseFloat(scope.config.min);
                        scope.config.max = parseFloat(scope.config.max);
                        scope.config.gap = parseFloat(scope.config.gap);
                        scope.config.step = parseFloat(scope.config.step);
                        scope.config.debounce = parseInt(scope.config.debounce);

                        scope._gap = scope.config.gap;
                        scope._step = scope.config.step;
                        scope._debounce = scope.config.debounce;

                        scope._values = {
                            min: scope.config.min || 0,
                            max: scope.config.max || 100
                        };
                        _reevaluateInputs();
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
                scope._debounce = $window.parseInt(scope.config.debounce);

                var _reevaluateInputs = function() {
                    var inputElements = element.find('input');

                    _.each(inputElements, function (inputElement, index) {
                        inputElement = $angular.element(inputElement);

                        // inputElement.val('');
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

                if (scope._debounce && scope._supportDebounce()) {
                    // Use the throttled version if we support it,
                    // and the developer has defined the throttle attribute.
                    _updateModel = _.debounce(_updateModel, scope._debounce);
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

                    // Update the model!
                    _updateModel(scope._model);

                });
            }
        };
    }]);
})(window.angular, window._);
