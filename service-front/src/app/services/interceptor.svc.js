(function () {
	"use strict";

	/**
	 * @ngdoc function
	 * @name edtApp.common.service:InterceptorSvc
	 */
	angular.module("edtApp.common.service")
		.factory("InterceptorSvc", ["$rootScope", "$q", "$location", function ($rootScope, $q, $location) {
			var	reqsTotal 		= 0,	// total request count
				reqsComplated 	= 0;	// total response count

			function init() {// 초기화
				reqsTotal 		= 0;
				reqsComplated 	= 0;
				$rootScope.$emit("event:loading", false);
				if (!$rootScope.webApp.loader.auto) {
					$rootScope.webApp.loader.auto = true;
				}
			}

			return {
				request: function (config) {
					reqsTotal++;

					if ($rootScope.webApp.loader.auto) {
						$rootScope.$emit("event:loading", true);
					}

					return config;
				},
				response: function (config) {
					reqsComplated++;

					if ($rootScope.webApp.loader.auto) {
						if (reqsComplated >= reqsTotal) {
							init();
						}
					} else {
						if (reqsComplated >= reqsTotal) {
							init();
						}
					}

					return config;
				},
				responseError: function (config) {
					var defer   = $q.defer(),
						msg     = '',
						replaceUrl, search;

					reqsComplated++;

					switch (config.status) {
						case 400:// 로그인 실패
							alert('아이디와 패스워드를 다시 확인해주세요.');
							defer.reject(config);
							break;
						case 401:// 로그인 상태가 아닐경우
							if ($location.$$path !== '/login') {
								alert('[' + config.status + '] 로그인 상태가 아닙니다.');
								init();
								$location.url('/login');
								defer.reject(config);
							}
							defer.resolve(config);

							break;
						case 403:// 권한없음
							alert('권한이 없습니다.');
							search = $location.search();

							if (search.menu) {
								replaceUrl = $location.$$path.replace('/list', '');
								$rootScope.$emit('event:setMenuId', replaceUrl);
							} else {
								if (edt.hasValue($location.$$path, '/detail')) {
									replaceUrl = $location.$$path.replace('/detail', '');
									$rootScope.$emit('event:setMenuId', replaceUrl);
								}
							}

							defer.reject(config);
							break;
						case 404:// 페이지 없음
							defer.reject(config);
							break;
						case 412:// 조회/등록/수정 실패시
							msg = angular.isString(config.data) ? config.data : config.data.msg;
							alert('['+ config.status +'] '+ msg);
							defer.reject(config);
							break;
						case 415:// 파일오류
							defer.resolve(config);
							break;
						case 422:// json, 정규식 에러
							msg = angular.isString(config.data) ? config.data : config.data.msg;
							alert('['+ config.status +'] '+ msg);
							defer.reject(config);
							break;
						default:
							if (config.statusText !== '') {
								msg += config.statusText +'\n';
							}

							if (reqsTotal > 0) {
								alert(msg += 'System에 장애가 발생하였습니다. \n잠시 후에 다시 시도해주세요.');
								init();
							}

							defer.reject(config);
							break;
					}

					if (reqsComplated >= reqsTotal) {
						init();
					}

					return defer.promise;
				}
			};
		}]);
}());