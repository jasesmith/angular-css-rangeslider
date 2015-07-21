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
                '<div class="range-slider {{config.style}}">' +
                    '<div class="range-slider-label">' +
                        '<span class="min-prefix">{{config.labels.minPrefix}}</span> ' +
                        '<span class="min-value">{{config.min}}</span> ' +
                        '<span class="min-suffix">{{config.labels.minSuffix}}</span>' +
                    '</div>' +

                    '<div class="range-slider-set" ng-class="{\'range-slider-bg\': !config.span.min || !config.span.gap || !config.span.max}">' +
                        '<div class="range-slider-span-min" ng-if="config.span.min" style="left:0;right:{{(100 - _handleMinX)}}%"></div>' +
                        '<div class="range-slider-span-gap" ng-if="config.span.gap" style="left:{{_handleMinX}}%;right:{{(100 - _handleMaxX)}}%"></div>' +
                        '<div class="range-slider-span-max" ng-if="config.span.max" style="left:{{_handleMaxX}}%;right:0"></div>' +

                        '<input class="exclude" type="range" ng-change="_which=0" ng-model="_model[0]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" />' +
                        '<input class="exclude" type="range" ng-change="_which=1" ng-model="_model[1]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" />' +

                        '<div class="range-slider-handle-min" style="left:{{_handleMinX}}%">' +
                            '<span class="min-prefix">{{config.handles.minPrefix}}</span> ' +
                            '<span class="min-value">{{_model[0]}}</span> ' +
                            '<span class="min-suffix">{{config.handles.minSuffix}}</span>' +
                        '</div>' +
                        '<div class="range-slider-handle-max" style="left:{{_handleMaxX}}%">' +
                            '<span class="max-prefix">{{config.handles.maxPrefix}}</span> ' +
                            '<span class="max-value">{{_model[1]}}</span> ' +
                            '<span class="max-suffix">{{config.handles.maxSuffix}}</span>' +
                        '</div>' +
                    '</div>' +

                    '<div class="range-slider-label">' +
                        '<span class="max-prefix">{{config.labels.maxPrefix}}</span> ' +
                        '<span class="max-value">{{config.max}}</span> ' +
                        '<span class="max-suffix">{{config.labels.maxSuffix}}</span>' +
                    '</div>' +
                '</div>',

            link: function link(scope, element) {
                var defaultConfig = {
                    min: 0,
                    max: 100,
                    gap: 1,
                    step: 0.5,
                    debounce: 300,
                    style: '',
                    labels: {
                        minPrefix: '',
                        minSuffix: '',
                        maxPrefix: '',
                        maxSuffix: ''
                    },
                    handles: {
                        thing: '',
                        minPrefix: '',
                        minSuffix: '',
                        maxPrefix: '',
                        maxSuffix: ''
                    },
                    span: {
                        min: false,
                        gap: true,
                        max: false,
                    }
                };

                scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);

                scope._model = [
                    scope.model.from,
                    scope.model.to
                ];

                scope._values = {
                    min: scope.config.min || 0,
                    max: scope.config.max || 100
                };

                scope._labels = {
                    min: scope.config.labels.min || scope._values.min,
                    max: scope.config.labels.max || scope._values.max
                };

                scope._step = scope.config.step || 1;

                scope._gap = $window.parseFloat(scope.config.gap) || 0;
                scope._debounce = $window.parseInt(scope.config.debounce);

                // Responsible for determining which slider the user was moving,
                // which help us resolve occurrences of sliders overlapping.
                scope._which = 0;

                var _reevaluateInputs = function() {
                    var inputElements = element.find('input');

                    _.each(inputElements, function (inputElement, index) {
                        inputElement = $angular.element(inputElement);

                        // inputElement.val('');
                        inputElement.val(scope._model[index]);
                    });
                };

                var _updateModel = function _updateModel(model) {
                    if ($angular.isArray(scope.model)) {
                        // Developer defined an array.
                        scope.model = [model[0], model[1]];
                    } else {
                        // Otherwise it's an object.
                        scope.model = {from: model[0], to: model[1]};
                    }

                    scope._handleMinX = ((scope._model[0] - scope._values.min) / (scope._values.max - scope._values.min)) * 100;
                    scope._handleMaxX = ((scope._model[1] - scope._values.min) / (scope._values.max - scope._values.min)) * 100;

                    scope._handleMinX = scope._handleMinX < 0 ? 0 : scope._handleMinX;
                    scope._handleMaxX = scope._handleMaxX > 100 ? 100 : scope._handleMaxX;

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

                scope.$watch('config', function(n, o) {
                    scope.config = $.extend(true, $angular.copy(defaultConfig), scope.config);
                    if(n && o && n !== o) {
                        scope.config.min = parseFloat(scope.config.min);
                        scope.config.max = parseFloat(scope.config.max);
                        scope.config.gap = parseFloat(scope.config.gap);

                        // fix the gap
                        if(scope.config.gap > scope.config.max - scope.config.min) {
                            scope.config.gap = scope.config.max - scope.config.min;
                        }

                        scope.config.step = parseFloat(scope.config.step);
                        scope.config.debounce = parseInt(scope.config.debounce);

                        scope._gap = scope.config.gap;
                        scope._step = scope.config.step;
                        scope._debounce = scope.config.debounce;

                        scope._values = {
                            min: scope.config.min || 0,
                            max: scope.config.max || 100
                        };

                        scope._labels = {
                            min: scope.config.labels.min || scope._values.min,
                            max: scope.config.labels.max || scope._values.max
                        };

                        _reevaluateInputs();
                    }
                }, true);

                // Listen for any changes to the original model.
                scope.$watch('model', function alteredValues() {
                    scope._model = [scope.model.from, scope.model.to];
                    _reevaluateInputs();
                }, true);

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
                    _reevaluateInputs();
                });
            }
        };
    }]);
})(window.angular, window._);
