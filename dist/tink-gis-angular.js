'use strict';

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter', 'tink.pagination']); //'leaflet-directive'
    }
    module.constant('appConfig', {
        templateUrl: '/digipolis.stadinkaart.webui',
        apiUrl: '/digipolis.stadinkaart.api/',
        enableDebug: true,
        enableLog: true
    });

    module.directive('preventDefault', function () {
        return function (scope, element, attrs) {
            angular.element(element).bind('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
            angular.element(element).bind('dblclick', function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
            angular.element(element).bind('ondrag', function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
            angular.element(element).bind('ondragstart', function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
        };
    });
    JXON.config({
        attrPrefix: '', // default: '@'
        autoDate: false // default: true
    });
    var init = function () {
        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
    }();
    var mapObject = function mapObject() {
        var crsLambert = new L.Proj.CRS('EPSG:31370', '+proj=lcc +lat_1=51.16666723333334 +lat_2=49.83333389999999 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438' + ' +ellps=intl +towgs84=-99.1,53.3,-112.5,0.419,-0.83,1.885,-1.0 +units=m +no_defs', {
            origin: [-35872700, 41422700],
            resolutions: [66.1459656252646, 52.91677250021167, 39.687579375158755, 26.458386250105836, 13.229193125052918, 6.614596562526459, 5.291677250021167, 3.9687579375158752, 3.3072982812632294, 2.6458386250105836, 1.9843789687579376, 1.3229193125052918, 0.6614596562526459, 0.5291677250021167, 0.39687579375158755, 0.33072982812632296, 0.26458386250105836, 0.19843789687579377, 0.13229193125052918, 0.06614596562526459, 0.026458386250105836]
        });
        var map = L.map('map', {
            crs: crsLambert,
            zoomControl: false,
            drawControl: false
        }).setView([51.2192159, 4.4028818], 5);

        // The min/maxZoom values provided should match the actual cache thats been published. This information can be retrieved from the service endpoint directly.
        // L.esri.tiledMapLayer({
        //     url: 'https://geodata.antwerpen.be/arcgissql/rest/services/P_Publiek/P_basemap/MapServer',
        //     maxZoom: 20,
        //     minZoom: 1,
        //     continuousWorld: true
        // }).addTo(map);

        map.doubleClickZoom.disable();
        // L.control.scale({ imperial: false }).addTo(map);
        var drawnItems = L.featureGroup().addTo(map);
        map.on('draw:created', function (event) {
            var layer = event.layer;
            drawnItems.addLayer(layer);
        });
        map.on('draw:drawstart', function (event) {
            //console.log(drawnItems);
            //map.clearDrawings();
        });
        map.clearDrawings = function () {
            console.log('clearingDrawings');
            console.log(drawnItems);
            drawnItems.clearLayers();
        };

        return map;
    };
    module.factory('map', mapObject);
})();
;'use strict';

/* global ThemeStatus, LayerType */
var ThemeStatus = { // http://stijndewitt.com/2014/01/26/enums-in-javascript/
    UNMODIFIED: 0,
    NEW: 1,
    UPDATED: 2,
    DELETED: 3
};
var LayerType = {
    LAYER: 0,
    GROUP: 1
};
var ActiveInteractieButton = {
    IDENTIFY: 'identify',
    SELECT: 'select',
    METEN: 'meten',
    WATISHIER: 'watishier'
};
var DrawingOption = {
    NIETS: '',
    AFSTAND: 'afstand',
    OPPERVLAKTE: 'oppervlakte',
    LIJN: 'lijn',
    VIERKANT: 'vierkant',
    POLYGON: 'polygon'
};
var ThemeType = {
    ESRI: 'esri',
    WMS: 'wms'
};
var Style = {
    DEFAULT: {
        fillOpacity: 0,
        color: 'blue',
        weight: 5
    },
    HIGHLIGHT: {
        weight: 7,
        color: 'red',
        fillOpacity: 0.5
    },
    BUFFER: {
        fillColor: '#00cc00',
        color: '#00cc00',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.3
    }
};

var Scales = [250000, 200000, 150000, 100000, 50000, 25000, 20000, 15000, 12500, 10000, 7500, 5000, 2500, 2000, 1500, 1250, 1000, 750, 500, 250, 100];
;'use strict';

(function (module) {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    }
    module.controller('geoPuntController', ['$scope', 'ThemeHelper', '$q', 'MapService', 'MapData', 'GISService', 'LayerManagementService', 'WMSService', '$window', '$http', 'GeopuntService', function ($scope, ThemeHelper, $q, MapService, MapData, GISService, LayerManagementService, WMSService, $window, $http, GeopuntService) {
        $scope.searchIsUrl = false;
        $scope.pagingCount = null;
        $scope.numberofrecordsmatched = 0;
        // $scope.currentPage = 1;
        LayerManagementService.EnabledThemes.length = 0;
        LayerManagementService.AvailableThemes.length = 0;
        LayerManagementService.EnabledThemes = angular.copy(MapData.Themes);
        $scope.availableThemes = [];
        var init = function () {
            // $scope.searchTerm = 'Laden...';
            // var qwhenready = LayerManagementService.ProcessUrls(urls);
            // qwhenready.then(function(allelagen) {
            // $scope.searchTerm = 'http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';
            $scope.searchTerm = '';
            $scope.searchIsUrl = false;
            // });
        }();

        $scope.searchChanged = function () {
            if ($scope.searchTerm != null && $scope.searchTerm != '' && $scope.searchTerm.length > 2) {
                $scope.clearPreview();
                if ($scope.searchTerm.startsWith('http')) {
                    $scope.searchIsUrl = true;
                } else {
                    $scope.searchIsUrl = false;
                    $scope.QueryGeoPunt($scope.searchTerm, 1);
                }
            } else {
                $scope.availableThemes.length = 0;
                $scope.numberofrecordsmatched = 0;
            }
        };
        $scope.QueryGeoPunt = function (searchTerm, page) {
            var prom = GeopuntService.getMetaData(searchTerm, (page - 1) * 5 + 1, 5);
            prom.then(function (metadata) {
                $scope.availableThemes = metadata.results;
                $scope.currentrecord = metadata.currentrecord;
                $scope.nextrecord = metadata.nextrecord;
                $scope.numberofrecordsmatched = metadata.numberofrecordsmatched;
                // $scope.numberofrecordsreturned = metadata.numberofrecordsreturned;
                // $scope.currentPage = Math.ceil($scope.pagingStart / $scope.recordsAPage)
                console.log(metadata);
            }, function (reason) {
                console.log(reason);
            });
        };
        $scope.pageChanged = function (page, recordsAPage) {
            $scope.QueryGeoPunt($scope.searchTerm, page);
        };
        $scope.laadUrl = function () {
            $scope.searchTerm = $scope.searchTerm.trim().replace('?', '');
            if (MapData.Themes.find(function (x) {
                return x.CleanUrl == $scope.searchTerm;
            }) == undefined) {
                var getwms = WMSService.GetCapabilities($scope.searchTerm);
                getwms.success(function (data, status, headers, config) {
                    $scope.previewTheme(data);
                }).error(function (data, status, headers, config) {
                    $window.alert('error');
                });
            } else {
                alert('Deze is al toegevoegd aan de map.');
            }
        };
        $scope.selectedTheme = null;
        $scope.copySelectedTheme = null;
        $scope.previewTheme = function (theme) {
            console.log('themeChanged');
            console.log(theme);
            $scope.selectedTheme = theme;
            $scope.copySelectedTheme = angular.copy(theme);
        };
        $scope.clearPreview = function () {
            $scope.selectedTheme = null;
            $scope.copySelectedTheme = null;
        };
        $scope.geopuntThemeChanged = function (theme) {
            // alert(theme.Type != 'WMS' && theme.Type != 'ESRI');
            // if (theme.Type != 'wms' && theme.Type != 'esri') {
            console.log(theme);
            var questionmarkPos = theme.Url.trim().indexOf('?');
            var url = theme.Url.trim().substring(0, questionmarkPos);

            // var url = theme.Url.trim().replace('?', '');

            if (MapData.Themes.find(function (x) {
                return x.CleanUrl == url;
            }) == undefined) {
                var getwms = WMSService.GetCapabilities(url);
                getwms.success(function (data, status, headers, config) {

                    $scope.previewTheme(data);
                }).error(function (data, status, headers, config) {
                    $window.alert('error');
                });
            } else {
                alert('Deze is al toegevoegd aan de map.');
            }
            // }
        };
        $scope.AddOrUpdateTheme = function () {
            console.log('AddOrUpdateTheme');
            var allChecked = true;
            var noneChecked = true;
            for (var x = 0; x < $scope.copySelectedTheme.AllLayers.length; x++) {
                // aha dus update gebeurt, we gaan deze toevoegen.
                var copyLayer = $scope.copySelectedTheme.AllLayers[x];
                var realLayer = $scope.selectedTheme.AllLayers[x];
                realLayer.enabled = copyLayer.enabled;
                if (copyLayer.enabled === false) {
                    // check or all the checkboxes are checked
                    allChecked = false;
                } else {
                    noneChecked = false;
                }
            }
            var alreadyAdded = LayerManagementService.EnabledThemes.find(function (x) {
                return x.CleanUrl === $scope.selectedTheme.CleanUrl;
            }) != undefined;
            if (noneChecked) {
                //Niks is checked, dus we moeten deze 'deleten'.
                $scope.selectedTheme.Added = false;
                if ($scope.selectedTheme.status != ThemeStatus.NEW) {
                    // als deze new is dan zette we deze gewoon op niets want we verwijderen die.
                    $scope.selectedTheme.status = ThemeStatus.DELETED;
                } else {
                    if (alreadyAdded) {
                        var index = LayerManagementService.EnabledThemes.indexOf($scope.selectedTheme);
                        if (index > -1) {
                            LayerManagementService.EnabledThemes.splice(index, 1);
                        }
                    }
                }
            } else {
                // het is dus geen delete
                if (allChecked) {
                    $scope.selectedTheme.Added = true; // here we can set the Added to true when they are all added
                } else {
                    $scope.selectedTheme.Added = null; // if not all added then we put it to null
                }
                if (alreadyAdded == false) {
                    // it is a new theme!
                    LayerManagementService.EnabledThemes.push($scope.selectedTheme);
                } else {
                    // already exist! It is an update!
                    if ($scope.selectedTheme.status != ThemeStatus.NEW) {
                        $scope.selectedTheme.status = ThemeStatus.UPDATED;
                        console.log('changed naar updated');
                    } else {
                        console.log('Hij is al new, dus moet hij niet naar updated changen.');
                    }
                }
            }
            console.log('AddOrUpdateTheme');

            $scope.selectedTheme = null;
            $scope.copySelectedTheme = null;
        };

        $scope.ok = function () {
            console.log(LayerManagementService.EnabledThemes);
            $modalInstance.$close(LayerManagementService.EnabledThemes); // return the themes.
        };
        $scope.cancel = function () {
            $modalInstance.$dismiss('cancel is pressed'); // To close the controller with a dismiss message
        };
    }]);
})();
;'use strict';

(function (module) {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    }
    module.controller('LayerManagerController', ['$scope', '$modalInstance', 'LayerManagementService', function ($scope, $modalInstance, LayerManagementService) {
        $scope.active = 'solr';

        $scope.ok = function () {
            $modalInstance.$close(LayerManagementService.EnabledThemes); // return the themes.
        };
        $scope.cancel = function () {
            $modalInstance.$dismiss('cancel is pressed'); // To close the controller with a dismiss message
        };
    }]);
})();
;'use strict';

