'use strict';
(function () {
    var module = angular.module('tink.gis');
    var service = function ($rootScope, MapData, MapService, PopupService, $q, UIService) {
        var _service = {};
        $rootScope.attribute = null;
        $rootScope.operations = [];
        $rootScope.query = "";
        $rootScope.selectedLayer = null;
        $rootScope.operators = ['=', '<>', '<', '>', '<=', '>=', 'LIKE', 'NOT LIKE']; //Misschien betere oplossing? Doorgeven?
        $rootScope.autoComplete = [];

        _service.newOrOperation = function () {
            $rootScope.$broadcast('orOperation');
        };

        _service.newAddOperation = function () {
            $rootScope.$broadcast('addOperation');
        };

        $rootScope.$on('addedOperation', function (event, data) {
            $rootScope.operations = data;
            $rootScope.$broadcast('queryOperationUpdated', $rootScope.operations);
        });

        $rootScope.$on('deleteOperation', function () {
            $rootScope.$emit('deleteOperation');
        });

        $rootScope.$on('alteredOperation', function () {
            $rootScope.$emit('alteredOperation');
        });

        _service.UpdateFields = function (layer) {
            $rootScope.selectedLayer = layer;
            $rootScope.$broadcast('updateFields', layer);
        };

        var checkOperator = function (value) {
            var returnValue = "";
            if (value.operator == 'LIKE' || value.operator == 'NOT LIKE') {
                returnValue += value.operator + " \'%" + value.value + "%\' ";
            } else {
                returnValue += value.operator + " \'" + value.value + "\' ";
            }
            return returnValue;
        };

        _service.BuildQuery = function (layer) {
            $rootScope.query = ""; //init
            $rootScope.query += "FROM " + layer; //always remains the same

            angular.forEach($rootScope.operations, function (value, key) {
                if (value.addition == null) {
                    $rootScope.query += " WHERE " + value.attribute.name +  " " + checkOperator(value);
                } else {
                    $rootScope.query += value.addition + " " + value.attribute.name + " " + checkOperator(value);
                }
            });

            $rootScope.$broadcast('queryBuild', $rootScope.query);
        };

        _service.ExecuteQuery = function (layer, query) {
            MapService.AdvancedQuery(layer, query);
        }

        _service.TranslateOperations = function (operations) {
            var query = '';
            operations.forEach(operation => {
                if (operation.addition != null) {
                    query += ' ' + operation.addition + ' (';
                }
                query += operation.attribute.name + ' ';
                query += _service.HandleOperator(operation);
                if (operation.addition != null) {
                    query += ')';
                }
            });
            console.log(query);
            return query;
        }

        _service.HandleOperator = function(operation) {
            if (operation.value.contains("'")){
                operation.value = operation.value.substring(1).slice(0, -1);
            }
            switch (operation.operator) {
                case 'LIKE' || 'NOT LIKE':
                    if(!operation.value.contains('%')){
                        return operation.operator + ' \'%' + operation.value + '%\'';
                    }
                default:
                    return operation.operator + ' \'' + operation.value + '\'';
            }
        }

        _service.MakeNewRawQuery = function(rawQuery) {
            var whereIndex = rawQuery.indexOf("WHERE");
            var beforeWhere = rawQuery.substring(0, whereIndex);
            this.GetLayerIdIfValid(beforeWhere);
            var newQuery = rawQuery.substring(whereIndex);
            newQuery = newQuery.replace("WHERE ", "");
            return { layer: $rootScope.selectedLayer,
                     query: newQuery
                    };
        }

        _service.GetLayerIdIfValid = function(layerstring) {
            $rootScope.selectedLayer = null;
            MapData.VisibleLayers.forEach(layer => {
                if (layerstring.contains(layer.name)) {
                    $rootScope.selectedLayer = layer;
                }
            });
            if (!$rootScope.selectedLayer) {
                PopupService.Warning("Laag niet gevonden", "Kijk na of u de laag juist heeft geschreven of deze laag in de selectie van lagen zit");
            }
            return $rootScope.selectedLayer;
        }

        _service.IsLayerField = function(currentLayer, fieldname) {
            console.log(currentLayer);
            console.log(fieldname);
            var isLayerField = false;
            currentLayer.fields.forEach(field => {
                if (field.name == fieldname) {
                    isLayerField = true;
                }
            });
            return isLayerField;
        }

        _service.GetLayerField = function(currentLayer, fieldname, line) {
            var selectedField = null;

            currentLayer.fields.forEach(field => {
                if (field.name == fieldname) {
                    selectedField = field;
                    selectedField.$$hashKey = currentLayer.$$hashKey;
                }
            });
            if (selectedField == null) {
                var tmpOp = $rootScope.operations[line];
                return tmpOp.attribute;
            }
            return selectedField;
        }

        // _service.autoComplete = async function(val, index) {
        //     const op = $rootScope.operations[index];
        //     var query = "";
        //     if (val == "") {
        //         query = op.attribute.name + " is not null";
        //     } else {
        //         query = op.attribute.name + " like '%" + val + "%'";
        //     }
        //     var prom = await MapService.startAutoComplete($rootScope.selectedLayer, op.attribute, query);
        //     if (prom.featureCollection != null) {
        //         return prom.featureCollection.features;
        //     } else {
        //         return [];
        //     }
        // }

        _service.IsOperator = function(element) {
            var isOperator = false;
            $rootScope.operators.forEach(operator => {
                if (operator == element) {
                    isOperator = true;
                }
            });
            return isOperator;
        }

        return _service;
    };
    module.factory("SearchAdvancedService", service);
    module.$inject = ['$rootScope', 'MapService', 'PopupService', '$q', 'UIService'];
})();

