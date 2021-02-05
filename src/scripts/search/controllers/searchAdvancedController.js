'use strict';
(function (module) {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    }
    var theController = module.controller('searchAdvancedController', ['$scope', '$modalInstance', 'SearchAdvancedService', 'MapData', 'GISService', 'UIService', 'ResultsData', 'ThemeService',
        function ($scope, $modalInstance, SearchAdvancedService, MapData, GISService, UIService, ResultsData, ThemeService) {
            $scope.editor = false;
            $scope.selectedLayer = null;
            $scope.operations = [];
            if ($scope.query == undefined) $scope.query = null;

            $scope.openQueryEditor = function () {
                $scope.editor = true;
                if ($scope.selectedLayer) {
                    SearchAdvancedService.BuildQuery($scope.selectedLayer.name);
                }
            };

            $scope.SelectedLayers = function () {
                //display only usable layers
                var layers = MapData.VisibleLayers.filter(data => data.name !== "Alle lagen" && data.fields);
                if (layers.length == 1){
                    $scope.selectedLayer = layers[0];
                    SearchAdvancedService.UpdateFields($scope.selectedLayer);
                }
                return layers;
            }

            $scope.updateFields = function() {
                if ($scope.selectedLayer != null && $scope.selectedLayer != undefined){
                    SearchAdvancedService.UpdateFields($scope.selectedLayer);
                }
            }

            $scope.checkAddOrUpdate

            $scope.$on('queryBuild', function (event, data) {
                $scope.query = data;
            })

            $scope.$on('queryOperationUpdated', function (event, data) {
                $scope.query = data;
                $scope.editor = false;
            })

            $scope.$on('deleteOperation', function () {
                $scope.editor = false;
            })

            $scope.addOperation = function () {
                $scope.editor = false;
                SearchAdvancedService.newAddOperation();
            };

            $scope.orOperation = function () {
                $scope.editor = false;
                SearchAdvancedService.newOrOperation();
            };

            $scope.ok = function () {
                $modalInstance.$close();
            };
            $scope.cancel = function () {
                $modalInstance.$dismiss('cancel is pressed');
            };

            $scope.QueryAPI = function () {
                if (!$scope.editor) {
                    SearchAdvancedService.BuildQuery($scope.selectedLayer.name);
                    var query = SearchAdvancedService.TranslateOperations($scope.operations);
                    if (query !== '') {
                        var result = SearchAdvancedService.ExecuteQuery($scope.selectedLayer, query);
                    }
                } else {
                    var rawQueryResult = SearchAdvancedService.MakeNewRawQuery($scope.query);
                    SearchAdvancedService.UpdateQuery($scope.query);
                    if (rawQueryResult.layer != null) {
                        var result = SearchAdvancedService.ExecuteQuery(rawQueryResult.layer, rawQueryResult.query);
                    }
                }
                
                UIService.OpenLeftSide();
                $modalInstance.$close();
            };

            $scope.FilterQueriedLayer = function() {
                var closeModal = true;
                if (!$scope.editor) {
                    SearchAdvancedService.BuildQuery($scope.selectedLayer.name);
                    var query = SearchAdvancedService.TranslateOperations($scope.operations);
                    if ($scope.selectedLayer && query !== '') {
                        ThemeService.AddQueryLayer($scope.selectedLayer.name, $scope.selectedLayer.id, query, $scope.selectedLayer.theme);
                    }
                } else {
                    var rawQueryResult = SearchAdvancedService.MakeNewRawQuery($scope.query);
                    SearchAdvancedService.UpdateQuery($scope.query);
                    if ($scope.selectedLayer) {
                        ThemeService.AddQueryLayer($scope.selectedLayer.name, $scope.selectedLayer.id, rawQueryResult.query, $scope.selectedLayer.theme);                    
                    } else {
                        if(rawQueryResult.layer) {
                            ThemeService.AddQueryLayer(rawQueryResult.layer.name, rawQueryResult.layer.id, rawQueryResult.query, rawQueryResult.layer.theme); 
                        } else {
                            closeModal = false;
                        }   
                    }
                }
                if (closeModal) {
                    $modalInstance.$close();
                }
            }

            if ($scope.query != null && $scope.query != ""){
                $scope.openQueryEditor();
            }
        }]);

    theController.$inject = ['$scope', '$modalInstance', 'SearchAdvancedService', 'MapData', 'UIService', 'GISService', 'ResultsData', 'ThemeService'];
})();