(function (module) {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    }
    module.controller('solrGISController', ['$scope', 'ThemeHelper', '$q', 'MapService', 'MapData', 'GISService', 'LayerManagementService', 'WMSService', '$window', '$http', 'GeopuntService', function ($scope, ThemeHelper, $q, MapService, MapData, GISService, LayerManagementService, WMSService, $window, $http, GeopuntService) {
        $scope.pagingCount = null;
        $scope.numberofrecordsmatched = 0;
        // $scope.currentPage = 1;
        LayerManagementService.EnabledThemes.length = 0;
        LayerManagementService.AvailableThemes.length = 0;
        LayerManagementService.EnabledThemes = angular.copy(MapData.Themes);
        $scope.availableThemes = [];
        $scope.allThemes = [];
        var init = function () {
            $scope.searchTerm = '';
        }();
        $scope.searchChanged = function () {
            if ($scope.searchTerm != null && $scope.searchTerm != '' && $scope.searchTerm.length > 2) {
                $scope.clearPreview();

                $scope.QueryGISSOLR($scope.searchTerm, 1);
            } else {
                $scope.availableThemes.length = 0;
                $scope.numberofrecordsmatched = 0;
            }
        };
        $scope.QueryGISSOLR = function (searchterm, page) {
            var prom = GISService.QuerySOLRGIS(searchterm, (page - 1) * 5 + 1, 5);
            prom.then(function (data) {
                $scope.currentPage = 1;
                var allitems = data.facet_counts.facet_fields.parent;
                var itemsMetData = data.grouped.parent.groups;
                var aantalitems = allitems.length;
                var x = 0;
                var themes = [];
                itemsMetData.forEach(function (itemMetData) {
                    switch (itemMetData.doclist.docs[0].type) {
                        case "Feature":
                            var themeName = itemMetData.groupValue.split('/').slice(1, 2).join('/');
                            var layerId = itemMetData.groupValue.split('/')[2];
                            var layerName = itemMetData.doclist.docs[0].parentname;
                            var theme = themes.find(function (x) {
                                return x.name == themeName;
                            });
                            if (!theme) {
                                var theme = {
                                    layers: [],
                                    layersCount: 0,
                                    name: themeName,
                                    cleanUrl: 'http://app10.p.gis.local/arcgissql/rest/services/P_Stad/' + themeName + '/MapServer',
                                    url: 'services/P_Stad/' + themeName + '/MapServer'
                                };
                                themes.push(theme);
                            }
                            var layer = theme.layers.find(function (x) {
                                return x.id == layerId;
                            });
                            if (!layer) {
                                layer = {
                                    naam: layerName,
                                    id: layerId,
                                    features: [],
                                    featuresCount: itemMetData.doclist.numFound,
                                    isMatch: false
                                };
                                theme.layers.push(layer);
                            } else {
                                layer.featuresCount = itemMetData.doclist.numFound;
                            }
                            itemMetData.doclist.docs.forEach(function (item) {
                                var feature = item.titel.join(' ');
                                // id: item.id
                                layer.features.push(feature);
                            });
                            break;
                        case "Layer":
                            var themeName = itemMetData.groupValue.split('/')[1];
                            var theme = themes.find(function (x) {
                                return x.name == themeName;
                            });
                            if (!theme) {
                                theme = {
                                    layers: [],
                                    layersCount: itemMetData.doclist.numFound,
                                    name: themeName,
                                    cleanUrl: 'http://app10.p.gis.local/arcgissql/rest/services/P_Stad/' + themeName + '/MapServer',
                                    url: 'services/P_Stad/' + themeName + '/MapServer'
                                };
                                themes.push(theme);
                            } else {
                                theme.layersCount = itemMetData.doclist.numFound;
                                // theme.isMatch = true;
                            }

                            itemMetData.doclist.docs.forEach(function (item) {
                                var layer = theme.layers.find(function (x) {
                                    return x.id == item.key;
                                });
                                if (!layer) {
                                    layer = {
                                        naam: item.titel[0],
                                        id: item.key,
                                        isMatch: true,
                                        featuresCount: 0,
                                        features: []
                                    };
                                    theme.layers.push(layer);
                                } else {
                                    layer.isMatch = true;
                                }
                            });

                            break;
                        default:
                            console.log("UNKOWN TYPE:", item);
                            break;
                    }
                });
                $scope.availableThemes = themes.slice(0, 5);
                $scope.allThemes = themes;
                $scope.numberofrecordsmatched = themes.length;
                console.log(data);
            }, function (reason) {
                console.log(reason);
            });
        };
        $scope.pageChanged = function (page, recordsAPage) {
            var startItem = (page - 1) * recordsAPage;
            $scope.availableThemes = $scope.allThemes.slice(startItem, startItem + recordsAPage);
            // console.log(page, recordsAPage);
            // $scope.QueryGISSOLR($scope.searchTerm, page);
        };
        $scope.selectedTheme = null;
        $scope.copySelectedTheme = null;
        $scope.previewTheme = function (theme) {
            console.log('themeChanged');
            console.log(theme);
            $scope.selectedTheme = theme;
            $scope.copySelectedTheme = angular.copy(theme);
        };
        $scope.clearPreview = function () {
            $scope.selectedTheme = null;
            $scope.copySelectedTheme = null;
        };
        $scope.solrThemeChanged = function (theme) {
            GISService.GetThemeData(theme.url).then(function (data, statuscode, functie, getdata) {
                if (!data.error) {
                    var convertedTheme = ThemeHelper.createThemeFromJson(data, theme);
                    $scope.previewTheme(convertedTheme);
                } else {
                    console.log('ERROR:', data.error);
                }
            });
        };
        $scope.AddOrUpdateTheme = function () {
            console.log('AddOrUpdateTheme');
            var allChecked = true;
            var noneChecked = true;
            for (var x = 0; x < $scope.copySelectedTheme.AllLayers.length; x++) {
                // aha dus update gebeurt, we gaan deze toevoegen.
                var copyLayer = $scope.copySelectedTheme.AllLayers[x];
                var realLayer = $scope.selectedTheme.AllLayers[x];
                realLayer.enabled = copyLayer.enabled;
                if (copyLayer.enabled === false) {
                    // check or all the checkboxes are checked
                    allChecked = false;
                } else {
                    noneChecked = false;
                }
            }
            var alreadyAdded = LayerManagementService.EnabledThemes.find(function (x) {
                return x.CleanUrl === $scope.selectedTheme.CleanUrl;
            }) != undefined;
            if (noneChecked) {
                //Niks is checked, dus we moeten deze 'deleten'.
                $scope.selectedTheme.Added = false;
                if ($scope.selectedTheme.status != ThemeStatus.NEW) {
                    // als deze new is dan zette we deze gewoon op niets want we verwijderen die.
                    $scope.selectedTheme.status = ThemeStatus.DELETED;
                } else {
                    if (alreadyAdded) {
                        var index = LayerManagementService.EnabledThemes.indexOf($scope.selectedTheme);
                        if (index > -1) {
                            LayerManagementService.EnabledThemes.splice(index, 1);
                        }
                    }
                }
            } else {
                // het is dus geen delete
                if (allChecked) {
                    $scope.selectedTheme.Added = true; // here we can set the Added to true when they are all added
                } else {
                    $scope.selectedTheme.Added = null; // if not all added then we put it to null
                }
                if (alreadyAdded == false) {
                    // it is a new theme!
                    LayerManagementService.EnabledThemes.push($scope.selectedTheme);
                } else {
                    // already exist! It is an update!
                    if ($scope.selectedTheme.status != ThemeStatus.NEW) {
                        $scope.selectedTheme.status = ThemeStatus.UPDATED;
                        console.log('changed naar updated');
                    } else {
                        console.log('Hij is al new, dus moet hij niet naar updated changen.');
                    }
                }
            }
            console.log('AddOrUpdateTheme');

            $scope.selectedTheme = null;
            $scope.copySelectedTheme = null;
        };

        $scope.ok = function () {
            console.log(LayerManagementService.EnabledThemes);
            $modalInstance.$close(LayerManagementService.EnabledThemes); // return the themes.
        };
        $scope.cancel = function () {
            $modalInstance.$dismiss('cancel is pressed'); // To close the controller with a dismiss message
        };
    }]);
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('geoPunt', function () {
        return {
            replace: true,
            scope: {
                layer: '='
            },
            templateUrl: 'templates/layermanagement/geoPuntTemplate.html',
            controller: 'geoPuntController',
            controllerAs: 'geoPuntctrl'
        };
    });
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('solrGis', function () {
        return {
            replace: true,
            scope: {
                layer: '='
            },
            templateUrl: 'templates/layermanagement/solrGISTemplate.html',
            controller: 'solrGISController',
            controllerAs: 'solrGISctrl'
        };
    });
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service($http, map, MapData, $rootScope, $q, helperService) {
        var _service = {};
        _service.getMetaData = function () {
            var searchterm = arguments.length <= 0 || arguments[0] === undefined ? 'water' : arguments[0];
            var startpos = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
            var recordsAPage = arguments.length <= 2 || arguments[2] === undefined ? 10 : arguments[2];

            var url = 'https://metadata.geopunt.be/zoekdienst/srv/dut/csw?service=CSW&version=2.0.2&SortBy=title&request=GetRecords&namespace=xmlns%28csw=http://www.opengis.net/cat/csw%29&resultType=results&outputSchema=http://www.opengis.net/cat/csw/2.0.2&outputFormat=application/xml&startPosition=' + startpos + '&maxRecords=' + recordsAPage + '&typeNames=csw:Record&elementSetName=full&constraintLanguage=CQL_TEXT&constraint_language_version=1.1.0&constraint=AnyText+LIKE+%27%25' + searchterm + '%25%27AND%20Type%20=%20%27service%27%20AND%20Servicetype%20=%27view%27';
            // var url = 'https://metadata.geopunt.be/zoekdienst/srv/dut/q?fast=index&from=' + startpos + '&to=' + recordsAPage + '&any=*' + searchterm + '*&sortBy=title&sortOrder=reverse&hitsperpage=' + recordsAPage;
            var prom = $q.defer();
            $http.get(helperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                if (data) {
                    data = helperService.UnwrapProxiedData(data);
                    var returnjson = JXON.stringToJs(data);
                    var getResults = returnjson['csw:getrecordsresponse']['csw:searchresults'];
                    var returnObject = {};
                    returnObject.searchTerm = searchterm;
                    returnObject.currentrecord = startpos;
                    returnObject.recordsAPage = recordsAPage;
                    returnObject.nextrecord = getResults.nextrecord;
                    returnObject.numberofrecordsmatched = getResults.numberofrecordsmatched;
                    returnObject.numberofrecordsreturned = getResults.numberofrecordsreturned;
                    returnObject.results = [];
                    if (returnObject.numberofrecordsmatched != 0) {
                        // only foreach when there are items
                        if (returnObject.numberofrecordsmatched == 1) {
                            var processedTheme = procesTheme(getResults['csw:record']);
                            returnObject.results.push(processedTheme);
                        } else {
                            getResults['csw:record'].forEach(function (record) {
                                var processedTheme = procesTheme(record);
                                returnObject.results.push(processedTheme);
                            });
                        }
                    }
                    prom.resolve(returnObject);
                    // console.log(getResults['csw:record']);
                } else {
                    prom.reject(null);
                    console.log('EMPTY RESULT');
                }
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        var procesTheme = function procesTheme(record) {
            if (record['dc:uri'] instanceof Array == false) {
                var tmpdata = record['dc:uri'];
                record['dc:uri'] = [];
                record['dc:uri'].push(tmpdata);
            }
            var tmptheme = {};
            tmptheme.Added = false;
            tmptheme.Naam = record['dc:title'];
            var wmsinfo = record['dc:uri'].find(function (x) {
                return x.protocol == 'WMS' || x.protocol == 'OGC:WMS';
            });
            if (wmsinfo) {
                tmptheme.Url = wmsinfo.keyValue;
                tmptheme.Type = ThemeType.WMS;
            } else {
                tmptheme.Type = 'DONTKNOW';
            }
            tmptheme.TMPMETADATA = record;
            return tmptheme;
        };
        return _service;
    };
    module.factory('GeopuntService', ['$http', 'map', 'MapData', '$rootScope', '$q', 'HelperService', service]);
})();
;
'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service(MapData, $http, $q, GISService, ThemeHelper) {
        var _service = {};
        _service.EnabledThemes = [];
        _service.AvailableThemes = [];
        _service.ProcessUrls = function (urls) {
            var promises = [];
            _.each(urls, function (url) {
                var AlreadyAddedTheme = null;
                _service.EnabledThemes.forEach(function (theme) {
                    // OPTI kan paar loops minder door betere zoek in array te doen
                    if (theme.CleanUrl == url) {
                        AlreadyAddedTheme = theme;
                    }
                });
                if (AlreadyAddedTheme == null) {
                    // if we didn t get an alreadyadderdtheme we get the data
                    var prom = GISService.GetThemeData(url + '?f=pjson');
                    prom.then(function (data) {
                        var convertedTheme = ThemeHelper.createThemeFromJson(data, getdata);
                        _service.AvailableThemes.push(convertedTheme);
                        convertedTheme.status = ThemeStatus.NEW;
                    });
                    promises.push(prom);
                } else {
                    // ah we already got it then just push it.
                    AlreadyAddedTheme.status = ThemeStatus.UNMODIFIED;
                    _service.AvailableThemes.push(AlreadyAddedTheme);
                }
            });
            // $q.all(promises).then(function(lagen) {
            //     console.log(lagen);
            // });
            return $q.all(promises);
        };
        _service.GetAditionalLayerInfo = function (theme) {
            var promLegend = GISService.GetLegendData(theme.CleanUrl);
            promLegend.then(function (data) {
                theme.AllLayers.forEach(function (layer) {
                    var layerid = layer.id;
                    var layerInfo = data.layers.find(function (x) {
                        return x.layerId == layerid;
                    });
                    layer.legend = [];
                    if (layerInfo) {
                        layer.legend = layerInfo.legend;
                        layer.legend.forEach(function (legenditem) {
                            legenditem.fullurl = theme.CleanUrl + '/' + layerInfo.layerId + '/images/' + legenditem.url;
                        });
                    }
                });
            });
            var promLayerData = GISService.GetThemeLayerData(theme.CleanUrl);
            promLayerData.then(function (data) {
                theme.AllLayers.forEach(function (layer) {
                    var layerid = layer.id;
                    var layerInfo = data.layers.find(function (x) {
                        return x.id == layerid;
                    });
                    layer.displayField = layerInfo.displayField;
                    layer.fields = layerInfo.fields;
                });
            });
        };
        return _service;
    };
    module.$inject = ['MapData', '$http', '$q', 'GISService', 'ThemeHelper'];
    module.factory('LayerManagementService', service);
})();
;'use strict';

(function (module) {
    try {
        var module = angular.module('tink.gis');
    } catch (e) {
        var module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi']); //'leaflet-directive'
    }
    module = angular.module('tink.gis');
    module.controller('groupLayerController', function ($scope) {
        var vm = this;
        vm.grouplayer = $scope.grouplayer;
        vm.chkChanged = function () {
            $scope.$emit('groupCheckboxChangedEvent', $scope.grouplayer); // stuur naar parent ofwel group ofwel theme
        };
    });
})();
;'use strict';

(function (module) {
    try {
        var module = angular.module('tink.gis');
    } catch (e) {
        var module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi']); //'leaflet-directive'
    }
    var theController = module.controller('layerController', function ($scope) {
        var vm = this;
        vm.layer = $scope.layer;
        vm.chkChanged = function () {
            $scope.$emit('layerCheckboxChangedEvent', $scope.layer); // stuur naar parent ofwel group ofwel theme
        };
    });
    theController.$inject = [];
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    var theController = module.controller('layersController', function ($scope, MapData, map, ThemeService, $modal) {
        var vm = this;
        vm.themes = MapData.Themes;
        vm.selectedLayers = [];

        vm.sortableOptions = {
            // update: function(e, ui) {
            //     console.log("UPDATEZINDEXES");
            //     MapData.SetZIndexes();
            // },
            stop: function stop(e, ui) {
                // console.log("stop");
                MapData.SetZIndexes();
            }
        };
        $scope.$watch(function () {
            return MapData.Themes;
        }, function (newVal, oldVal) {
            console.log("WATCH OP MAPDATATHEMES IN LAYERSCONTROLLER");
            MapData.SetZIndexes(newVal);
        });
        vm.AddLayers = function () {
            var addLayerInstance = $modal.open({
                templateUrl: 'templates/layermanagement/layerManagerTemplate.html',
                controller: 'LayerManagerController',
                resolve: {
                    backdrop: false,
                    keyboard: true
                    // urls: function() {
                    //     return MapData.ThemeUrls;
                    // }
                }
            });
            addLayerInstance.result.then(function (selectedThemes) {
                ThemeService.AddAndUpdateThemes(selectedThemes);
            }, function (obj) {
                console.log('Modal dismissed at: ' + new Date()); // The contoller is closed by the use of the $dismiss call
            });
        };
    });
    theController.$inject = ['MapData', 'map', 'ThemeService', '$modal'];
})();
;/// <reference path='../services/mapService.js' />

'use strict';

(function (module) {
    module = angular.module('tink.gis');
    var theController = module.controller('mapController', function ($scope, BaseLayersService, MapService, MapData, map, MapEvents, DrawService, HelperService, GISService) {
        //We need to include MapEvents, even tho we don t call it just to make sure it gets loaded!
        var vm = this;
        vm.layerId = '';
        vm.ZoekenOpLocatie = true;
        vm.activeInteractieKnop = MapData.ActiveInteractieKnop;
        vm.SelectableLayers = MapData.VisibleLayers;
        vm.selectedLayer = MapData.SelectedLayer;
        vm.drawingType = MapData.DrawingType;
        vm.showMetenControls = false;
        vm.showDrawControls = false;
        vm.interactieButtonChanged = function (ActiveButton) {
            MapData.CleanMap();
            MapData.ActiveInteractieKnop = ActiveButton; // If we only could keep the vmactiveInteractieKnop in sync with the one from MapData
            vm.activeInteractieKnop = ActiveButton;
            vm.showMetenControls = false;
            vm.showDrawControls = false;
            switch (ActiveButton) {
                case ActiveInteractieButton.SELECT:
                    vm.showDrawControls = true;
                    vm.selectpunt();
                    break;
                case ActiveInteractieButton.METEN:
                    vm.showMetenControls = true;
                    vm.drawingButtonChanged(DrawingOption.AFSTAND);
                    break;
            }
        };
        vm.zoekLaag = function (search) {
            MapData.CleanMap();
            MapService.Find(search);
        };
        vm.zoekLocatie = function (search) {
            search = search.trim();
            var WGS84Check = HelperService.getWGS84CordsFromString(search);
            if (WGS84Check.hasCordinates) {
                map.setView(L.latLng(WGS84Check.X, WGS84Check.Y), 12);
            } else {
                var lambertCheck = HelperService.getLambartCordsFromString(search);
                if (lambertCheck.hasCordinates) {
                    var xyWGS84 = HelperService.ConvertLambert72ToWSG84({ x: lambertCheck.X, y: lambertCheck.Y });
                    map.setView(L.latLng(xyWGS84.x, xyWGS84.y), 12);
                } else {
                    console.log('NIET GEVONDEN');
                }
            }
        };

        vm.zoekLocChanged = function (search) {
            var prom = GISService.QuerySOLRLocatie(search);
            prom.then(function (data) {
                console.log(data);
            });
        };

        vm.drawingButtonChanged = function (drawOption) {
            MapData.CleanMap();
            MapData.DrawingType = drawOption; // pff must be possible to be able to sync them...
            vm.drawingType = drawOption;
            DrawService.StartDraw(drawOption);
        };
        vm.Loading = 0;
        vm.MaxLoading = 0;

        $scope.$watch(function () {
            return MapData.Loading;
        }, function (newVal, oldVal) {
            console.log('MapData.Loading at start', MapData.Loading);
            vm.Loading = newVal;
            if (oldVal == 0) {
                vm.MaxLoading = newVal;
            }
            if (vm.MaxLoading < oldVal) {
                vm.MaxLoading = oldVal;
            }
            if (newVal == 0) {
                vm.MaxLoading = 0;
            }
            console.log('MapLoading val: ' + newVal + '/' + vm.MaxLoading);
            console.log('MapData.Loading at the end', MapData.Loading);
        });
        vm.selectpunt = function () {
            MapData.CleanMap();
            MapData.DrawingType = DrawingOption.NIETS; // pff must be possible to be able to sync them...
            vm.drawingType = DrawingOption.NIETS;
        };
        vm.layerChange = function () {
            MapData.CleanMap();
            // console.log('vm.sel: ' + vm.selectedLayer.id + '/ MapData.SelectedLayer: ' + MapData.Layer.SelectedLayer.id);
            MapData.SelectedLayer = vm.selectedLayer;
        };
        vm.zoomIn = function () {
            map.zoomIn();
        };
        vm.zoomOut = function () {
            map.zoomOut();
        };
        vm.fullExtent = function () {
            map.setView(new L.LatLng(51.2192159, 4.4028818), 16);
        };
        vm.kaartIsGetoond = true;
        vm.toonKaart = function () {
            vm.kaartIsGetoond = true;
            map.removeLayer(BaseLayersService.luchtfoto);
            map.addLayer(BaseLayersService.kaart);
        };
        vm.toonLuchtfoto = function () {
            vm.kaartIsGetoond = false;
            map.removeLayer(BaseLayersService.kaart);
            map.addLayer(BaseLayersService.luchtfoto);
        };
    });
    theController.$inject = ['BaseLayersService', 'MapService', 'MapData', 'map', 'MapEvents', 'DrawService', 'HelperService', 'GISService'];
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.controller('themeController', ['$scope', 'MapService', 'ThemeService', function ($scope, MapService, ThemeService) {
        var vm = this;
        console.log('Theme geladen');
        vm.theme = $scope.theme;
        $scope.$on('groupCheckboxChangedEvent', function (event, groupLayer) {
            // stuur het door naar het thema
            MapService.UpdateGroupLayerStatus(groupLayer, vm.theme);
            ThemeService.UpdateThemeVisibleLayers(vm.theme);
        });
        $scope.$on('layerCheckboxChangedEvent', function (event, layer) {
            // stuur het door naar het thema
            MapService.UpdateLayerStatus(layer, vm.theme);
            ThemeService.UpdateThemeVisibleLayers(vm.theme);
        });
        vm.chkChanged = function () {
            MapService.UpdateThemeStatus(vm.theme);
            ThemeService.UpdateThemeVisibleLayers(vm.theme);
        };
        vm.deleteTheme = function () {
            swal({
                title: 'Verwijderen?',
                text: 'U staat op het punt om ' + vm.theme.Naam + ' te verwijderen.',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Verwijder',
                closeOnConfirm: true
            }, function () {
                ThemeService.DeleteTheme(vm.theme);
                $scope.$apply();
            });
            console.log(vm.theme);
        };
    }]);
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkGrouplayer', function () {
        return {
            replace: true,
            scope: {
                grouplayer: '='
            },
            templateUrl: 'templates/other/groupLayerTemplate.html',
            controller: 'groupLayerController',
            controllerAs: 'grplyrctrl'
        };
    });
})();
;'use strict';

