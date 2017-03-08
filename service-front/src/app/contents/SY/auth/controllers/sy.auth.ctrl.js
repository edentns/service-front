(function () {
    "use strict";

    /**
     * 권한관리 - root
     * @name SY.auth.controller : SY.authMngCtrl
     */
    angular.module("SY.auth.controller")
        .controller("SY.authMngCtrl", ["$scope", "$q", "$timeout", "SY.authSvc", "resData", "$interval", "Page",
            function ($scope, $q, $timeout, SyAuthSvc, resData, $interval, Page) {
	            var page  = $scope.page = new Page({ auth: resData.access }),
		            today = edt.getToday();

                var rowTemplate = "<div ng-click=\"grid.appScope.authMngVO.rowClick(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ui-grid-cell></div>";

                /**
                 * @typedef {object} authMngVO
                 * @property {string} searchNm 검색어
                 * @property {array} deleteData 권한정보 삭제데이터
                 * @property {object} select
                 * @property {function} initLoad
                 * @property {function} init
                 * @property {function} inquiry
                 * @property {function} makeGridEntity
                 * @property {function} makeGetParam
                 * @property {function} makePostParam
                 * @property {function} add
                 * @property {function} delete
                 * @property {function} save
                 * @property {function} rowClick
                 */

                /**
                 * authMngVO
                 * @namespace
                 * @type {Boolean}
                 * @type {String} searchNm 검색어
                 * @type {Array} deleteData 권한정보 삭제데이터
                 */
                var authMngVO = $scope.authMngVO = {
                    boxTitle    : "권한정보",
                    searchNm	: "",
                    deleteData 	: [],
                    select      : {
                        CD_G : "",
                        NM_G : ""
                    }
                };

                /**
                 * 권한정보 grid option을 세팅한다.
                 */
                authMngVO.options = {
                    multiSelect             : false,
                    enableRowSelection	    : true,
                    enableCellEditOnFocus   : true,

                    data    : [],
                    height  : 400,
                    rowTemplate : rowTemplate,
                    columnDefs  : [
                        { displayName : "권한코드", field : "CD_G", width : 100, enableCellEdit: false },
                        { displayName : "권한이름", field : "NM_G", width : 150, enableCellEdit: true },
                        { displayName : "사용여부", field : "YN_USE", width : 100, enableCellEdit: true, cellClass: "ta-c", cellFilter: "ynUse", editableCellTemplate: "ui-grid/dropdownEditor", editDropdownValueLabel: "YN_USE",
                            editDropdownOptionsArray : [  { id: "Y", YN_USE: "사용" }, { id: "N", YN_USE: "사용안함" }] },
                        { displayName : "수정일시", field : "DTS_UPDATE", width : 120, enableCellEdit: false }
                    ],

                    onRegisterApi : function (gridApi) {
                        authMngVO.gridApi = gridApi;

                        gridApi.edit.on.afterCellEdit($scope, function (oRowEntity) {
                            if (oRowEntity.CD_G && oRowEntity.CD_G!=="") {
                                oRowEntity.STATE = "U";
                            }
                        });
                    }
                };

                /**
                 * 초기로드시 실행된다.
                 */
                authMngVO.initLoad = function () {
                    var self = this;

                    self.inquiry();
                    $scope.$on("admin.auth:init", function () {
                        self.inquiry();
                    });
                };

                /**
                 * 사용자코드정보를 초기화하고 조회한다.
                 */
                authMngVO.init = function () {
                    this.deleteData = [];
                    this.inquiry();
                };

                /**
                 * 권한코드정보를 가져온다.
                 */
                authMngVO.inquiry = function () {
                    var self = this;
                    SyAuthSvc.getAuthList(this.makeGetParam())
                        .then(function (result) {
                            self.options.data = result.data;

                            var selectCdg = self.select.CD_G;
                            if (selectCdg !== "") {
                                var oSelect = null;
                                angular.forEach(self.options.data, function (oData) {
                                    if (oData.CD_G === selectCdg) { oSelect = oData; }
                                });

                                //$timeout(function () {
                                    self.gridApi.selection.selectRow(oSelect);
                                //}, 50);
                            }
                        });
                };

                /**
                 * 권한코드 추가시 default parameter
                 */
                authMngVO.makeGridEntity = function () {
                    return {
                        STATE  : "I",
                        CD_G   : "",
                        NM_G   : "",
                        YN_USE : "Y",
                        DTS_UPDATE : ""
                    };
                };

                /**
                 * 등록, 수정, 삭제를 위한 parameter를 생성한다.
                 */
                authMngVO.makeGetParam = function () {
                    var searchNm = this.searchNm,
                        getParam = null;

                    if (searchNm !== "") {
                        getParam = {
                            NM_G : searchNm
                        };
                    }

                    return getParam;
                };

                /**
                 * 등록, 수정, 삭제를 위한 parameter를 생성한다.
                 */
                authMngVO.makePostParam = function ( data ) {
                    var postParam = {
                        STATE	: data.STATE,
                        NM_G	: data.NM_G,
                        YN_USE	: data.YN_USE
                    };

                    if ( data.STATE==="U" || data.STATE==="D" ) {
                        postParam.CD_G = data.CD_G;
                    }

                    return postParam;
                };


                /**
                 * 권한코드를 추가한다.
                 */
                authMngVO.add = function () {
                    var self = this,
	                    data;

	                data = self.makeGridEntity();

                    self.options.data.push(data);


                    SyAuthSvc
                        .saveAuth([
                            { NM_G: " ", YN_USE: "Y", STATE: "I" }
                        ])
                        .then(function (result) {
                            self.select.CD_G = result.data.CD_G;
                    
                            data.STATE  = "U";
                            data.CD_G   = result.data.CD_G;

                            self.gridApi.cellNav.scrollToFocus(data, self.options.columnDefs[1]);
                            self.select.CD_G = data.CD_G;
                            self.select.NM_G = data.NM_G;
                            self.gridApi.selection.selectRow(data);
                            
                            $scope.$broadcast("authMng.menu:inquiry", self.select);
                        });
                };

                /**
                 * 권한코드를 삭제한다.
                 */
                authMngVO.delete = function () {
                    var self = this,
                        data = self.options.data,
                        selectedList = self.gridApi.selection.getSelectedRows(),

                        i, leng, j, leng2;

                    if ( selectedList.length === 0 ) {
                        alert( "삭제할 데이터를 선택해주세요." );
                        return;
                    }

                    for ( i=0, leng=data.length; i<leng; i+=1 ) {
                        for ( j=0, leng2=selectedList.length; j<leng2; j+=1 ) {
                            if ( data[i] === selectedList[j] ) {
                                data.splice( i, 1 );
                                if ( selectedList[j].CD_G && selectedList[j].CD_G!=="" ) {
                                    selectedList[j].STATE = "D";
                                    self.deleteData.push( self.makePostParam( selectedList[j] ) );
                                }
                            }
                        }
                    }
                };

                /**
                 * 권한코드를 저장한다.
                 */
                authMngVO.save = function () {
                    if (confirm("저장시 변경된 데이터는 복구 불가능합니다.")) {
                        if (confirm("저장하시겠습니까?")) {
                            var self = this,
                                data = self.options.data,
                                deleteData = self.deleteData,
                                postData   = [];

                            angular.forEach( data, function ( oData ) {
                                if ( oData.STATE==="U" || oData.STATE==="I" ) {
                                    postData.push( self.makePostParam( oData ) );
                                }
                            });

                            postData = postData.concat( deleteData );
                            
                            
                            if (!self.isValid(postData)) {
                                alert("유효하지않은 데이터입니다.");
                                return;
                            }
                            
                            if (postData.length > 0) {
                                $scope.$emit("event:autoLoader", false);
                                SyAuthSvc.saveAuth(postData)
                                    .then(function (result) {
                                        self.deleteData = [];
                                        //self.select.CD_G = result.data.CD_G;
                                        self.select.CD_G = "";
                                        self.select.NM_G = "";


                                        $scope.$broadcast("authMng.menu:save", postData);
                                    });

                            } else {
                                $scope.$broadcast("authMng.menu:save", postData);
                            }

                        }
                    }

                };

                /**
                 * 권한 row 클릭시 메뉴권한을 가져온다.
                 * @param row
                 */
                authMngVO.rowClick = function (row) {
                    this.select.CD_G = row.entity.CD_G;
                    this.select.NM_G = row.entity.NM_G;
                    
                    if (row.isSelected) {
                        $scope.$broadcast("authMng.menu:inquiry", this.select);
                    }
                };
                
                authMngVO.isValid = function(datas) {
                    var valid = true;
                    
                    angular.forEach(datas, function(d) {
                        if (d.STATE !== "D" && !d.NM_G.trim()) {
                            valid = false;
                        }
                    });
                    
                    return valid;
                };

                authMngVO.initLoad();
            }]);
}());