'use strict';
(function () {
    var module = angular.module('tink.gis');
    var service = function () {
        var _service = {};
        proj4.defs('EPSG:31370', '+proj=lcc +lat_1=51.16666723333334 +lat_2=49.83333389999999 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438'
            + ' +ellps=intl +towgs84=-99.1,53.3,-112.5,0.419,-0.83,1.885,-1.0 +units=m +no_defs');
        // proj4.defs('EPSG:31370', '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1 +units=m +no_defs');

        _service.ConvertWSG84ToLambert72 = function (coordinates) {
            var result = proj4('EPSG:31370', [(coordinates.lng || coordinates.x), (coordinates.lat || coordinates.y)]);
            return {
                x: result[0],
                y: result[1]
            };
        };
        _service.ConvertLambert72ToWSG84 = function (coordinates) {
            var x = (coordinates.lng || coordinates.x || coordinates[0]);
            var y = (coordinates.lat || coordinates.y || coordinates[1]);
            var result = proj4('EPSG:31370', 'WGS84', [x, y]);
            return {
                y: result[0],
                x: result[1]
            };
        };
        let isCharDigit = function (n) {
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
                for (let char of search) {
                    if (isCharDigit(char)) {
                        if (samegetal) {
                            currgetal = currgetal + char;
                        }
                        else {
                            currgetal = '' + char;
                            samegetal = true;
                        }
                    }
                    else {
                        if ((currgetal == '51' || currgetal == '4') && (char == '.' || char == ',') && hasaseperater == false) {
                            currgetal = currgetal + char;
                            aantalmetcorrectesize++;
                            hasaseperater = true;
                        }
                        else {
                            if (currgetal != '') {
                                getals.push(currgetal);
                            }
                            currgetal = '';
                            samegetal = false;
                            hasaseperater = false;

                        }
                    }
                }
                if (currgetal != '') {
                    getals.push(currgetal);
                }
            }
            if (aantalmetcorrectesize == 2 && getals.length == 2) {
                returnobject.X = getals[0];
                returnobject.Y = getals[1];
                returnobject.hasCordinates = true;
                return returnobject;
            }
            else {
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
            for (let char of search) {
                if (isCharDigit(char)) {
                    if (samegetal) {
                        currgetal = currgetal + char;
                    }
                    else {
                        currgetal = '' + char;
                        samegetal = true;
                    }
                }
                else {
                    if (currgetal.length == 6) {
                        if (currgetal[0] == '1') {
                            if (currgetal[1] == '3' || currgetal[1] == '4' || currgetal[1] == '5') {
                                aantalmet6size++;
                            }
                            else {
                                returnobject.error = 'Out of bounds cordinaten voor Antwerpen.';
                                return returnobject;
                            }
                        }
                        else if (currgetal[0] == '2') {
                            if (currgetal[1] == '0' || currgetal[1] == '1' || currgetal[1] == '2') {
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
                    else {
                        if (currgetal != '') {

                            getals.push(currgetal);
                        }
                        hasaseperater = false;
                        currgetal = '';
                        samegetal = false;
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
                returnobject.X = getals[0];
                returnobject.Y = getals[1];
                returnobject.hasCordinates = true;
                return returnobject;
            }
            else {
                returnobject.error = 'Incorrect format: Lat,Lng is required';
                return returnobject;
            }
        };

        return _service;
    };
    // module.$inject = ["$http", 'map'];
    module.factory('HelperService', service);
})();