(function (module) {

    angular.module('tink.gis').directive('indeterminateCheckbox', [function () {
        return {
            scope: true,
            require: '?ngModel',
            link: function link(scope, element, attrs, modelCtrl) {
                var childList = attrs.childList;
                var property = attrs.property;
                // Bind the onChange event to update children
                element.bind('change', function () {
                    scope.$apply(function () {
                        var isChecked = element.prop('checked');
                        // Set each child's selected property to the checkbox's checked property
                        angular.forEach(scope.$eval(childList), function (child) {
                            child[property] = isChecked;
                        });
                    });
                });
                //https://tech.small-improvements.com/2014/06/11/deep-watching-circular-data-structures-in-angular/
                function watchChildrenListWithProperty() {
                    return scope.$eval(childList).map(function (x) {
                        return x[property];
                    });
                }
                // Watch the children for changes
                scope.$watch(watchChildrenListWithProperty, function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var hasChecked = false;
                        var hasUnchecked = false;
                        // Loop through the children
                        angular.forEach(newValue, function (child) {
                            if (child) {
                                hasChecked = true;
                            } else {
                                hasUnchecked = true;
                            }
                        });
                        // Determine which state to put the checkbox in
                        if (hasChecked && hasUnchecked) {
                            element.prop('checked', true);
                            element.prop('indeterminate', true);
                            if (modelCtrl) {
                                modelCtrl.$setViewValue(true);
                            }
                        } else {
                            element.prop('checked', hasChecked);
                            element.prop('indeterminate', false);
                            if (modelCtrl) {
                                modelCtrl.$setViewValue(hasChecked);
                            }
                        }
                    }
                }, true);
            }
        };
    }]);
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkLayer', function () {
        return {
            replace: true,
            scope: {
                layer: '='
            },
            templateUrl: 'templates/other/layerTemplate.html',
            controller: 'layerController',
            controllerAs: 'lyrctrl'
        };
    });
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkLayers', function () {
        return {
            replace: true,
            templateUrl: 'templates/other/layersTemplate.html',
            controller: 'layersController',
            controllerAs: 'lyrsctrl'
        };
    });
})();
;'use strict';

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter', 'tink.pagination']); //'leaflet-directive'
    }
    module.directive('tinkMap', function () {
        return {
            replace: true,
            templateUrl: 'templates/other/mapTemplate.html',
            controller: 'mapController',
            controllerAs: 'mapctrl'
        };
    });
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkTheme', function () {
        return {
            replace: true,
            scope: {
                theme: '='
            },
            templateUrl: 'templates/other/themeTemplate.html',
            controller: 'themeController',
            controllerAs: 'thmctrl'
        };
    });
})();
;//http://app10.p.gis.local/arcgissql/rest/services/COMLOC_CRAB_NAVTEQ/GeocodeServer/reverseGeocode
//http://proj4js.org/
'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service($http, map, MapData, HelperService, $q) {
        var _service = {};
        _service.ReverseGeocode = function (event) {
            var lambert72Cords = HelperService.ConvertWSG84ToLambert72(event.latlng);
            var loc = lambert72Cords.x + ',' + lambert72Cords.y;
            var urlloc = encodeURIComponent(loc);
            MapData.CleanWatIsHier();
            var url = 'http://app10.p.gis.local/arcgissql/rest/services/COMLOC_CRAB_NAVTEQ/GeocodeServer/reverseGeocode?location=' + urlloc + '&distance=50&outSR=&f=json';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                if (!data.error) {
                    MapData.CreateWatIsHierMarker(data);
                    console.log(data);
                    MapData.CreateOrigineleMarker(event.latlng, true);
                } else {
                    MapData.CreateOrigineleMarker(event.latlng, false);
                }
            }).error(function (data, status, headers, config) {
                console.log('ERROR!', status, headers, data);
            });
        };
        _service.QuerySOLRGIS = function (search) {
            var prom = $q.defer();
            // select?q=school&wt=json&indent=true&facet=true&facet.field=parent&group=true&group.field=parent&group.limit=2
            var url = 'http://esb-app1-o.antwerpen.be/v1/giszoek/solr/search?q=*' + search + '*&wt=json&indent=true&facet=true&rows=999&facet.field=parent&group=true&group.field=parent&group.limit=5&solrtype=gis';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                prom.resolve(data);
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        _service.QuerySOLRLocatie = function (search) {
            var prom = $q.defer();
            var url = 'http://esb-app1-o.antwerpen.be/v1/giszoek/solr/search?q=*' + search + '*&wt=json&indent=true&solrtype=gislocaties';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                prom.resolve(data);
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        var baseurl = 'http://app10.p.gis.local/arcgissql/rest/';
        _service.GetThemeData = function (mapserver) {
            var prom = $q.defer();
            if (!mapserver.contains(baseurl)) {
                mapserver = baseurl + mapserver;
            }
            var url = mapserver + '?f=pjson';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                prom.resolve(data);
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        _service.GetThemeLayerData = function (cleanurl) {
            var prom = $q.defer();

            var url = cleanurl + '/layers?f=pjson';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                prom.resolve(data);
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        _service.GetLegendData = function (cleanurl) {
            var prom = $q.defer();

            var url = cleanurl + '/legend?f=pjson';
            $http.get(HelperService.CreateProxyUrl(url)).success(function (data, status, headers, config) {
                data = HelperService.UnwrapProxiedData(data);
                prom.resolve(data);
            }).error(function (data, status, headers, config) {
                prom.reject(null);
                console.log('ERROR!', data, status, headers, config);
            });
            return prom.promise;
        };
        return _service;
    };
    module.$inject = ['$http', 'map', 'MapData', 'HelperService', '$q'];
    module.factory('GISService', service);
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service($http, MapService, MapData) {
        var _service = {};

        _service.Buffer = function (location, distance, selectedlayer) {
            MapData.CleanMap();

            var geo = getGeo(location.geometry);
            delete geo.geometry.spatialReference;
            geo.geometries = geo.geometry;
            delete geo.geometry;
            var sergeo = serialize(geo);
            var url = 'http://app10.p.gis.local/arcgissql/rest/services/Utilities/Geometry/GeometryServer/buffer';
            var body = 'inSR=4326&outSR=4326&bufferSR=31370&distances=' + distance * 100 + '&unit=109006&unionResults=true&geodesic=false&geometries=%7B' + sergeo + '%7D&f=json';
            var prom = $http({
                method: 'POST',
                url: url,
                data: body,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;'
                }
            });
            prom.success(function (response) {
                var buffer = MapData.CreateBuffer(response);
                MapService.Query(buffer, selectedlayer);
            });
            return prom;
        };
        _service.Doordruk = function (location) {
            MapData.CleanMap();
            console.log(location);
            MapService.Query(location);
        };

        _service.BufferEnDoordruk = function (location, distance) {
            if (distance === 0) {
                _service.Doordruk(location);
            } else {
                _service.Buffer(location, distance);
            }
        };

        var getGeo = function getGeo(geometry) {
            var geoconverted = {};
            // geoconverted.inSr = 4326;

            // convert bounds to extent and finish
            if (geometry instanceof L.LatLngBounds) {
                // set geometry + geometryType
                geoconverted.geometry = L.esri.Util.boundsToExtent(geometry);
                geoconverted.geometryType = 'esriGeometryEnvelope';
                return geoconverted;
            }

            // convert L.Marker > L.LatLng
            if (geometry.getLatLng) {
                geometry = geometry.getLatLng();
            }

            // convert L.LatLng to a geojson point and continue;
            if (geometry instanceof L.LatLng) {
                geometry = {
                    type: 'Point',
                    coordinates: [geometry.lng, geometry.lat]
                };
            }

            // handle L.GeoJSON, pull out the first geometry
            if (geometry instanceof L.GeoJSON) {
                // reassign geometry to the GeoJSON value  (we are assuming that only one feature is present)
                geometry = geometry.getLayers()[0].feature.geometry;
                geoconverted.geometry = L.esri.Util.geojsonToArcGIS(geometry);
                geoconverted.geometryType = L.esri.Util.geojsonTypeToArcGIS(geometry.type);
            }

            // Handle L.Polyline and L.Polygon
            if (geometry.toGeoJSON) {
                geometry = geometry.toGeoJSON();
            }

            // handle GeoJSON feature by pulling out the geometry
            if (geometry.type === 'Feature') {
                // get the geometry of the geojson feature
                geometry = geometry.geometry;
            } else {
                geoconverted.geometry = L.esri.Util.geojsonToArcGIS(geometry);
                geoconverted.geometryType = L.esri.Util.geojsonTypeToArcGIS(geometry.type);
            }

            // confirm that our GeoJSON is a point, line or polygon
            // if (geometry.type === 'Point' || geometry.type === 'LineString' || geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {

            return geoconverted;
            // }

            // warn the user if we havn't found an appropriate object

            // return geoconverted;
        };
        var serialize = function serialize(params) {
            var data = '';
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var param = params[key];
                    var type = Object.prototype.toString.call(param);
                    var value;

                    if (data.length) {
                        data += ',';
                    }

                    if (type === '[object Array]') {
                        value = Object.prototype.toString.call(param[0]) === '[object Object]' ? JSON.stringify(param) : param.join(',');
                    } else if (type === '[object Object]') {
                        value = JSON.stringify(param);
                    } else if (type === '[object Date]') {
                        value = param.valueOf();
                    } else {
                        value = '"' + param + '"';
                    }
                    if (key == 'geometries') {
                        data += encodeURIComponent('"' + key + '"') + ':' + encodeURIComponent('[' + value + ']');
                    } else {
                        data += encodeURIComponent('"' + key + '"') + ':' + encodeURIComponent(value);
                    }
                }
            }

            return data;
        };
        return _service;
    };
    module.$inject = ['$http', 'MapService', 'MapData'];
    module.factory('GeometryService', service);
})();
;'use strict';

(function () {
    // try {
    var module = angular.module('tink.gis');
    // } catch (e) {
    //     module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    // }
    var service = function service($http, $window, map, helperService) {
        var _service = {};

        _service.GetCapabilities = function (url) {
            var fullurl = url + '?request=GetCapabilities&service=WMS&callback=foo';
            var prom = $http({
                method: 'GET',
                url: helperService.CreateProxyUrl(fullurl),
                timeout: 10000,
                // params: {},  // Query Parameters (GET)
                transformResponse: function transformResponse(data) {
                    var wmstheme = {};
                    if (data) {
                        data = helperService.UnwrapProxiedData(data);
                        if (data.listOfHttpError) {
                            console.log(data.listOfHttpError, fullurl);
                        } else {
                            var returnjson = JXON.stringToJs(data).wms_capabilities;
                            console.log(returnjson);
                            wmstheme.Version = returnjson['version'];
                            wmstheme.name = returnjson.service.title;
                            wmstheme.Naam = returnjson.service.title;
                            // wmstheme.Title = returnjson.service.title;
                            wmstheme.enabled = true;
                            wmstheme.Visible = true;
                            wmstheme.Layers = [];
                            wmstheme.AllLayers = [];
                            wmstheme.Groups = []; // layergroups die nog eens layers zelf hebben
                            wmstheme.CleanUrl = url;
                            wmstheme.Added = false;
                            wmstheme.status = ThemeStatus.NEW;
                            wmstheme.Description = returnjson.service.abstract;
                            wmstheme.Type = ThemeType.WMS;
                            wmstheme.VisibleLayerIds = [];
                            wmstheme.VisibleLayers = [];
                            var createLayer = function createLayer(layer) {
                                var tmplayer = {};
                                tmplayer.visible = true;
                                tmplayer.enabled = true;
                                tmplayer.parent = null;
                                tmplayer.displayed = true;
                                tmplayer.theme = wmstheme;
                                tmplayer.name = layer.name;
                                tmplayer.title = layer.title;
                                tmplayer.queryable = layer.queryable;
                                tmplayer.type = LayerType.LAYER;
                                tmplayer.id = layer.name; //names are the ids of the layer in wms
                                wmstheme.Layers.push(tmplayer);
                                wmstheme.AllLayers.push(tmplayer);
                            };
                            var layers = returnjson.capability.layer.layer;
                            if (layers) {
                                if (layers.length != undefined) {
                                    // array, it has a length
                                    layers.forEach(function (layer) {
                                        createLayer(layer);
                                    });
                                } else {
                                    createLayer(layers);
                                }
                            } else {
                                createLayer(returnjson.capability.layer);
                            }

                            wmstheme.UpdateMap = function () {
                                wmstheme.RecalculateVisibleLayerIds();
                                map.removeLayer(wmstheme.MapData);
                                map.addLayer(wmstheme.MapData);
                            };

                            wmstheme.RecalculateVisibleLayerIds = function () {
                                wmstheme.VisibleLayerIds.length = 0;
                                _.forEach(wmstheme.VisibleLayers, function (visLayer) {
                                    wmstheme.VisibleLayerIds.push(visLayer.id);
                                });
                                if (wmstheme.VisibleLayerIds.length === 0) {
                                    wmstheme.VisibleLayerIds.push(-1); //als we niet doen dan zoekt hij op alle lagen!
                                }
                            };
                            wmstheme.RecalculateVisibleLayerIds();
                        }
                    }

                    return wmstheme;
                }
            }).success(function (data, status, headers, config) {
                console.dir(data); // XML document object
            }).error(function (data, status, headers, config) {
                console.log('error: data, status, headers, config:');
                console.log(data);
                console.log(status);
                console.log(headers);
                console.log(config);
                $window.alert('error');
            });
            return prom;
        };

        return _service;
    };
    // module.$inject = ['HelperService'];

    module.service('WMSService', ['$http', '$window', 'map', 'HelperService', service]);
})();
;'use strict';

(function () {
    try {
        var module = angular.module('tink.gis');
    } catch (e) {
        var module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi']); //'leaflet-directive'
    }
    var baseLayersService = function baseLayersService(map) {
        var _baseLayersService = {};
        _baseLayersService.kaart = L.esri.tiledMapLayer({
            url: 'https://geodata.antwerpen.be/arcgissql/rest/services/P_Publiek/P_basemap/MapServer',
            // url: 'http://geodata.antwerpen.be/arcgissql/rest/services/P_Publiek/P_basemap_wgs84/MapServer',
            maxZoom: 19,
            minZoom: 0,
            continuousWorld: true
        });

        _baseLayersService.luchtfoto = L.esri.tiledMapLayer({
            url: 'https://geodata.antwerpen.be/arcgissql/rest/services/P_Publiek/Luchtfoto_2015/MapServer',
            maxZoom: 19,
            minZoom: 0,
            continuousWorld: true
        });
        _baseLayersService.kaart.addTo(map);

        return _baseLayersService;
    };

    module.factory('BaseLayersService', baseLayersService);
})();
;'use strict';

(function () {

    try {
        var module = angular.module('tink.gis');
    } catch (e) {
        var module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi']); //'leaflet-directive'
    }
    var service = function service(MapData, map) {
        var _service = {};

        _service.StartDraw = function (DrawingOptie) {
            switch (MapData.DrawingType) {
                case DrawingOption.LIJN:
                case DrawingOption.AFSTAND:
                    MapData.DrawingObject = new L.Draw.Polyline(map);
                    MapData.DrawingObject.enable();
                    break;
                case DrawingOption.POLYGON:
                case DrawingOption.OPPERVLAKTE:
                    var polygon_options = {
                        showArea: true,
                        shapeOptions: {
                            stroke: true,
                            color: '#22528b',
                            weight: 4,
                            opacity: 0.6,
                            fill: true,
                            fillColor: null, //same as color by default
                            fillOpacity: 0.4,
                            clickable: true
                        }
                    };
                    MapData.DrawingObject = new L.Draw.Polygon(map, polygon_options);
                    MapData.DrawingObject.enable();
                    break;
                case DrawingOption.VIERKANT:
                    MapData.DrawingObject = new L.Draw.Rectangle(map);
                    MapData.DrawingObject.enable();
                    break;
                default:
                    break;
            }
        };
        return _service;
    };
    // module.$inject = ['MapData', 'map'];

    module.factory("DrawService", service);
})();
;'use strict';

