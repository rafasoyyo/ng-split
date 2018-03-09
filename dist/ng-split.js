(function () {
    'use strict';

    angular.module('ng-split', [])
        .directive('split', split)
        .directive('splitArea', splitArea);

    split.$inject = [];
    function split() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {
                direction: '@',
                width: '@',
                height: '@',
                gutterSize: '@',
                snapOffset: '@',
                cursor: '@',
                onDragStart: '&',
                onDrag: '&',
                onDragEnd: '&'
            },
            controller: ['$scope', function ($scope) {

                $scope.areas = [];
                var areasOptions = {
                    elements: [],
                    sizes: [],
                    minSizes: []
                };
                $scope.splitInstance = null;

                this.direction = $scope.direction;

                this.addArea = function(area){
                    $scope.areas.push(area);
                };

                this.removeArea = function(area){
                    var index = $scope.areas.indexOf(area);
                    if(index !== -1) {
                        $scope.areas.splice(index, 1);
                    }
                };

                $scope.$watch($scope.areas, function () {
                    if($scope.areas.length === 0 || $scope.areas.some(function (a) {
                            return a.element === undefined;
                        })) {
                        return;
                    }

                    if($scope.areas.length === 1) {
                        $scope.areas[0].element.css('width', '100%');
                        $scope.areas[0].element.css('height', '100%');
                        return;
                    }

                    $scope.areas = $scope.areas.sort(function (a, b) {
                        if(a.element.previousElementSibling === null || b.element.nextElementSibling === null) return -1;
                        if(a.element.nextElementSibling === null || b.element.previousElementSibling === null) return 1;
                        if(a.element.nextElementSibling === b.element || b.element.previousElementSibling === a.element) return -1;
                        if(b.element.nextElementSibling === a.element || a.element.previousElementSibling === b.element) return 1;
                        return 0;
                    });

                    angular.forEach($scope.areas, function(a){
                        a.element.css('height', null);
                        areasOptions.sizes.push(a.size);
                        areasOptions.elements.push(a.element[0]);
                        areasOptions.minSizes.push(a.minSize);
                    });

                    var params = {
                        direction: $scope.direction,
                        sizes: areasOptions.sizes,
                        gutterSize: Number($scope.gutterSize),
                        snapOffset: Number($scope.snapOffset),
                        cursor: $scope.cursor,
                        minSize: areasOptions.minSizes,
                        onDragStart: $scope.onDragStart,
                        onDrag: $scope.onDrag,
                        onDragEnd: $scope.onDragEnd
                    };

                    $scope.splitInstance = Split(areasOptions.elements, params);
                });

            }],
            link: function(scope, element, attrs) {

                element.css('display', 'block');
                element.css('width', (scope.width ? ( !isNaN(scope.width) ? scope.width + 'px' : scope.width ) : '100%'));
                element.css('height', (scope.height ? ( !isNaN(scope.height) ? scope.height + 'px' : scope.height ) : '100%'));

                function getSpecificChildren(className) {
                    return Array.from(element[0].children).filter(function (elem) {
                        return Array.from(elem.classList).indexOf(className) > -1;
                    });
                }

                function destroy() {
                    var gutters = getSpecificChildren('gutter');

                    for(var i = gutters.length - 1; i >= 0; i--) {
                        var gutter = gutters[i];
                        if(gutter.parentNode) {
                            gutter.parentNode.removeChild(gutter);
                        }
                    }
                    scope.splitInstance = null;
                }

                scope.$on('destroy', destroy());
            }

        };
    }

    splitArea.$inject = [];
    function splitArea() {
        return {
            restrict: 'E',
            require: '^split',
            replace: true,
            transclude: true,
            scope: {
                size: '=',
                minSize: '='
            },
            link: function(scope, element, attrs, bgSplitCtrl) {

                element.addClass('split');

                if(bgSplitCtrl.direction === 'horizontal') {
                    element.addClass('split-horizontal');
                }

                if(bgSplitCtrl.direction === 'vertical') {
                    element.addClass('split-vertical');
                }

                element.css('display', 'block');
                element.css('height', bgSplitCtrl.direction === 'horizontal' ? '100%' : null);

                var areaData = {
                    element: element,
                    size: Number(scope.size),
                    minSize: Number(scope.minSize)
                };

                bgSplitCtrl.addArea(areaData);

                scope.$on('$destroy', function() {
                    bgSplitCtrl.removeArea(areaData);
                });

            }
        };
    }

})();