var esri2geo = {};
(function () {
    function toGeoJSON(data, cb) {
        if (typeof data === 'string') {
            if (cb) {
                ajax(data, function (err, d) {
                    toGeoJSON(d, cb);
                });
                return;
            } else {
                throw new TypeError('callback needed for url');
            }
        }
        var outPut = { 'type': 'FeatureCollection', 'features': [] };
        var fl = data.geometries.length;
        var i = 0;
        while (fl > i) {
            var ft = data.geometries[i];
            /* as only ESRI based products care if all the features are the same type of geometry, check for geometry type at a feature level*/
            var outFT = {
                'type': 'Feature',
                'properties': prop(ft.attributes)
            };
            if (ft.x) {
                //check if it's a point
                outFT.geometry = point(ft);
            } else if (ft.points) {
                //check if it is a multipoint
                outFT.geometry = points(ft);
            } else if (ft.paths) {
                //check if a line (or 'ARC' in ESRI terms)
                outFT.geometry = line(ft);
            } else if (ft.rings) {
                //check if a poly.
                outFT.geometry = poly(ft);
            }
            outPut.features.push(outFT);
            i++;
        }
        return outPut;
        // cb(null, outPut);
    }
    function point(geometry) {
        //this one is easy
        return { 'type': 'Point', 'coordinates': [geometry.x, geometry.y] };
    }
    function points(geometry) {
        //checks if the multipoint only has one point, if so exports as point instead
        if (geometry.points.length === 1) {
            return { 'type': 'Point', 'coordinates': geometry.points[0] };
        } else {
            return { 'type': 'MultiPoint', 'coordinates': geometry.points };
        }
    }
    function line(geometry) {
        //checks if their are multiple paths or just one
        if (geometry.paths.length === 1) {
            return { 'type': 'LineString', 'coordinates': geometry.paths[0] };
        } else {
            return { 'type': 'MultiLineString', 'coordinates': geometry.paths };
        }
    }
    function poly(geometry) {
        //first we check for some easy cases, like if their is only one ring
        if (geometry.rings.length === 1) {
            return { 'type': 'Polygon', 'coordinates': geometry.rings };
        } else {
            /*if it isn't that easy then we have to start checking ring direction, basically the ring goes clockwise its part of the polygon,
            if it goes counterclockwise it is a hole in the polygon, but geojson does it by haveing an array with the first element be the polygons 
            and the next elements being holes in it*/
            return decodePolygon(geometry.rings);
        }
    }
    function decodePolygon(a) {
        //returns the feature
        var coords = [],
            type;
        var len = a.length;
        var i = 0;
        var len2 = coords.length - 1;
        while (len > i) {
            if (ringIsClockwise(a[i])) {
                coords.push([a[i]]);
                len2++;
            } else {
                coords[len2].push(a[i]);
            }
            i++;
        }
        if (coords.length === 1) {
            type = 'Polygon';
        } else {
            type = 'MultiPolygon';
        }
        return { 'type': type, 'coordinates': coords.length === 1 ? coords[0] : coords };
    }
    /*determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
    or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
    points-are-in-clockwise-order
    this code taken from http://esri.github.com/geojson-utils/src/jsonConverters.js by James Cardona (MIT lisense)
    */
    function ringIsClockwise(ringToTest) {
        var total = 0,
            i = 0,
            rLength = ringToTest.length,
            pt1 = ringToTest[i],
            pt2;
        for (i; i < rLength - 1; i++) {
            pt2 = ringToTest[i + 1];
            total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
            pt1 = pt2;
        }
        return total >= 0;
    }
    function prop(a) {
        var p = {};
        for (var k in a) {
            if (a[k]) {
                p[k] = a[k];
            }
        }
        return p;
    }

    function ajax(url, cb) {
        if (typeof module !== 'undefined') {
            var request = require('request');
            request(url, { json: true }, function (e, r, b) {
                cb(e, b);
            });
            return;
        }
        // the following is from JavaScript: The Definitive Guide
        var response;
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (req.readyState === 4 && req.status === 200) {
                cb(null, JSON.parse(req.responseText));
            }
        };
        req.open('GET', url);
        req.send();
    }
    if (typeof module !== 'undefined') {
        module.exports = toGeoJSON;
    } else {
        esri2geo.toGeoJSON = toGeoJSON;
    }
})();
;'use strict';

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'tink.modal']); //'leaflet-directive'
    }
    var externService = function externService(MapData, map, GISService, ThemeHelper, WMSService, ThemeService, $q) {
        var _externService = {};
        _externService.Export = function () {
            var exportObject = {};
            var arr = MapData.Themes.map(function (theme) {
                var returnitem = {};
                returnitem.Naam = theme.Naam;
                returnitem.CleanUrl = theme.CleanUrl;
                returnitem.Type = theme.Type;
                returnitem.Visible = theme.Visible;
                returnitem.Layers = theme.AllLayers.filter(function (x) {
                    return x.enabled == true;
                }).map(function (layer) {
                    var returnlayer = {};
                    // returnlayer.enabled = layer.enabled; // will always be true... since we only export the enabled layers
                    returnlayer.visible = layer.visible;
                    if (theme.Type == ThemeType.ESRI) {
                        returnlayer.name = layer.name;
                        returnlayer.id = layer.id;
                    } else {
                        returnlayer.name = layer.title;
                        returnlayer.id = layer.title;
                    }
                    return returnlayer;
                });
                return returnitem;
            });
            exportObject.Themes = arr;
            exportObject.Extent = map.getBounds();
            exportObject.IsKaart = true;

            return exportObject;
        };
        _externService.Import = function (project) {
            console.log(project);
            _externService.setExtent(project.extent);
            var themesArray = [];
            var promises = [];

            project.themes.forEach(function (theme) {
                if (theme.type == ThemeType.ESRI) {
                    var prom = GISService.GetThemeData(theme.cleanUrl);
                    promises.push(prom);
                    prom.success(function (data, statuscode, functie, getdata) {
                        themesArray.push(ThemeHelper.createThemeFromJson(data, getdata));
                    });
                } else {
                    // wms
                    var _prom = WMSService.GetCapabilities(theme.cleanUrl);
                    promises.push(_prom);
                    _prom.success(function (data, status, headers, config) {
                        themesArray.push(data);
                    }).error(function (data, status, headers, config) {
                        console.log('error!!!!!!!', data, status, headers, config);
                    });
                }
            });
            $q.all(promises).then(function () {
                var orderedArray = [];
                var errorMessages = [];
                project.themes.forEach(function (theme) {
                    var realTheme = themesArray.find(function (x) {
                        return x.CleanUrl == theme.cleanUrl;
                    });
                    realTheme.Visible = theme.visible;
                    console.log(theme, ' vs real theme: ', realTheme);
                    if (realTheme.AllLayers.length == theme.layers.length) {
                        realTheme.Added = true; //all are added
                    } else {
                        realTheme.Added = null; // some are added, never false because else we woudn't save it.
                    }
                    realTheme.AllLayers.forEach(function (layer) {
                        layer.enabled = false; // lets disable all layers first
                    });
                    //lets check what we need to enable and set visiblity of, and also check what we don't find
                    theme.layers.forEach(function (layer) {
                        var realLayer = realTheme.AllLayers.find(function (x) {
                            return x.title == layer.name;
                        });
                        if (realLayer) {
                            realLayer.visible = layer.visible; // aha so there was a layer, lets save this
                            realLayer.enabled = true;
                        } else {
                            errorMessages.push('"' + layer.name + '" not found in mapserver: ' + realTheme.Naam + '.');
                        }
                    });
                });
                project.themes.forEach(function (theme) {
                    // lets order them, since we get themesArray filled by async calls, the order can be wrong, thats why we make an ordered array
                    var realTheme = themesArray.find(function (x) {
                        return x.CleanUrl == theme.cleanUrl;
                    });
                    orderedArray.unshift(realTheme);
                });
                ThemeService.AddAndUpdateThemes(orderedArray);
                console.log('all loaded');
                if (errorMessages.length > 0) {
                    alert(errorMessages.join('\n'));
                }
            });
        };
        _externService.setExtent = function (extent) {

            map.fitBounds([[extent._northEast.lat, extent._northEast.lng], [extent._southWest.lat, extent._southWest.lng]]);
            // map.setZoom(map.getZoom() + 1);
        };
        _externService.CleanMapAndThemes = function () {
            MapData.CleanMap();
            ThemeService.CleanThemes();
        };

        return _externService;
    };
    module.$inject = ['MapData', 'map', 'GISService', 'ThemeHelper', 'WMSService', 'ThemeService', '$q'];
    module.factory('ExternService', externService);
})();
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter', 'tink.pagination']); //'leaflet-directive'
    }
    var service = function service() {
        var _service = {};
        proj4.defs('EPSG:31370', '+proj=lcc +lat_1=51.16666723333334 +lat_2=49.83333389999999 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438' + ' +ellps=intl +towgs84=-99.1,53.3,-112.5,0.419,-0.83,1.885,-1.0 +units=m +no_defs');
        // proj4.defs('EPSG:31370', '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1 +units=m +no_defs');
        _service.CreateProxyUrl = function (url) {
            var proxyurl = "https://stadinkaart-o.antwerpen.be/digipolis.stadinkaart.api/Proxy/go?url=" + encodeURIComponent(url);
            return proxyurl;
        };
        _service.UnwrapProxiedData = function (data) {
            if (typeof data == 'string' && data.startsWith('{"listOfString":')) {
                data = $.parseJSON(data).listOfString;
            } else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) == 'object' && data.listOfString) {
                data = data.listOfString;
            }
            if (typeof data == 'string' && data.startsWith('{')) {
                data = JSON.parse(data);
            }
            return data;
        };
        _service.ConvertWSG84ToLambert72 = function (coordinates) {
            var result = proj4('EPSG:31370', [coordinates.lng || coordinates.x, coordinates.lat || coordinates.y]);
            return {
                x: result[0],
                y: result[1]
            };
        };
        _service.ConvertLambert72ToWSG84 = function (coordinates) {
            var x = coordinates.lng || coordinates.x || coordinates[0];
            var y = coordinates.lat || coordinates.y || coordinates[1];
            var result = proj4('EPSG:31370', 'WGS84', [x, y]);
            return {
                y: result[0],
                x: result[1]
            };
        };
        var isCharDigit = function isCharDigit(n) {
            return n != ' ' && n > -1;
        };
        _service.getWGS84CordsFromString = function (search) {
            var returnobject = {};
            returnobject.hasCordinates = false;
            returnobject.error = null;
            returnobject.X = null;
            returnobject.Y = null;
            var currgetal = '';
            var samegetal = false;
            var aantalmetcorrectesize = 0;
            var hasaseperater = false;
            var getals = [];
            if ((search.contains('51.') || search.contains('51,')) && (search.contains('4.') || search.contains('4,'))) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = search[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var char = _step.value;

                        if (isCharDigit(char)) {
                            if (samegetal) {
                                currgetal = currgetal + char;
                            } else {
                                currgetal = '' + char;
                                samegetal = true;
                            }
                        } else {
                            if ((currgetal == '51' || currgetal == '4') && (char == '.' || char == ',') && hasaseperater == false) {
                                currgetal = currgetal + char;
                                aantalmetcorrectesize++;
                                hasaseperater = true;
                            } else {
                                if (currgetal != '') {
                                    getals.push(currgetal);
                                }
                                currgetal = '';
                                samegetal = false;
                                hasaseperater = false;
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                if (currgetal != '') {
                    getals.push(currgetal);
                }
            }
            if (aantalmetcorrectesize == 2 && getals.length == 2) {
                returnobject.X = getals[0].replace(',', '.');
                returnobject.Y = getals[1].replace(',', '.');
                returnobject.hasCordinates = true;
                return returnobject;
            } else {
                returnobject.error = 'Incorrect format: X,Y is required';
                return returnobject;
            }
        };
        _service.getLambartCordsFromString = function (search) {
            var returnobject = {};
            returnobject.hasCordinates = false;
            returnobject.error = null;
            returnobject.X = null;
            returnobject.Y = null;
            var getals = [];
            var currgetal = '';
            var samegetal = false;
            var aantalmet6size = 0;
            var hasaseperater = false;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = search[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var char = _step2.value;

                    if (isCharDigit(char)) {
                        if (samegetal) {
                            currgetal = currgetal + char;
                        } else {
                            currgetal = '' + char;
                            samegetal = true;
                        }
                    } else {
                        if (currgetal.length == 6) {
                            if (currgetal > 125000 && currgetal < 175000 || currgetal > 180000 && currgetal < 240000) {
                                aantalmet6size++;
                            } else {
                                returnobject.error = 'Out of bounds cordinaten voor Antwerpen.';
                                return returnobject;
                            }
                        }

                        if ((char == ',' || char == '.') && hasaseperater == false) {
                            hasaseperater = true;
                            currgetal = currgetal + char;
                        } else {
                            hasaseperater = false;
                            getals.push(currgetal);
                            currgetal = '';
                            samegetal = false;
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (currgetal != '') {
                if (currgetal.length == 6) {
                    aantalmet6size++;
                }
                getals.push(currgetal);
            }

            if (aantalmet6size == 2 && getals.length == 2) {
                returnobject.X = getals[0].replace(',', '.');
                returnobject.Y = getals[1].replace(',', '.');
                returnobject.hasCordinates = true;
                return returnobject;
            } else {
                returnobject.error = 'Incorrect format: Lat,Lng is required';
                return returnobject;
            }
        };

        return _service;
    };
    // module.$inject = ["$http", 'map'];
    module.factory('HelperService', service);
})();
;'use strict';

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', ['ui.sortable']]); //'leaflet-directive'
    }
    var layersService = function layersService() {
        var _layersService = {};
        return _layersService;
    };
    module.$inject = [];
    module.factory('LayersService', layersService);
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var mapData = function mapData(map, $rootScope, HelperService, ResultsData) {
        var _data = {};

        _data.VisibleLayers = [];
        _data.SelectableLayers = [];
        _data.VisibleFeatures = [];
        _data.Loading = 0;
        _data.IsDrawing = false;
        _data.ThemeUrls = ['http://app11.p.gis.local/arcgissql/rest/services/P_Stad/Afval/MapServer/', 'http://app11.p.gis.local/arcgissql/rest/services/P_Stad/Cultuur/MapServer/', 'http://app11.p.gis.local/arcgissql/rest/services/P_Stad/Jeugd/MapServer/', 'http://app11.p.gis.local/arcgissql/rest/services/P_Stad/Onderwijs/MapServer/', 'http://app11.p.gis.local/arcgissql/rest/services/P_Stad/stad/MapServer/'];
        _data.Themes = [];
        _data.defaultlayer = { id: '', name: 'Alle Layers' };
        _data.SelectedLayer = _data.defaultlayer;
        _data.VisibleLayers.unshift(_data.defaultlayer);
        _data.ActiveInteractieKnop = ActiveInteractieButton.IDENTIFY;
        _data.DrawingType = DrawingOption.NIETS;
        _data.DrawingObject = null;
        _data.LastIdentifyBounds = null;
        _data.CleanDrawings = function () {
            if (_data.DrawingObject) {
                if (_data.DrawingObject.layer) {
                    // if the layer (drawing) is created
                    _data.DrawingObject.layer._popup = null; // remove popup first because else it will fire close event which will do an other clean of the drawings which is not needed
                }
                _data.DrawingObject.disable();
                _data.DrawingObject = null;
                map.clearDrawings();
            }
        };
        var WatIsHierMarker = null;
        var WatIsHierOriginalMarker = null;
        _data.CleanMap = function () {
            _data.CleanDrawings();
            _data.CleanWatIsHier();
            _data.CleanSearch();
            _data.ClearBuffer();
        };
        _data.bufferLaag = null;
        _data.CreateBuffer = function (gisBufferData) {
            var esrigj = esri2geo.toGeoJSON(gisBufferData);
            var gj = new L.GeoJSON(esrigj, { style: Style.BUFFER });
            _data.bufferLaag = gj.addTo(map);
            map.fitBounds(_data.bufferLaag.getBounds());
            return _data.bufferLaag;
        };
        _data.ClearBuffer = function () {
            if (_data.bufferLaag) {
                map.removeLayer(_data.bufferLaag);
                _data.bufferLaag = null;
            }
        };
        _data.GetZoomLevel = function () {
            return map.getZoom();
        };
        _data.GetScale = function () {
            return Scales[_data.GetZoomLevel()];
        };
        _data.CleanWatIsHier = function () {
            if (WatIsHierOriginalMarker) {
                WatIsHierOriginalMarker.clearAllEventListeners();
                WatIsHierOriginalMarker.closePopup();
                map.removeLayer(WatIsHierOriginalMarker);
                WatIsHierOriginalMarker = null;
            }
            if (WatIsHierMarker) {
                map.removeLayer(WatIsHierMarker);
                WatIsHierMarker = null;
            }
            straatNaam = null;
        };
        _data.UpdateDisplayed = function (Themes) {
            var currentScale = _data.GetScale();
            _data.Themes.forEach(function (theme) {
                if (theme.Type == ThemeType.ESRI) {
                    theme.UpdateDisplayed(currentScale);
                }
            });
        };
        _data.Apply = function () {
            console.log('apply');
            if (!$rootScope.$$phase) {
                //$digest or $apply
                $rootScope.$apply();
            } else {
                console.log('apply NOT needed');
            }
        };
        _data.CreateOrigineleMarker = function (latlng, addressFound) {
            if (addressFound) {
                var foundMarker = L.AwesomeMarkers.icon({
                    icon: 'fa-map-marker',
                    markerColor: 'orange'

                });
                WatIsHierOriginalMarker = L.marker([latlng.lat, latlng.lng], { icon: foundMarker, opacity: 0.5 }).addTo(map);
            } else {
                var notFoundMarker = L.AwesomeMarkers.icon({
                    // icon: 'fa-frown-o',
                    icon: 'fa-question',
                    markerColor: 'red',
                    spin: true
                });
                WatIsHierOriginalMarker = L.marker([latlng.lat, latlng.lng], { icon: notFoundMarker }).addTo(map);
            }
            var convertedxy = HelperService.ConvertWSG84ToLambert72(latlng);
            if (straatNaam) {
                var html = '<div class="container container-low-padding">' + '<div class="row row-no-padding">' + '<div class="col-sm-4">' + '<a href="templates/external/streetView.html?lat=' + latlng.lat + '&lng=' + latlng.lng + '" + target="_blank" >' + '<img src="https://maps.googleapis.com/maps/api/streetview?size=100x50&location=' + latlng.lat + ',' + latlng.lng + '&pitch=-0.76" />' + '</a>' + '</div>' + '<div class="col-sm-8">' + '<div class="col-sm-12"><b>' + straatNaam + '</b></div>' + '<div class="col-sm-3">WGS84:</div><div class="col-sm-8" style="text-align: left;">' + latlng.lat.toFixed(6) + ', ' + latlng.lng.toFixed(6) + '</div><div class="col-sm-1"><i class="fa fa-files-o"></i></div>' + '<div class="col-sm-3">Lambert:</div><div class="col-sm-8" style="text-align: left;">' + convertedxy.x.toFixed(1) + ', ' + convertedxy.y.toFixed(1) + '</div><div class="col-sm-1"><i class="fa fa-files-o"></i></div>' + '</div>' + '</div>' + '</div>';
                WatIsHierOriginalMarker.bindPopup(html, { minWidth: 300 }).openPopup();
            } else {
                var html = '<div class="container container-low-padding">' + '<div class="row row-no-padding">' + '<div class="col-sm-3">WGS84:</div><div class="col-sm-8" style="text-align: left;">' + latlng.lat.toFixed(6) + ', ' + latlng.lng.toFixed(6) + '</div><div class="col-sm-1"><i class="fa fa-files-o"></i></div>' + '<div class="col-sm-3">Lambert:</div><div class="col-sm-8" style="text-align: left;">' + convertedxy.x.toFixed(1) + ', ' + convertedxy.y.toFixed(1) + '</div><div class="col-sm-1"><i class="fa fa-files-o"></i></div>' + '</div>' + '</div>';
                WatIsHierOriginalMarker.bindPopup(html, { minWidth: 200 }).openPopup();
            }
        };
        var straatNaam = null;
        _data.CreateWatIsHierMarker = function (data) {
            var convertedBackToWSG84 = HelperService.ConvertLambert72ToWSG84(data.location);
            straatNaam = data.address.Street + ' (' + data.address.Postal + ')';
            var greenIcon = L.icon({
                iconUrl: 'styles/fa-dot-circle-o_24_0_000000_none.png',
                iconSize: [24, 24]
            });

            WatIsHierMarker = L.marker([convertedBackToWSG84.x, convertedBackToWSG84.y], { icon: greenIcon }).addTo(map);
        };
        _data.CleanSearch = function () {
            ResultsData.CleanSearch();
            for (var x = 0; x < _data.VisibleFeatures.length; x++) {
                map.removeLayer(_data.VisibleFeatures[x]); //eerst de
            }
            _data.VisibleFeatures.length = 0;
        };
        _data.PanToFeature = function (feature) {
            // var tmplayer = feature.mapItem._layers[Object.keys(feature.mapItem._layers)[0]]
            var featureBounds = feature.getBounds();
            map.fitBounds(featureBounds);
        };
        _data.GoToLastClickBounds = function () {
            map.fitBounds(_data.LastIdentifyBounds, { paddingTopLeft: L.point(0, 0), paddingBottomRight: L.point(0, 0) });
            // map.setZoom(map.getZoom() + 1);
        };
        _data.SetZIndexes = function () {
            var counter = _data.Themes.length + 3;
            _data.Themes.forEach(function (theme) {
                theme.MapData.ZIndex = counter;
                if (theme.Type == ThemeType.ESRI) {
                    if (theme.MapData._currentImage) {
                        theme.MapData._currentImage._image.style.zIndex = counter;
                    }
                } else {
                    // WMS
                    theme.MapData.bringToFront();
                    theme.MapData.setZIndex(counter);
                }
                counter--;
            });
        };
        _data.AddFeatures = function (features, theme, layerId) {
            if (features == null || features.features.length == 0) {
                ResultsData.EmptyResult = true;
            } else {
                ResultsData.EmptyResult = false;
                for (var x = 0; x < features.features.length; x++) {
                    var featureItem = features.features[x];

                    var layer = {};
                    if (featureItem.layerId != undefined && featureItem.layerId != null) {
                        layer = theme.AllLayers.find(function (x) {
                            return x.id === featureItem.layerId;
                        });
                    } else if (layerId != undefined && layerId != null) {
                        layer = theme.AllLayers.find(function (x) {
                            return x.id === layerId;
                        });
                    } else {
                        console.log('NO LAYER ID WAS GIVEN EITHER FROM FEATURE ITEM OR FROM PARAMETER');
                    }
                    // featureItem.layer = layer;
                    featureItem.theme = theme;
                    featureItem.layerName = layer.name;
                    if (theme.Type === ThemeType.ESRI) {
                        layer.fields.forEach(function (field) {
                            if (field.type == 'esriFieldTypeDate') {
                                var date = new Date(featureItem.properties[field.name]);
                                var date_string = date.getDate() + 1 + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(); // "2013-9-23"
                                featureItem.properties[field.name] = date_string;
                            }
                        });
                        featureItem.displayValue = featureItem.properties[layer.displayField];
                        if (!featureItem.displayValue) {
                            var displayFieldProperties = layer.fields.find(function (x) {
                                return x.name == layer.displayField;
                            });
                            if (displayFieldProperties) {
                                featureItem.displayValue = featureItem.properties[displayFieldProperties.alias];
                            } else {
                                featureItem.displayValue = 'LEEG';
                            }
                        }
                        var mapItem = L.geoJson(featureItem, { style: Style.DEFAULT }).addTo(map);
                        _data.VisibleFeatures.push(mapItem);
                        featureItem.mapItem = mapItem;
                    } else {
                        featureItem.displayValue = featureItem.properties[Object.keys(featureItem.properties)[0]];
                    }
                    ResultsData.JsonFeatures.push(featureItem);
                }
                $rootScope.$apply();
            }
        };
        return _data;
    };
    module.$inject = ['ResultsData'];
    module.factory('MapData', mapData);
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var mapEvents = function mapEvents(map, MapService, MapData) {
        var _mapEvents = {};
        map.on('draw:drawstart', function (event) {
            console.log('draw started');
            MapData.IsDrawing = true;
            // MapData.CleanDrawings();
        });

        map.on('draw:drawstop', function (event) {
            console.log('draw stopped');
            MapData.IsDrawing = false;
            // MapData.CleanDrawings();
        });

        var berkenOmtrek = function berkenOmtrek(layer) {
            // Calculating the distance of the polyline
            var tempLatLng = null;
            var totalDistance = 0.00000;
            _.each(layer._latlngs, function (latlng) {
                if (tempLatLng == null) {
                    tempLatLng = latlng;
                    return;
                }
                totalDistance += tempLatLng.distanceTo(latlng);
                tempLatLng = latlng;
            });
            return totalDistance.toFixed(2);
        };

        map.on('zoomend', function (event) {
            console.log('Zoomend!!!');
            MapData.UpdateDisplayed();
            MapData.Apply();
        });

        map.on('click', function (event) {
            if (event.originalEvent instanceof MouseEvent) {
                console.log('click op map! Is drawing: ' + MapData.IsDrawing);
                if (!MapData.IsDrawing) {
                    MapData.CleanMap();
                    switch (MapData.ActiveInteractieKnop) {
                        case ActiveInteractieButton.IDENTIFY:
                            MapData.LastIdentifyBounds = map.getBounds();
                            MapService.Identify(event, 10);
                            break;
                        case ActiveInteractieButton.SELECT:
                            if (MapData.DrawingType === DrawingOption.NIETS) {
                                MapService.Select(event);
                            } // else a drawing finished
                            break;
                        case ActiveInteractieButton.WATISHIER:
                            MapService.WatIsHier(event);
                            break;
                        case ActiveInteractieButton.METEN:

                            break;
                        default:
                            console.log('MAG NIET!!!!!!!!');
                            break;
                    }
                } else {
                    // MapData.DrawingObject = event;
                    console.log("DrawingObject: ");
                    console.log(MapData.DrawingObject);
                    switch (MapData.DrawingType) {
                        case DrawingOption.AFSTAND:
                            break;
                        case DrawingOption.OPPERVLAKTE:
                            break;
                        default:
                            console.log("Aant drawen zonder een gekent type!!!!!!");
                            break;
                    }
                }
            }
        });

        map.on('draw:created', function (e) {
            console.log('draw created');
            switch (MapData.ActiveInteractieKnop) {
                case ActiveInteractieButton.SELECT:
                    switch (MapData.DrawingType) {
                        case DrawingOption.LIJN:
                            break;
                        case DrawingOption.VIERKANT:
                            break;
                        case DrawingOption.POLYGON:
                            break;
                        default:
                            break;
                    }
                    MapService.Query(e.layer);
                    break;
                case ActiveInteractieButton.METEN:
                    switch (MapData.DrawingType) {
                        case DrawingOption.AFSTAND:
                            var omtrek = berkenOmtrek(e.layer);
                            var popup = e.layer.bindPopup('Afstand (m): ' + omtrek + ' ');
                            popup.on('popupclose', function (event) {
                                MapData.CleanMap();
                            });
                            e.layer.openPopup();
                            break;
                        case DrawingOption.OPPERVLAKTE:
                            var omtrek = berkenOmtrek(e.layer);
                            var popuptekst = '<p>Opp  (m<sup>2</sup>): ' + LGeo.area(e.layer).toFixed(2) + '</p>' + '<p>Omtrek (m): ' + omtrek + ' </p>';
                            var popup = e.layer.bindPopup(popuptekst);
                            popup.on('popupclose', function (event) {
                                MapData.CleanMap();
                            });
                            e.layer.openPopup();
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    console.log('MAG NIET!!!!!!!!');
                    break;
            }
            MapData.IsDrawing = false;
        });

        return _mapEvents;
    };
    module.factory('MapEvents', mapEvents);
})();
;'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'tink.modal']); //'leaflet-directive'
    }
    var mapService = function mapService($rootScope, MapData, map, ThemeHelper, $q, GISService, ResultsData, HelperService) {
        var _mapService = {};
        _mapService.Identify = function (event, tolerance) {
            if (typeof tolerance === 'undefined') {
                tolerance = 10;
            }
            _.each(MapData.Themes, function (theme) {
                theme.RecalculateVisibleLayerIds();
                var identifOnThisTheme = true;
                if (theme.VisibleLayerIds.length === 1 && theme.VisibleLayerIds[0] === -1) {
                    identifOnThisTheme = false; // we moeten de layer niet qryen wnnr er geen vis layers zijn
                }
                if (identifOnThisTheme) {
                    switch (theme.Type) {
                        case ThemeType.ESRI:
                            var layersVoorIdentify = 'visible: ' + theme.VisibleLayerIds;
                            ResultsData.Loading++;
                            theme.MapData.identify().on(map).at(event.latlng).layers(layersVoorIdentify).tolerance(tolerance).run(function (error, featureCollection) {
                                ResultsData.Loading--;
                                MapData.AddFeatures(featureCollection, theme);
                            });
                            break;
                        case ThemeType.WMS:
                            var layersVoorIdentify = theme.VisibleLayerIds;
                            theme.VisibleLayers.forEach(function (lay) {
                                console.log(lay);
                                if (lay.queryable == true) {

                                    ResultsData.Loading++;
                                    theme.MapData.getFeatureInfo(event.latlng, lay.name).success(function (data, status, xhr) {
                                        data = HelperService.UnwrapProxiedData(data);
                                        ResultsData.Loading--;
                                        console.log('minus');
                                        // data = data.replace('<?xml version="1.0" encoding="UTF-8"?>', '').trim();
                                        // var xmlstring = JXON.xmlToString(data);
                                        var returnjson = JXON.stringToJs(data);
                                        var processedjson = null;
                                        if (returnjson.featureinforesponse) {
                                            processedjson = returnjson.featureinforesponse.fields;
                                        }
                                        var returnitem = {
                                            type: 'FeatureCollection',
                                            features: []
                                        };
                                        if (processedjson) {
                                            var featureArr = [];
                                            if ((typeof processedjson === 'undefined' ? 'undefined' : _typeof(processedjson)) === 'object') {
                                                featureArr.push(processedjson);
                                            } else {
                                                featureArr = processedjson;
                                            }

                                            featureArr.forEach(function (feat) {
                                                var tmpitem = {
                                                    layerName: lay.name,
                                                    name: lay.name,
                                                    layerId: lay.name,
                                                    properties: feat,
                                                    type: 'Feature'
                                                };
                                                returnitem.features.push(tmpitem);
                                            });
                                            console.log(lay.name + ' item info: ');
                                            console.log(returnitem);
                                            MapData.AddFeatures(returnitem, theme);
                                        } else {
                                            // we must still apply for the loading to get updated
                                            $rootScope.$apply();
                                        }
                                    });
                                }
                            });
                            break;
                        default:
                            console.log('UNKNOW TYPE!!!!:');
                            console.log(Theme.Type);
                            break;
                    }
                }
            });
        };

        _mapService.Select = function (event) {
            console.log(event);
            if (MapData.SelectedLayer.id == '') {
                // alle layers selected
                MapData.Themes.filter(function (x) {
                    return x.Type == ThemeType.ESRI;
                }).forEach(function (theme) {
                    // dus doen we de qry op alle lagen.
                    ResultsData.Loading++;
                    theme.MapData.identify().on(map).at(event.latlng).layers('visible: ' + theme.VisibleLayerIds).run(function (error, featureCollection) {
                        ResultsData.Loading--;
                        MapData.AddFeatures(featureCollection, theme);
                    });
                });
            } else {
                ResultsData.Loading++;
                MapData.SelectedLayer.theme.MapData.identify().on(map).at(event.latlng).layers('visible: ' + MapData.SelectedLayer.id).run(function (error, featureCollection) {
                    ResultsData.Loading--;
                    MapData.AddFeatures(featureCollection, MapData.SelectedLayer.theme);
                });
            }
        };
        _mapService.WatIsHier = function (event) {
            var prom = GISService.ReverseGeocode(event);
            prom.success(function (data, status, headers, config) {
                if (!data.error) {
                    MapData.CreateWatIsHierMarker(data);
                    MapData.CreateOrigineleMarker(event.latlng, true);
                } else {
                    MapData.CreateOrigineleMarker(event.latlng, false);
                }
            }).error(function (data, status, headers, config) {
                console.log(data, status, headers, config);
            });
        };

        _mapService.Query = function (box, layer) {
            if (!layer) {
                layer = MapData.SelectedLayer;
            }
            if (layer.id == '') {
                // alle layers selected
                MapData.Themes.forEach(function (theme) {
                    // dus doen we de qry op alle lagen.
                    if (theme.Type === ThemeType.ESRI) {
                        theme.VisibleLayers.forEach(function (lay) {
                            ResultsData.Loading++;
                            theme.MapData.query().layer(lay.id).intersects(box).run(function (error, featureCollection, response) {
                                ResultsData.Loading--;
                                MapData.AddFeatures(featureCollection, theme, lay.id);
                            });
                        });
                    }
                });
            } else {
                ResultsData.Loading++;
                layer.theme.MapData.query().layer(layer.id).intersects(box).run(function (error, featureCollection, response) {
                    ResultsData.Loading--;
                    MapData.AddFeatures(featureCollection, layer.theme, layer.id);
                });
            }
        };

        _mapService.Find = function (query) {
            if (MapData.SelectedLayer.id == '') {
                // alle layers selected
                MapData.Themes.forEach(function (theme) {
                    // dus doen we de qry op alle lagen.
                    if (theme.Type === ThemeType.ESRI) {
                        theme.VisibleLayers.forEach(function (lay) {
                            ResultsData.Loading++;
                            theme.MapData.find().fields(lay.displayField).layers(lay.id).text(query).run(function (error, featureCollection, response) {
                                ResultsData.Loading--;
                                MapData.AddFeatures(featureCollection, theme, lay.id);
                            });
                        });
                    }
                });
            } else {
                ResultsData.Loading++;
                MapData.SelectedLayer.theme.MapData.find().fields(MapData.SelectedLayer.displayField).layers(MapData.SelectedLayer.id).text(query).run(function (error, featureCollection, response) {
                    ResultsData.Loading--;
                    MapData.AddFeatures(featureCollection, MapData.SelectedLayer.theme, MapData.SelectedLayer.id);
                });
            }
        };
        _mapService.UpdateThemeStatus = function (theme) {
            _.each(theme.Groups, function (layerGroup) {
                _mapService.UpdateGroupLayerStatus(layerGroup, theme);
            });
            _.each(theme.Layers, function (layer) {
                _mapService.UpdateLayerStatus(layer, theme);
            });
        };
        _mapService.UpdateGroupLayerStatus = function (groupLayer, theme) {
            _.each(groupLayer.Layers, function (childlayer) {
                _mapService.UpdateLayerStatus(childlayer, theme);
            });
        };

        _mapService.UpdateLayerStatus = function (layer, theme) {
            var visibleOnMap = theme.Visible && layer.visible && (layer.parent && layer.parent.visible || !layer.parent);
            var indexOfLayerInVisibleLayers = theme.VisibleLayers.indexOf(layer);
            if (visibleOnMap) {
                if (indexOfLayerInVisibleLayers === -1 && layer.enabled) {
                    // alleen maar toevoegen wnnr layer enabled en niet aanwezig al in de array!
                    theme.VisibleLayers.push(layer);
                    if (theme.Type == ThemeType.ESRI) {
                        MapData.VisibleLayers.push(layer);
                    }
                }
            } else {
                if (indexOfLayerInVisibleLayers > -1) {
                    theme.VisibleLayers.splice(indexOfLayerInVisibleLayers, 1);
                    if (theme.Type == ThemeType.ESRI) {
                        var indexOfLayerInVisibleLayersOfMap = MapData.VisibleLayers.indexOf(layer);
                        MapData.VisibleLayers.splice(indexOfLayerInVisibleLayersOfMap, 1);
                    }
                }
            }
        };
        return _mapService;
    };
    module.$inject = ['$rootScope', 'MapData', 'map', 'ThemeHelper', '$q', 'GISService', 'ResultsData', 'HelperService'];
    module.factory('MapService', mapService);
})();
;'use strict';

(function () {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi']); //'leaflet-directive'
    }
    var service = function service() {
        var themeHelper = {};
        themeHelper.createThemeFromJson = function (rawdata, themeData) {
            var thema = {};
            try {
                var rawlayers = rawdata.layers;
                thema.Naam = rawdata.documentInfo.Title;
                thema.name = rawdata.documentInfo.Title;
                thema.Description = rawdata.documentInfo.Subject;
                thema.Layers = []; // de layers direct onder het theme zonder sublayers
                thema.AllLayers = []; // alle Layers die hij heeft including subgrouplayers
                thema.Groups = []; // layergroups die nog eens layers zelf hebben
                thema.CleanUrl = themeData.cleanUrl;
                thema.Url = themeData.url;
                thema.VisibleLayers = [];
                thema.VisibleLayerIds = [];
                thema.Visible = true;
                thema.Added = false;
                thema.enabled = true;
                thema.Type = ThemeType.ESRI;
                thema.status = ThemeStatus.NEW;
                thema.MapData = {};
                _.each(rawlayers, function (x) {
                    x.visible = x.defaultVisibility;
                    x.enabled = true;
                    x.parent = null;
                    x.title = x.name;
                    x.theme = thema;
                    x.displayed = true;
                    x.UpdateDisplayed = function (currentScale) {
                        if (x.maxScale > 0 || x.minScale > 0) {
                            console.log('MinMaxandCurrentScale', x.maxScale, x.minScale, currentScale);
                            if (currentScale > x.maxScale && currentScale < x.minScale) {
                                x.displayed = true;
                            } else {
                                x.displayed = false;
                            }
                        }
                    };
                    x.type = LayerType.LAYER;
                    thema.AllLayers.push(x);
                    if (x.parentLayerId === -1) {
                        if (x.subLayerIds === null) {
                            thema.Layers.push(x);
                        } else {
                            thema.Groups.push(x);
                            x.type = LayerType.GROUP;
                        }
                    }
                });
                _.each(thema.Groups, function (layerGroup) {
                    if (layerGroup.subLayerIds !== null) {
                        layerGroup.Layers = [];
                        _.each(rawlayers, function (rawlayer) {
                            if (layerGroup.id === rawlayer.parentLayerId) {
                                rawlayer.parent = layerGroup;
                                layerGroup.Layers.push(rawlayer);
                            }
                        });
                    }
                });
                thema.UpdateDisplayed = function (currentScale) {
                    thema.AllLayers.forEach(function (layer) {
                        layer.UpdateDisplayed(currentScale);
                    });
                };
                thema.UpdateMap = function () {
                    thema.RecalculateVisibleLayerIds();
                    thema.MapData.setLayers(thema.VisibleLayerIds);
                };

                thema.RecalculateVisibleLayerIds = function () {
                    thema.VisibleLayerIds.length = 0;
                    thema.VisibleLayers.forEach(function (visLayer) {
                        thema.VisibleLayerIds.push(visLayer.id);
                    });
                    if (thema.VisibleLayerIds.length === 0) {
                        thema.VisibleLayerIds.push(-1); //als we niet doen dan zoekt hij op alle lagen!
                    }
                };
                thema.RecalculateVisibleLayerIds();
            } catch (ex) {
                console.log('Error when creating theme from url: ' + themeData.url + ' Exeption: ' + ex + ' Data: ');
                console.log(rawdata);
            }
            return thema;
        };
        return themeHelper;
    };
    module.$inject = ['map'];
    module.factory('ThemeHelper', service);
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service(map, ThemeHelper, MapData, LayerManagementService) {
        var _service = {};
        _service.AddAndUpdateThemes = function (themesBatch) {
            console.log('Themes batch for add and updates...');
            console.log(themesBatch);
            themesBatch.forEach(function (theme) {
                var existingTheme = MapData.Themes.find(function (x) {
                    return x.CleanUrl == theme.CleanUrl;
                });
                console.log('addorupdate or del theme, ', theme, theme.status);
                switch (theme.status) {
                    case ThemeStatus.NEW:
                        if (theme.Type == ThemeType.ESRI) {
                            LayerManagementService.GetAditionalLayerInfo(theme);
                            theme.UpdateDisplayed(MapData.GetScale());
                        }
                        _service.AddNewTheme(theme);
                        break;
                    case ThemeStatus.DELETED:
                        _service.DeleteTheme(existingTheme);
                        break;
                    case ThemeStatus.UNMODIFIED:
                        // niets doen niets veranderd!
                        break;
                    case ThemeStatus.UPDATED:
                        _service.UpdateTheme(theme, existingTheme);
                        _service.UpdateThemeVisibleLayers(existingTheme);
                        break;
                    default:
                        console.log('Er is iets fout, status niet bekend!!!: ' + theme.status);
                        break;
                }
                //Theme is proccessed, now make it unmodified again
                theme.status = ThemeStatus.UNMODIFIED;
            });
            console.log('refresh of sortableThemes');
            $('#sortableThemes').sortable('refresh');

            MapData.SetZIndexes();
        };
        _service.UpdateThemeVisibleLayers = function (theme) {
            theme.UpdateMap();
        };
        _service.UpdateTheme = function (updatedTheme, existingTheme) {
            //lets update the existingTheme
            for (var x = 0; x < updatedTheme.AllLayers.length; x++) {
                var updatedLayer = updatedTheme.AllLayers[x];
                var existingLayer = existingTheme.AllLayers[x];

                //laten we alle Visible Layers nu terug toevoegen meteen juiste ref etc uit de geupdate theme.
                if (updatedLayer.enabled && updatedLayer.visible) {
                    //eerst checken dat ze nog niet bestaan!.
                    if (existingTheme.Type == ThemeType.ESRI && MapData.VisibleLayers.indexOf(existingLayer) == -1) {
                        MapData.VisibleLayers.push(existingLayer);
                    }
                    if (existingTheme.VisibleLayers.indexOf(existingLayer) == -1) {
                        existingTheme.VisibleLayers.push(existingLayer);
                    }
                } else {
                    //Anders halen we hem ook moest hij bij VisLayers aanwezig zijn er van af!
                    if (existingTheme.Type == ThemeType.ESRI && MapData.VisibleLayers.indexOf(existingLayer) != -1) {
                        MapData.VisibleLayers.splice(MapData.VisibleLayers.indexOf(existingLayer), 1);
                    }
                    if (existingTheme.VisibleLayers.indexOf(existingLayer) != -1) {
                        existingTheme.VisibleLayers.splice(existingTheme.VisibleLayers.indexOf(existingLayer), 1);
                    }
                }
                existingLayer.enabled = updatedLayer.enabled;
                existingLayer.visible = updatedLayer.visible;
            }
            existingTheme.RecalculateVisibleLayerIds();
        };
        _service.AddNewTheme = function (theme) {
            MapData.Themes.unshift(theme);
            console.log('Adding THEME!!!', theme);
            _.each(theme.AllLayers, function (layer) {
                if (layer.enabled && layer.visible && layer.type === LayerType.LAYER && theme.Visible && (layer.parent == null || layer.parent == undefined || layer.parent.visible == true)) {
                    console.log("LAYERINFO: ", layer);
                    theme.VisibleLayers.push(layer);
                    if (theme.Type == ThemeType.ESRI) {
                        MapData.VisibleLayers.push(layer);
                    }
                }
            });
            theme.RecalculateVisibleLayerIds();

            switch (theme.Type) {
                case ThemeType.ESRI:
                    theme.MapData = L.esri.dynamicMapLayer({
                        maxZoom: 19,
                        minZoom: 0,
                        url: theme.CleanUrl,
                        opacity: 1,
                        layers: theme.VisibleLayerIds,
                        continuousWorld: true,
                        useCors: true
                    }).addTo(map);

                    theme.MapData.on('load', function (e) {
                        // console.log(MapData.Zindex);
                        // console.log('Load Fired for ' + theme.Naam);
                        if (theme.MapData._currentImage) {
                            theme.MapData._currentImage._image.style.zIndex = theme.MapData.ZIndex;
                            console.log('Zindex on ' + theme.Naam + ' set to ' + theme.MapData.ZIndex);
                        }
                    });
                    // theme.MapData.on('loading', function(e) {
                    //     console.log('loading ' + theme.Naam);
                    // });
                    // theme.MapData.on('requeststart', function(obj) {
                    //     MapData.Loading++;
                    //     console.log(MapData.Loading + 'requeststart ' + theme.Naam);
                    //     $rootScope.$apply();

                    // });
                    // theme.MapData.on('requestend', function(obj) {
                    //     if (MapData.Loading > 0) {
                    //         MapData.Loading--;
                    //     }
                    //     console.log(MapData.Loading + 'requestend ' + theme.Naam);
                    //     $rootScope.$apply();

                    // });
                    break;
                case ThemeType.WMS:
                    theme.MapData = L.tileLayer.betterWms(theme.CleanUrl, {
                        maxZoom: 19,
                        minZoom: 0,
                        format: 'image/png',
                        layers: theme.VisibleLayerIds,
                        transparent: true,
                        continuousWorld: true,
                        useCors: true
                    }).addTo(map);
                    // theme.MapData.on('tileloadstart', function(obj) {
                    //     MapData.Loading++;
                    //     console.log(MapData.Loading + 'tileloadstart ' + theme.Naam);
                    //     $rootScope.$apply();

                    // });
                    // theme.MapData.on('tileerror', function(obj) {
                    //     // if (MapData.Loading > 0) {
                    //         MapData.Loading--;
                    //     // }
                    //     console.log('!!!!!!!!! ' + MapData.Loading + 'tileerror ' + theme.Naam);
                    //     $rootScope.$apply();

                    // });
                    // theme.MapData.on('tileload', function(obj) {
                    //     // if (MapData.Loading > 0) {
                    //         MapData.Loading--;
                    //     // }
                    //     console.log(MapData.Loading + 'tileload ' + theme.Naam);
                    //     $rootScope.$apply();

                    // });
                    theme.MapData.on('load', function (e) {
                        console.log('LOAD VAN ' + theme.Naam);
                        console.log(theme.MapData);
                        if (theme.MapData._container.childNodes) {
                            [].slice.call(theme.MapData._container.childNodes).forEach(function (imgNode) {
                                imgNode.style.zIndex = theme.MapData.ZIndex;
                            });
                            // theme.MapData._currentImage._image.style.zIndex = theme.MapData.ZIndex;
                            console.log('Zindex on ' + theme.Naam + ' set to ' + theme.MapData.ZIndex);
                        }
                    });
                    break;
                default:
                    console.log('UNKNOW TYPE');
                    break;
            }

            // _mapService.UpdateThemeVisibleLayers(theme);
        };
        _service.CleanThemes = function () {
            while (MapData.Themes.length != 0) {
                console.log('DELETING THIS THEME', MapData.Themes[0]);
                _service.DeleteTheme(MapData.Themes[0]);
            }
            // MapData.Themes.length = 0;
            // MapData.VisibleLayers.length = 0;
            // MapData.VisibleLayers.unshift(MapData.defaultlayer);
        };

        _service.DeleteTheme = function (theme) {
            // theme.MapData.removeFrom(map);
            map.removeLayer(theme.MapData); // this one works with ESRI And leaflet
            var themeIndex = MapData.Themes.indexOf(theme);
            if (themeIndex > -1) {
                MapData.Themes.splice(themeIndex, 1);
            }
            theme.VisibleLayers.forEach(function (visLayer) {
                var visLayerIndex = MapData.VisibleLayers.indexOf(visLayer);
                if (visLayerIndex > -1) {
                    MapData.VisibleLayers.splice(visLayerIndex, 1);
                }
            });
            MapData.CleanSearch();
        };

        return _service;
    };
    module.$inject = ['map', 'ThemeHelper', 'MapData', 'LayerManagementService'];
    module.factory('ThemeService', service);
})();
;'use strict';

(function (module) {
    var module;
    try {
        module = angular.module('tink.gis');
    } catch (e) {
        module = angular.module('tink.gis', ['tink.accordion', 'tink.tinkApi', 'ui.sortable', 'tink.modal', 'angular.filter']); //'leaflet-directive'
    }
    module.controller('BufferController', ['$scope', '$modalInstance', 'MapData', function ($scope, $modalInstance, MapData) {
        var vm = this;
        $scope.buffer = 100;
        $scope.SelectableLayers = angular.copy(MapData.VisibleLayers);
        $scope.SelectableLayers.shift();
        $scope.selectedLayer = $scope.SelectableLayers[0];
        $scope.ok = function () {
            $modalInstance.$close($scope.buffer, $scope.selectedLayer); // return the themes.
        };
        $scope.cancel = function () {
            $modalInstance.$dismiss('cancel is pressed'); // To close the controller with a dismiss message
        };
    }]);
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    var theController = module.controller('searchController', function ($scope, ResultsData, map) {
        var vm = this;
        vm.features = ResultsData.JsonFeatures;
        vm.EmptyResult = ResultsData.EmptyResult;
        vm.Loading = ResultsData.Loading;
        vm.MaxLoading = 0;
        $scope.$watch(function () {
            return ResultsData.Loading;
        }, function (newVal, oldVal) {
            vm.Loading = newVal;
            if (oldVal == 0) {
                vm.MaxLoading = newVal;
            }
            if (newVal < oldVal) {
                if (vm.MaxLoading < oldVal) {
                    vm.MaxLoading = oldVal;
                }
            }
            if (newVal == 0) {
                vm.MaxLoading = 0;
            }
            console.log("Loading val: " + newVal + "/" + vm.MaxLoading);
        });
    });
    theController.$inject = ['$scope', 'ResultsData', 'map'];
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    var theController = module.controller('searchResultsController', function ($scope, ResultsData, map, SearchService) {
        var vm = this;
        vm.features = ResultsData.JsonFeatures;
        vm.featureLayers = null;
        vm.selectedResult = null;
        vm.layerGroupFilter = 'geenfilter';
        $scope.$watchCollection(function () {
            return ResultsData.JsonFeatures;
        }, function (newValue, oldValue) {
            vm.featureLayers = _.uniq(_.map(vm.features, 'layerName'));
            vm.layerGroupFilter = 'geenfilter';
        });
        $scope.$watch(function () {
            return ResultsData.SelectedFeature;
        }, function (newVal, oldVal) {
            vm.selectedResult = newVal;
        });
        vm.deleteFeature = function (feature) {
            SearchService.DeleteFeature(feature);
        };
        vm.aantalFeaturesMetType = function (type) {
            return vm.features.filter(function (x) {
                return x.layerName == type;
            }).length;
        };
        vm.HoveredFeature = null;
        vm.HoverOver = function (feature) {
            if (vm.HoveredFeature) {
                vm.HoveredFeature.hoverEdit = false;
            }
            feature.hoverEdit = true;
            vm.HoveredFeature = feature;
        };
        vm.deleteFeatureGroup = function (featureGroupName) {
            SearchService.DeleteFeatureGroup(featureGroupName);
        };
        vm.showDetails = function (feature) {
            ResultsData.SelectedFeature = feature;
        };
        vm.exportToCSV = function () {
            SearchService.ExportToCSV();
        };
    });
    theController.$inject = ['$scope', 'ResultsData', 'map'];
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    var theController = module.controller('searchSelectedController', function ($scope, ResultsData, MapData, SearchService, GeometryService, $modal) {
        var vm = this;
        vm.selectedResult = null;
        vm.prevResult = null;
        vm.nextResult = null;
        vm.props = [];
        $scope.$watch(function () {
            return ResultsData.SelectedFeature;
        }, function (newVal, oldVal) {
            if (oldVal && oldVal != newVal && oldVal.mapItem) {
                // there must be an oldval and it must not be the newval and it must have an mapitem (to dehighlight)
                var tmplayer = oldVal.mapItem._layers[Object.keys(oldVal.mapItem._layers)[0]];
                if (tmplayer._latlngs) {
                    // with s so it is an array, so not a point so we can set the style
                    tmplayer.setStyle(Style.DEFAULT);
                }
            }
            if (newVal) {
                if (newVal.mapItem) {
                    var tmplayer = newVal.mapItem._layers[Object.keys(newVal.mapItem._layers)[0]];
                    if (tmplayer._latlngs) {
                        // with s so it is an array, so not a point so we can set the style
                        tmplayer.setStyle(Style.HIGHLIGHT);
                    }
                }
                vm.selectedResult = newVal;
                var item = Object.getOwnPropertyNames(newVal.properties).map(function (k) {
                    return { key: k, value: newVal.properties[k] };
                });
                vm.props = item;
                vm.prevResult = SearchService.GetPrevResult();
                vm.nextResult = SearchService.GetNextResult();
            } else {
                vm.selectedResult = null;
                vm.prevResult = null;
                vm.nextResult = null;
            }
        });
        vm.toonFeatureOpKaart = function () {
            if (vm.selectedResult.theme.Type === 'esri') {
                MapData.PanToFeature(vm.selectedResult.mapItem);
            } else {
                // wms we go to the last identifybounds
                MapData.GoToLastClickBounds();
            }
        };
        vm.volgende = function () {
            ResultsData.SelectedFeature = vm.nextResult;
        };
        vm.vorige = function () {
            ResultsData.SelectedFeature = vm.prevResult;
        };
        vm.buffer = 1;
        vm.doordruk = function () {
            console.log(ResultsData.SelectedFeature);
            ResultsData.SelectedFeature.mapItem.toGeoJSON().features.forEach(function (feature) {
                GeometryService.BufferEnDoordruk(feature, 0);
            });
        };
        vm.buffer = function () {
            var bufferInstance = $modal.open({
                templateUrl: 'templates/search/bufferTemplate.html',
                controller: 'BufferController',
                resolve: {
                    backdrop: false,
                    keyboard: true
                    // urls: function() {
                    //     return MapData.ThemeUrls;
                    // }
                }
            });
            bufferInstance.result.then(function (buffer, layer) {
                ResultsData.SelectedFeature.mapItem.toGeoJSON().features.forEach(function (feature) {
                    GeometryService.BufferEnDoordruk(feature, buffer, layer);
                });
            }, function (obj) {
                console.log('Modal dismissed at: ' + new Date()); // The contoller is closed by the use of the $dismiss call
            });
        };
        vm.delete = function () {
            var prev = SearchService.GetPrevResult();
            var next = SearchService.GetNextResult();
            SearchService.DeleteFeature(vm.selectedResult);
            if (next) {
                ResultsData.SelectedFeature = next;
            } else if (prev) {
                ResultsData.SelectedFeature = prev;
            } else {
                ResultsData.SelectedFeature = null;
            }
        };
        vm.close = function (feature) {
            vm.selectedResult = null;
            vm.prevResult = null;
            vm.nextResult = null;
            ResultsData.SelectedFeature = null;
        };
    });
    theController.$inject = ['$scope', 'ResultsData', 'GeometryService', '$modal'];
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkSearch', function () {
        return {
            // restrict: 'E',
            replace: true,
            templateUrl: 'templates/search/searchTemplate.html',
            controller: 'searchController',
            controllerAs: 'srchctrl'
        };
    });
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkSearchResults', function () {
        return {
            // restrict: 'E',
            replace: true,
            templateUrl: 'templates/search/searchResultsTemplate.html',
            controller: 'searchResultsController',
            controllerAs: 'srchrsltsctrl'
        };
    });
})();
;'use strict';

(function (module) {
    module = angular.module('tink.gis');
    module.directive('tinkSearchSelected', function () {
        return {
            // restrict: 'E',
            replace: true,
            templateUrl: 'templates/search/searchSelectedTemplate.html',
            controller: 'searchSelectedController',
            controllerAs: 'srchslctdctrl'
        };
    });
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var data = function data() {
        var _data = {};
        _data.SelectedFeature = null;
        _data.JsonFeatures = [];
        _data.Loading = 0;
        _data.EmptyResult = false;
        _data.CleanSearch = function () {
            _data.SelectedFeature = null;
            _data.JsonFeatures.length = 0;
        };
        return _data;
    };
    module.factory('ResultsData', data);
})();
;'use strict';

(function () {
    var module = angular.module('tink.gis');
    var service = function service(ResultsData, map) {
        var _service = {};
        _service.DeleteFeature = function (feature) {
            var featureIndex = ResultsData.JsonFeatures.indexOf(feature);
            if (featureIndex > -1) {
                if (feature.mapItem) {
                    map.removeLayer(feature.mapItem);
                }
                ResultsData.JsonFeatures.splice(featureIndex, 1);
            }
        };
        _service.DeleteFeatureGroup = function (featureGroupName) {
            var toDelFeatures = [];
            ResultsData.JsonFeatures.forEach(function (feature) {
                if (feature.layerName === featureGroupName) {
                    toDelFeatures.push(feature);
                }
            });
            toDelFeatures.forEach(function (feat) {
                _service.DeleteFeature(feat);
            });
        };
        _service.ExportToCSV = function () {
            var csvContent = ""; // "data:text/csv;charset=utf-8,";
            var dataString = "";
            var layName = "";
            csvContent += 'Laag;' + "\n";

            ResultsData.JsonFeatures.forEach(function (feature, index) {
                if (layName !== feature.layerName) {
                    layName = feature.layerName;
                    var tmparr = [];
                    for (var name in feature.properties) {
                        tmparr.push(name);
                    }
                    var layfirstline = tmparr.join(";");

                    csvContent += layName + ";" + layfirstline + "\n";
                }
                var infoArray = _.values(feature.properties);
                infoArray.unshift(layName);
                dataString = infoArray.join(";");
                console.log(dataString);
                // csvContent += dataString + "\n";
                csvContent += index < ResultsData.JsonFeatures.length ? dataString + "\n" : dataString;
            });
            var a = document.createElement('a');
            a.href = 'data:attachment/csv,' + encodeURIComponent(csvContent);
            a.target = '_blank';
            a.download = 'exportsik.csv';

            document.body.appendChild(a);
            a.click();
            // var encodedUri = encodeURI(csvContent);
            // window.open(encodedUri, 'exportsik.csv');
        };
        _service.GetNextResult = function () {
            var index = ResultsData.JsonFeatures.indexOf(ResultsData.SelectedFeature);
            var layerName = ResultsData.SelectedFeature.layerName;
            if (index < ResultsData.JsonFeatures.length - 1) {
                // check for nextResult exists
                var nextItem = ResultsData.JsonFeatures[index + 1];
                if (nextItem.layerName === layerName) {
                    return nextItem;
                }
            }
            return null;
        };
        _service.GetPrevResult = function () {
            var index = ResultsData.JsonFeatures.indexOf(ResultsData.SelectedFeature);
            var layerName = ResultsData.SelectedFeature.layerName;
            if (index > 0) {
                // check or prevResult exists
                var prevItem = ResultsData.JsonFeatures[index - 1];
                if (prevItem.layerName === layerName) {
                    return prevItem;
                }
            }
            return null;
        };

        return _service;
    };
    module.factory("SearchService", service);
})();
;'use strict';

L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({

    // onAdd: function(map) {
    //     // Triggered when the layer is added to a map.
    //     //   Register a click listener, then do all the upstream WMS things
    //     L.TileLayer.WMS.prototype.onAdd.call(this, map);
    //     map.on('click', this.getFeatureInfo, this);
    // },

    // onRemove: function(map) {
    //     // Triggered when the layer is removed from a map.
    //     //   Unregister a click listener, then do all the upstream WMS things
    //     L.TileLayer.WMS.prototype.onRemove.call(this, map);
    //     map.off('click', this.getFeatureInfo, this);
    // },

    getFeatureInfo: function getFeatureInfo(latlng, layers) {
        // Make an AJAX request to the server and hope for the best
        var HelperService = angular.element(document).injector().get('HelperService');
        var url = this.getFeatureInfoUrl(latlng, layers);
        // showResults = L.Util.bind(this.showGetFeatureInfo, this);
        var prom = $.ajax({
            url: HelperService.CreateProxyUrl(url),
            success: function success(data, status, xhr) {
                // var err = typeof data === 'string' ? null : data;
                // showResults(err, latlng, data);
                // console.log(data);
                // var xmlstring = JXON.xmlToString(data);
                // var returnjson = JXON.stringToJs(xmlstring);

                // console.log(returnjson);
            },
            error: function error(xhr, status, _error) {
                // showResults(error);
            }
        });
        return prom;
    },

    getFeatureInfoUrl: function getFeatureInfoUrl(latlng, layers) {
        // Construct a GetFeatureInfo request URL given a point
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
            size = this._map.getSize(),
            params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: this.wmsParams.styles,
            transparent: this.wmsParams.transparent,
            version: this.wmsParams.version,
            format: this.wmsParams.format,
            bbox: this._map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: layers,
            query_layers: layers,
            buffer: 100,
            info_format: 'text/xml'
        };

        params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
        params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

        return this._url + L.Util.getParamString(params, this._url, true);
    }

});

L.tileLayer.betterWms = function (url, options) {
    return new L.TileLayer.BetterWMS(url, options);
};
;// (function() {
//
//     'use strict';
//
//     var componentName = "ErrorHandler";
//     var theComponent = function(appService) {
//
//         function _handle(errorResponse) {
//
//             // ToDo : vervang onderstaande door eigen error handling, indien gewenst
//
//             var message = "fout bij call naar " + errorResponse.config.url + " (" + errorResponse.config.method + ") - " + errorResponse.status + " ";
//             if (errorResponse.data) {
//                 if (errorResponse.data.message)
//                     message += errorResponse.data.message;
//                 else
//                     message += errorResponse.statusText;
//             } else {
//                 message += errorResponse.statusText;
//             }
//             appService.logger.error(message);
//         }
//
//         function _getErrorMessage(errorResponse, defaultMessage) {
//             defaultMessage = defaultMessage || "unknown error";
//             if (errorResponse.data) {
//                 if (errorResponse.data.listOfHttpError) {
//                     if (errorResponse.data.listOfHttpError.message) {
//                         return errorResponse.data.listOfHttpError.message;
//                     } else {
//                         if (errorResponse.statusText)
//                             return errorResponse.statusText;
//                         else
//                             return defaultMessage;
//                     }
//                 } else {
//                     if (errorResponse.data.message) {
//                         return errorResponse.data.message;
//                     } else {
//                         if (errorResponse.statusText)
//                             return errorResponse.statusText;
//                         else
//                             return defaultMessage;
//                     }
//                 }
//             } else {
//                 if (errorResponse.statusText)
//                     return errorResponse.statusText;
//                 else
//                     return defaultMessage;
//             }
//         }
//
//         /* +++++ public interface +++++ */
//
//         appService.logger.creation(componentName);
//
//         return {
//             handle: _handle,
//             getErrorMessage: _getErrorMessage,
//         };
//
//     };
//
//     theComponent.$inject = ['AppService'];
//
//     angular.module('tink.gis').factory(componentName, theComponent);
//
// })();
"use strict";
;'use strict';

L.drawVersion = '0.3.0-dev';

L.drawLocal = {
    draw: {
        toolbar: { actions: {
                title: 'Tekenen annuleren',
                text: 'Annuleren'
            },
            finish: {
                title: 'Tekenen beëindigen',
                text: 'Tekenen beëindigen'
            },
            undo: {
                title: 'Verwijder laatst getekende punt',
                text: 'Verwijder laatste punt'
            },
            buttons: {
                polyline: 'Teken een lijn',
                polygon: 'Teken een veelhoek',
                rectangle: 'Teken een rechthoek',
                circle: 'Teken een cirkel',
                marker: 'Teken een markering'
            }
        },
        handlers: {
            circle: {
                tooltip: {
                    start: 'Klik en sleep om een cirkel te tekenen.'
                },
                radius: 'Straal'
            },
            marker: {
                tooltip: {
                    start: 'Klik om een markering te plaatsen.'
                }
            },
            polygon: {
                tooltip: {
                    start: 'Klik om een veelhoek  te tekenen.',
                    cont: 'Klik om de veelhoek verder te tekenen.',
                    end: 'Klik op het eerste punt om de veelhoek te sluiten.'
                }
            },
            polyline: {
                error: '<strong>Error:</strong> figuur randen mogen niet kruisen!',
                tooltip: {
                    start: 'Klik om een lijn te tekenen.',
                    cont: 'Klik om de lijn verder te tekenen.',
                    end: 'Klik op het laatste punt om de lijn af te sluiten.'
                }
            },
            rectangle: {
                tooltip: {
                    start: 'Klik en sleep om een rechthoek te tekenen.'
                }
            },
            simpleshape: {
                tooltip: {
                    end: 'Laat de muis los om het tekenen te beëindigen.'
                }
            }
        }
    },
    edit: {
        toolbar: {
            actions: {
                save: {
                    title: 'Aanpassingen bewaren.',
                    text: 'Bewaren'
                },
                cancel: {
                    title: 'Tekenen annuleren, aanpassingen verwijderen.',
                    text: 'Annuleren'
                }
            },
            buttons: {
                edit: 'Lagen bewerken.',
                editDisabled: 'Geen lagen om te bewerken.',
                remove: 'Lagen verwijderen.',
                removeDisabled: 'Geen lagen om te verwijderen.'
            }
        },
        handlers: {
            edit: {
                tooltip: {
                    text: 'Versleep ankerpunt of markering om het object aan te passen.',
                    subtext: 'Klink Annuleer om de aanpassingen ongedaan te maken.'
                }
            },
            remove: {
                tooltip: {
                    text: 'Klik op object om te verwijderen'
                }
            }
        }
    }
};
;// (function() {
//
//     'use strict';
//
//     var componentName = "Logger";
//     var theComponent = function($log, appConfig) {
//
//         function _success(message) {
//             if (appConfig.enableLog) {
//                 $log.log(message);
//             }
//         }
//
//         function _debug(message) {
//             if (appConfig.enableLog) {
//                 if (appConfig.enableDebug) {
//                     $log.debug(message);
//                 }
//             }
//         }
//
//         function _info(message) {
//             if (appConfig.enableLog) {
//                 $log.info(message);
//             }
//         }
//
//         function _warn(message) {
//             if (appConfig.enableLog) {
//                 $log.warn(message);
//             }
//         }
//
//         function _error(message) {
//             if (appConfig.enableLog) {
//                 $log.error(message);
//             }
//         }
//
//         function _creation(name) {
//             _debug(name + " : gecreëerd.");
//         }
//
//         function _initialization(name) {
//             _debug(name + " : geïnitialiseerd.");
//         }
//
//         /* +++++ public interface +++++ */
//
//         return {
//             success: _success,
//             debug: _debug,
//             info: _info,
//             warn: _warn,
//             error: _error,
//             creation: _creation,
//             init: _initialization
//         };
//
//     };
//     theComponent.$inject = ['$log', 'appConfig'];
//     angular.module('tink.gis').factory(componentName, theComponent);
//
// })()
"use strict";
;angular.module('tink.gis').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/external/streetView.html',
    "<html>\n" +
    "<head>\n" +
    "<meta charset=utf-8>\n" +
    "<title>Street View side-by-side</title>\n" +
    "<style>\n" +
    "html, body {\r" +
    "\n" +
    "        height: 100%;\r" +
    "\n" +
    "        margin: 0;\r" +
    "\n" +
    "        padding: 0;\r" +
    "\n" +
    "      }\r" +
    "\n" +
    "      #map,  {\r" +
    "\n" +
    "        float: left;\r" +
    "\n" +
    "        height: 0%;\r" +
    "\n" +
    "        width: 0%;\r" +
    "\n" +
    "      }\r" +
    "\n" +
    "       #pano {\r" +
    "\n" +
    "        float: left;\r" +
    "\n" +
    "        height: 100%;\r" +
    "\n" +
    "        width: 100%;\r" +
    "\n" +
    "      }\n" +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    "<div id=map></div>\n" +
    "<div id=pano></div>\n" +
    "<script>\n" +
    "function initialize() {\r" +
    "\n" +
    "        \r" +
    "\n" +
    "        var urlLat = parseFloat((location.search.split('lat=')[1]||'').split('&')[0]);\r" +
    "\n" +
    "        var urlLng = parseFloat((location.search.split('lng=')[1]||'').split('&')[0]);\r" +
    "\n" +
    "        var fenway = {lat:urlLat, lng: urlLng};\r" +
    "\n" +
    "        var map = new google.maps.Map(document.getElementById('map'), {\r" +
    "\n" +
    "          center: fenway,\r" +
    "\n" +
    "          zoom: 14\r" +
    "\n" +
    "        });\r" +
    "\n" +
    "        var panorama = new google.maps.StreetViewPanorama(\r" +
    "\n" +
    "            document.getElementById('pano'), {\r" +
    "\n" +
    "              position: fenway,\r" +
    "\n" +
    "              pov: {\r" +
    "\n" +
    "                heading: 34,\r" +
    "\n" +
    "                pitch: 10\r" +
    "\n" +
    "              }\r" +
    "\n" +
    "            });\r" +
    "\n" +
    "        map.setStreetView(panorama);\r" +
    "\n" +
    "      }\n" +
    "</script>\n" +
    "<script async defer src=\"https://maps.googleapis.com/maps/api/js?callback=initialize\">\n" +
    "</script>\n" +
    "</body>\n" +
    "</html>"
  );


  $templateCache.put('templates/layermanagement/geoPuntTemplate.html',
    "<div class=row>\n" +
    "<div class=col-md-4>\n" +
    "<input class=searchbox ng-model=searchTerm ng-change=searchChanged() ng-model-options=\"{debounce: 500}\" placeholder=\"Geef een trefwoord of een url in\">\n" +
    "<input disabled value=https://geodata.antwerpen.be/arcgissql/services/P_SiK/Groeninventaris/MapServer/WMSServer>\n" +
    "<div ng-if=!searchIsUrl ng-repeat=\"theme in availableThemes\">\n" +
    "<div ng-click=geopuntThemeChanged(theme) ng-class=\"{'greytext': theme.Type != 'wms' &&  theme.Type != 'esri'}\">\n" +
    "{{theme.Naam}}\n" +
    "<i ng-if=\"theme.Added == true\" class=\"fa fa-check-circle\"></i>\n" +
    "<i ng-if=\"theme.Added == null\" class=\"fa fa-check-circle-o\"></i>\n" +
    "</div>\n" +
    "</div>\n" +
    "<tink-pagination ng-hide=\"numberofrecordsmatched <= 5\" tink-items-per-page-values=[5] tink-current-page=currentPage tink-change=pageChanged(page,perPage,next) tink-total-items=numberofrecordsmatched tink-items-per-page=recordsAPage></tink-pagination>\n" +
    "</div>\n" +
    "<div class=col-md-8>\n" +
    "<div ng-if=searchIsUrl>\n" +
    "<button ng-click=laadUrl()>Laad url</button>\n" +
    "</div>\n" +
    "<div ng-if=\"copySelectedTheme !== null\">\n" +
    "<button ng-if=\"copySelectedTheme.Added != false\" data-ng-click=AddOrUpdateTheme()>Update</button>\n" +
    "<p>{{copySelectedTheme.Description}}</p>\n" +
    "<p><small><a ng-href={{copySelectedTheme.CleanUrl}} target=_blank>Details</a></small></p>\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input indeterminate-checkbox child-list=copySelectedTheme.AllLayers property=enabled type=checkbox ng-model=copySelectedTheme.enabled id={{copySelectedTheme.name}}>\n" +
    "<label for={{copySelectedTheme.name}}> {{copySelectedTheme.name | limitTo: 99}}</label>\n" +
    "<div ng-repeat=\"mainlayer in copySelectedTheme.Layers\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input type=checkbox ng-model=mainlayer.enabled id={{mainlayer.name}}{{mainlayer.id}}>\n" +
    "<label for={{mainlayer.name}}{{mainlayer.id}}> {{mainlayer.title | limitTo: 99}}</label>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div ng-repeat=\"groupLayer in copySelectedTheme.Groups\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input indeterminate-checkbox child-list=groupLayer.Layers property=enabled type=checkbox ng-model=groupLayer.enabled id={{groupLayer.name}}{{groupLayer.id}}>\n" +
    "<label for={{groupLayer.name}}{{groupLayer.id}}> {{groupLayer.title | limitTo: 99}}</label>\n" +
    "<div ng-repeat=\"layer in groupLayer.Layers\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input type=checkbox ng-model=layer.enabled ng-change=layer.chkChanged() id={{layer.name}}{{layer.id}}>\n" +
    "<label for={{layer.name}}{{layer.id}}> {{layer.title | limitTo: 99}}</label>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<button ng-if=\"copySelectedTheme.Added == false\" data-ng-click=AddOrUpdateTheme()>Toevoegen</button>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/layermanagement/layerManagerTemplate.html',
    "<div>\n" +
    "<div class=modal-header>\n" +
    "<button type=button style=float:right data-ng-click=cancel()><i class=\"fa fa-times\"></i></button>\n" +
    "<h4 class=model-title>Laag toevoegen\n" +
    "</h4></div>\n" +
    "<div class=modal-content>\n" +
    "<ul class=nav-tabs>\n" +
    "<li role=presentation ng-class=\"{'active': active=='solr'}\"><a href=\"\" ng-click=\"active='solr'\">Stad</a></li>\n" +
    "<li role=presentation ng-class=\"{'active': active=='geopunt'}\"><a href=# ng-click=\"active='geopunt'\">GeoPunt</a></li>\n" +
    "<li role=presentation ng-class=\"{'active': active=='Beheer'}\"><a href=\"\" ng-click=\"active='beheer'\">Beheer</a></li>\n" +
    "</ul>\n" +
    "<solr-gis ng-show=\"active=='solr'\"></solr-gis>\n" +
    "<geo-punt ng-show=\"active=='geopunt'\"></geo-punt>\n" +
    "</div>\n" +
    "<div class=modal-footer>\n" +
    "<button data-ng-click=ok()>Klaar</button>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/layermanagement/solrGISTemplate.html',
    "<div class=row>\n" +
    "<div class=col-md-4>\n" +
    "<input class=searchbox ng-model=searchTerm ng-change=searchChanged() ng-model-options=\"{debounce: 250}\" placeholder=\"Geef een trefwoord\">\n" +
    "<div ng-if=!searchIsUrl ng-repeat=\"theme in availableThemes\">\n" +
    "<div ng-click=solrThemeChanged(theme) class=greytext>\n" +
    "{{theme.name}}\n" +
    "<div style=\"margin-left: 20px\" ng-repeat=\"layer in theme.layers\">\n" +
    "<span ng-class=\"{'blacktext': layer.isMatch}\">{{layer.naam}}<span ng-show=\"layer.featuresCount > 0\"> ({{layer.featuresCount}})</span> </span>\n" +
    "<div class=\"blacktext featureinsolr\">\n" +
    "{{layer.features.join(', ')}}\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<tink-pagination ng-hide=\"numberofrecordsmatched <= 5\" tink-items-per-page-values=[5] tink-current-page=currentPage tink-change=pageChanged(page,perPage,next) tink-total-items=numberofrecordsmatched tink-items-per-page=recordsAPage></tink-pagination>\n" +
    "</div>\n" +
    "<div class=col-md-8>\n" +
    "<div ng-if=\"copySelectedTheme !== null\">\n" +
    "<button ng-if=\"copySelectedTheme.Added != false\" data-ng-click=AddOrUpdateTheme()>Update</button>\n" +
    "<p>{{copySelectedTheme.Description}}</p>\n" +
    "<p><small><a ng-href={{copySelectedTheme.CleanUrl}} target=_blank>Details</a></small></p>\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input indeterminate-checkbox child-list=copySelectedTheme.AllLayers property=enabled type=checkbox ng-model=copySelectedTheme.enabled id={{copySelectedTheme.name}}>\n" +
    "<label for={{copySelectedTheme.name}}> {{copySelectedTheme.name | limitTo: 99}}</label>\n" +
    "<div ng-repeat=\"mainlayer in copySelectedTheme.Layers\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input type=checkbox ng-model=mainlayer.enabled id={{mainlayer.name}}{{mainlayer.id}}>\n" +
    "<label for={{mainlayer.name}}{{mainlayer.id}}> {{mainlayer.title | limitTo: 99}}</label>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div ng-repeat=\"groupLayer in copySelectedTheme.Groups\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input indeterminate-checkbox child-list=groupLayer.Layers property=enabled type=checkbox ng-model=groupLayer.enabled id={{groupLayer.name}}{{groupLayer.id}}>\n" +
    "<label for={{groupLayer.name}}{{groupLayer.id}}> {{groupLayer.title | limitTo: 99}}</label>\n" +
    "<div ng-repeat=\"layer in groupLayer.Layers\">\n" +
    "<div class=layercontroller-checkbox>\n" +
    "<input type=checkbox ng-model=layer.enabled ng-change=layer.chkChanged() id={{layer.name}}{{layer.id}}>\n" +
    "<label for={{layer.name}}{{layer.id}}> {{layer.title | limitTo: 99}}</label>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<button ng-if=\"copySelectedTheme.Added == false\" data-ng-click=AddOrUpdateTheme()>Toevoegen</button>\n" +
    "</div>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/other/groupLayerTemplate.html',
    "<div class=layercontroller-checkbox>\n" +
    "<input class=visible-box type=checkbox id={{grplyrctrl.grouplayer.name}}{{grplyrctrl.grouplayer.id}} ng-model=grplyrctrl.grouplayer.visible ng-change=grplyrctrl.chkChanged()>\n" +
    "<label for={{grplyrctrl.grouplayer.name}}{{grplyrctrl.grouplayer.id}}>{{grplyrctrl.grouplayer.name}}</label>\n" +
    "<div ng-repeat=\"layer in grplyrctrl.grouplayer.Layers | filter :  { enabled: true }\">\n" +
    "<tink-layer layer=layer>\n" +
    "</tink-layer>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/other/layerTemplate.html',
    "<div class=layercontroller-checkbox>\n" +
    "<img style=\"width:20px; height:20px\" ng-if=\"lyrctrl.layer.theme.Type == 'esri' && lyrctrl.layer.legend.length == 1\" ng-src={{lyrctrl.layer.legend[0].fullurl}}>\n" +
    "<input class=visible-box type=checkbox ng-model=lyrctrl.layer.visible ng-change=lyrctrl.chkChanged() id={{lyrctrl.layer.name}}{{lyrctrl.layer.id}}>\n" +
    "<label ng-class=\"{'greytext': lyrctrl.layer.displayed == false}\" for={{lyrctrl.layer.name}}{{lyrctrl.layer.id}}> {{lyrctrl.layer.title | limitTo: 23}}<span ng-show=\"lyrctrl.layer.theme.Type == 'wms' && lyrctrl.layer.queryable\">(i)</span></label>\n" +
    "<img ng-if=\"lyrctrl.layer.theme.Type == 'wms'\" ng-src=\"{{layer.theme.CleanUrl}}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER={{lyrctrl.layer.id}}\"><img>\n" +
    "<div ng-if=\"lyrctrl.layer.theme.Type == 'esri' && lyrctrl.layer.legend.length > 1\" ng-repeat=\"legend in lyrctrl.layer.legend\">\n" +
    "<img style=\"width:20px; height:20px\" ng-src={{legend.fullurl}}><img><span> {{legend.label}}</span>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/other/layersTemplate.html',
    "<div data-tink-nav-aside=\"\" id=rightaside data-auto-select=true data-toggle-id=asideNavRight class=\"nav-aside nav-right\">\n" +
    "<aside>\n" +
    "<div class=nav-aside-section>\n" +
    "<button class=\"btn btn-primary addlayerbtn\" ng-click=lyrsctrl.AddLayers()>Lagenbeheer</button>\n" +
    "<ul id=sortableThemes ui-sortable=lyrsctrl.sortableOptions ng-model=lyrsctrl.themes>\n" +
    "<div ng-repeat=\"theme in lyrsctrl.themes\">\n" +
    "<tink-theme theme=theme>\n" +
    "</tink-theme>\n" +
    "</div>\n" +
    "</ul>\n" +
    "</div>\n" +
    "</aside>\n" +
    "</div>"
  );


  $templateCache.put('templates/other/mapTemplate.html',
    "<div class=tink-map>\n" +
    "<div id=map class=leafletmap>\n" +
    "<div class=\"btn-group ll searchbtns\">\n" +
    "<button type=button class=btn ng-class=\"{active: mapctrl.ZoekenOpLocatie==true}\" ng-click=\"mapctrl.ZoekenOpLocatie=true\" prevent-default><i class=\"fa fa-map-marker\"></i></button>\n" +
    "<button type=button class=btn ng-class=\"{active: mapctrl.ZoekenOpLocatie==false}\" ng-click=\"mapctrl.ZoekenOpLocatie=false\" prevent-default><i class=\"fa fa-download\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"ll zoekbalken\">\n" +
    "<input type=search class=zoekbalk ng-show=\"mapctrl.ZoekenOpLocatie == true\" placeholder=\"Geef een X,Y / locatie of POI in.\" ng-change=mapctrl.zoekLocChanged(mapctrl.zoekLoc) ng-keyup=\"$event.keyCode == 13 && mapctrl.zoekLocatie(mapctrl.zoekLoc)\" ng-model=mapctrl.zoekLoc prevent-default>\n" +
    "<input type=search class=zoekbalk ng-show=\"mapctrl.ZoekenOpLocatie == false\" placeholder=\"Geef een zoekterm\" prevent-default ng-keyup=\"$event.keyCode == 13 && mapctrl.zoekLaag(mapctrl.laagquery)\" ng-model=mapctrl.laagquery>\n" +
    "<select ng-options=\"layer as layer.name for layer in mapctrl.SelectableLayers\" ng-model=mapctrl.selectedLayer ng-show=\"mapctrl.ZoekenOpLocatie == false\" ng-change=mapctrl.layerChange() ng-class=\"{invisible: mapctrl.SelectableLayers.length<=1}\" prevent-default></select>\n" +
    "</div>\n" +
    "<div class=\"btn-group btn-group-vertical ll interactiebtns\">\n" +
    "<button type=button class=btn ng-click=\"mapctrl.interactieButtonChanged('identify')\" ng-class=\"{active: mapctrl.activeInteractieKnop=='identify'}\" prevent-default><i class=\"fa fa-info\"></i></button>\n" +
    "<button type=button class=btn ng-click=\"mapctrl.interactieButtonChanged('select')\" ng-class=\"{active: mapctrl.activeInteractieKnop=='select'}\" prevent-default><i class=\"fa fa-mouse-pointer\"></i></button>\n" +
    "<button type=button class=btn ng-click=\"mapctrl.interactieButtonChanged('meten')\" ng-class=\"{active: mapctrl.activeInteractieKnop=='meten'}\" prevent-default><i class=\"fa fa-expand\"></i></button>\n" +
    "<button type=button class=btn ng-click=\"mapctrl.interactieButtonChanged('watishier')\" ng-class=\"{active: mapctrl.activeInteractieKnop=='watishier'}\" prevent-default><i class=\"fa fa-thumb-tack\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"btn-group ll metenbtns\" ng-show=mapctrl.showMetenControls>\n" +
    "<button ng-click=\"mapctrl.drawingButtonChanged('afstand')\" ng-class=\"{active: mapctrl.drawingType=='afstand'}\" type=button class=btn prevent-default><i class=\"fa fa-arrows-h\"></i></button>\n" +
    "<button ng-click=\"mapctrl.drawingButtonChanged('oppervlakte')\" ng-class=\"{active: mapctrl.drawingType=='oppervlakte'}\" type=button class=btn prevent-default><i class=\"fa fa-star-o\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"btn-group ll drawingbtns\" ng-show=mapctrl.showDrawControls>\n" +
    "<button ng-click=mapctrl.selectpunt() ng-class=\"{active: mapctrl.drawingType==''}\" type=button class=btn prevent-default><i class=\"fa fa-mouse-pointer\"></i></button>\n" +
    "<button ng-click=\"mapctrl.drawingButtonChanged('lijn')\" ng-class=\"{active: mapctrl.drawingType=='lijn'}\" type=button class=btn prevent-default><i class=\"fa fa-minus\"></i></button>\n" +
    "<button ng-click=\"mapctrl.drawingButtonChanged('vierkant')\" ng-class=\"{active: mapctrl.drawingType=='vierkant'}\" type=button class=btn prevent-default><i class=\"fa fa-square-o\"></i></button>\n" +
    "<button ng-click=\"mapctrl.drawingButtonChanged('polygon')\" ng-class=\"{active: mapctrl.drawingType=='polygon'}\" type=button class=btn prevent-default><i class=\"fa fa-star-o\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"ll btn-group kaarttypes\">\n" +
    "<button class=btn ng-class=\"{active: mapctrl.kaartIsGetoond==true}\" ng-click=mapctrl.toonKaart() prevent-default>Kaart</button>\n" +
    "<button class=btn ng-class=\"{active: mapctrl.kaartIsGetoond==false}\" ng-click=mapctrl.toonLuchtfoto() prevent-default>Luchtfoto</button>\n" +
    "</div>\n" +
    "<div class=\"btn-group btn-group-vertical ll viewbtns\">\n" +
    "<button type=button class=btn ng-click=mapctrl.zoomIn() prevent-default><i class=\"fa fa-plus\"></i></button>\n" +
    "<button type=button class=btn ng-click=mapctrl.zoomOut() prevent-default><i class=\"fa fa-minus\"></i></button>\n" +
    "<button type=button class=btn ng-click=\"\" prevent-default><i class=\"fa fa-crosshairs\"></i></button>\n" +
    "<button type=button class=btn ng-click=mapctrl.fullExtent() prevent-default><i class=\"fa fa-home\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"btn-group btn-group-vertical ll localiseerbtn\">\n" +
    "<button type=button class=btn prevent-default><i class=\"fa fa-male\"></i></button>\n" +
    "</div>\n" +
    "<div class=\"ll loading\" ng-show=\"mapctrl.Loading > 0\">\n" +
    "<div class=loader></div> {{mapctrl.MaxLoading - mapctrl.Loading}}/ {{mapctrl.MaxLoading}}\n" +
    "</div>\n" +
    "</div>\n" +
    "<tink-search></tink-search>\n" +
    "<tink-layers></tink-layers>\n" +
    "</div>"
  );


  $templateCache.put('templates/other/themeTemplate.html',
    "<div>\n" +
    "<input class=visible-box type=checkbox id=chk{{thmctrl.theme.Naam}} ng-model=thmctrl.theme.Visible ng-change=thmctrl.chkChanged()>\n" +
    "<label for=chk{{thmctrl.theme.Naam}}> {{thmctrl.theme.Naam}} <span ng-show=\"thmctrl.theme.Type=='esri'\">(stad)</span><span ng-hide=\"thmctrl.theme.Type=='esri'\">({{thmctrl.theme.Type}})</span></label><i class=\"fa fa-trash pull-right\" ng-click=thmctrl.deleteTheme()></i>\n" +
    "<div class=layercontroller-checkbox ng-repeat=\"layer in thmctrl.theme.Layers | filter: { enabled: true }\">\n" +
    "<tink-layer layer=layer>\n" +
    "</tink-layer>\n" +
    "</div>\n" +
    "<div class=layercontroller-checkbox ng-repeat=\"group in thmctrl.theme.Groups | filter: { enabled: true }\">\n" +
    "<tink-grouplayer grouplayer=group>\n" +
    "</tink-grouplayer>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/search/bufferTemplate.html',
    "<div>\n" +
    "<div class=modal-header>\n" +
    "<button type=button style=float:right data-ng-click=cancel()><i class=\"fa fa-times\"></i></button>\n" +
    "<h4 class=model-title>Buffer instellen</h4>\n" +
    "</div>\n" +
    "<div class=modal-content>\n" +
    "Selecteer de laag:\n" +
    "<select ng-options=\"layer as layer.name for layer in SelectableLayers\" ng-model=selectedLayer prevent-default></select> Geef de bufferafstand:\n" +
    "<input type=number ng-model=buffer>\n" +
    "</div>\n" +
    "<div class=modal-footer>\n" +
    "<button data-ng-click=ok()>Klaar</button>\n" +
    "</div>\n" +
    "</div>"
  );


  $templateCache.put('templates/search/searchResultsTemplate.html',
    "<div ng-if=\"!srchrsltsctrl.selectedResult && srchrsltsctrl.featureLayers.length > 0\">\n" +
    "<select ng-model=srchrsltsctrl.layerGroupFilter>\n" +
    "<option value=geenfilter selected>Geen filter ({{srchrsltsctrl.features.length}})</option>\n" +
    "<option ng-repeat=\"feat in srchrsltsctrl.featureLayers\" value={{feat}}>{{feat}} ({{srchrsltsctrl.aantalFeaturesMetType(feat)}})</option>\n" +
    "</select>\n" +
    "<ul ng-repeat=\"layerGroupName in srchrsltsctrl.featureLayers\">\n" +
    "<tink-accordion ng-if=\"srchrsltsctrl.layerGroupFilter=='geenfilter' || srchrsltsctrl.layerGroupFilter==layerGroupName \" data-start-open=true data-one-at-a-time=false>\n" +
    "<tink-accordion-panel>\n" +
    "<data-header>\n" +
    "<p class=nav-aside-title>{{layerGroupName}} ({{srchrsltsctrl.aantalFeaturesMetType(layerGroupName)}})\n" +
    "<button prevent-default ng-click=srchrsltsctrl.deleteFeatureGroup(layerGroupName) class=pull-right><i class=\"fa fa-trash\"></i></button>\n" +
    "</p>\n" +
    "</data-header>\n" +
    "<data-content>\n" +
    "<li ng-repeat=\"feature in srchrsltsctrl.features | filter: { layerName:layerGroupName } :true\" ng-mouseover=srchrsltsctrl.HoverOver(feature)>\n" +
    "<a ng-if=!feature.hoverEdit ng-click=srchrsltsctrl.showDetails(feature)>{{ feature.displayValue | limitTo : 23}}</a>\n" +
    "<div ng-if=feature.hoverEdit>\n" +
    "<a ng-click=srchrsltsctrl.showDetails(feature)>{{ feature.displayValue}}\n" +
    "</a>\n" +
    "<a class=pull-right prevent-default ng-click=srchrsltsctrl.deleteFeature(feature)><i class=\"fa fa-trash\"></i></a>\n" +
    "</div>\n" +
    "</li>\n" +
    "</data-content>\n" +
    "</tink-accordion-panel>\n" +
    "</tink-accordion>\n" +
    "</ul>\n" +
    "<p></p><a ng-click=srchrsltsctrl.exportToCSV()>Export to CSV</a><p></p>\n" +
    "</div>"
  );


  $templateCache.put('templates/search/searchSelectedTemplate.html',
    "<div ng-if=srchslctdctrl.selectedResult>\n" +
    "<div class=row>\n" +
    "<div class=col-md-4>\n" +
    "<button class=\"pull-left srchbtn\" ng-if=srchslctdctrl.prevResult ng-click=srchslctdctrl.vorige()>Vorige</button>\n" +
    "</div>\n" +
    "<div class=col-md-4>\n" +
    "<button class=srchbtn ng-click=srchslctdctrl.delete()>Delete</button>\n" +
    "</div>\n" +
    "<div class=col-md-4>\n" +
    "<button class=\"pull-right srchbtn\" ng-if=srchslctdctrl.nextResult ng-click=srchslctdctrl.volgende()>Volgende</button>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div class=row ng-repeat=\"prop in srchslctdctrl.props\">\n" +
    "<div class=col-md-5> {{ prop.key}} </div>\n" +
    "<div class=col-md-7 ng-if=\"prop.value.toLowerCase() != 'null'\">\n" +
    "<a ng-if=\" prop.value.indexOf( 'https://')==0 || prop.value.indexOf( 'http://')==0 \" ng-href={{prop.value}} target=_blank>Link</a>\n" +
    "<div ng-if=\"prop.value.indexOf( 'https://') !=0 && prop.value.indexOf( 'http://') !=0 \">{{ prop.value }}</div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div class=row>\n" +
    "<div class=col-md-6>\n" +
    "<button class=\"pull-left srchbtn\" ng-click=srchslctdctrl.toonFeatureOpKaart()>Tonen</button>\n" +
    "</div>\n" +
    "<div class=col-md-6>\n" +
    "<button class=\"pull-left srchbtn\" ng-click=srchslctdctrl.doordruk()>Doordruk</button>\n" +
    "<button class=\"pull-left srchbtn\" ng-click=srchslctdctrl.buffer()>Buffer</button>\n" +
    "</div>\n" +
    "</div>\n" +
    "<button class=srchbtn ng-click=\"srchslctdctrl.close(srchslctdctrl.selectedResult) \">Terug naar resultaten</button>\n" +
    "</div>"
  );


  $templateCache.put('templates/search/searchTemplate.html',
    "<div data-tink-nav-aside=\"\" id=leftaside data-auto-select=true data-toggle-id=asideNavLeft class=\"nav-aside nav-left\">\n" +
    "<aside>\n" +
    "<div class=nav-aside-section ng-show=\"srchctrl.Loading == 0\">\n" +
    "<tink-search-results></tink-search-results>\n" +
    "<tink-search-selected></tink-search-selected>\n" +
    "</div>\n" +
    "<div class=nav-aside-section ng-show=\"srchctrl.Loading > 0\">\n" +
    "<div class=loader></div> {{srchctrl.MaxLoading - srchctrl.Loading}}/ {{srchctrl.MaxLoading}}\n" +
    "</div>\n" +
    "</aside>\n" +
    "</div>"
  );

}]);
