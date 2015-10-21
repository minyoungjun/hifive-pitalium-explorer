/*
 * Copyright (C) 2015 NS Solutions Corporation, All Rights Reserved.
 */

(function($) {

	var selectController = hifive.pitalium.explorer.controller.FileDiffSelectExecutionController;

	/**
	 * @class
	 * @memberOf hifive.pitalium.explorer.controller
	 * @name ImageListController
	 */
	var imageListController = {
		'__name': 'hifive.pitalium.explorer.controller.ImageListController',

		'_testResultDiffLogic': hifive.pitalium.explorer.logic.TestResultDiffLogic,

		'_mode': null,
		'_$tree': null,
		'_treeData': null,
		'_uploadImageList': null,

		'_enableSelectExecution': true,
		'_selectedExecution': null,

		'__ready': function() {
			this._mode = $(this.rootElement).hasClass('expected') ? 'expected' : 'actual';
			this._$tree = this.$find('.tree-root');

			this._init();
		},

		'_init': function() {
			this._uploadImageList = {
				'text': 'Uploaded images',
				'state': {
					'opened': true
				},
				'children': [],
				'a_attr': {
					'data-screenshot-type': 'directory'
				}
			};
			this._treeData = [this._uploadImageList];

			this._refreshTree();
		},

		'_refreshTree': function() {
			if (this._$tree.hasClass('jstree')) {
				this._$tree.jstree(true).destroy(true);
			}

			var data = this._treeData;
			this._$tree.jstree({
				'core': {
					'data': data
				}
			})
		},

		'mode': function() {
			return this._mode;
		},

		'addTemporaryFile': function(file) {
			this._uploadImageList.children.forEach(function(el) {
				if (el.state) {
					el.state.selected = false;
				}
			});
			this._uploadImageList.children.push({
				'text': file.fileName,
				'icon': false,
				'state': {
					'selected': true
				},
				'a_attr': {
					'class': 'screenshot',
					'data-screenshot-type': 'temporary',
					'data-screenshot-id': file.screenshotId
				}
			});
			this._refreshTree();
		},

		'.screenshot click': function(context, $el) {
			var screenshotId = $el.data('screenshotId');
			var mode = this._mode;
			this.trigger('screenshotSelect', {
				'screenshotId': screenshotId,
				'mode': mode
			});
		},

		'.btn-select-execution click': function() {
			if (!this._enableSelectExecution) {
				return;
			}

			var contents = h5.core.view.get('popupContents');
			selectController.setDefaultExecution(this._selectedExecution);
			var popup = h5.ui.popupManager.createPopup('execution', 'Select an execution',
					contents, selectController, {
						'draggable': true
					});

			popup.promise.done(this.own(this._triggerSelectExecution));
			popup.setContentsSize(500, 500);
			popup.show();
		},

		'disableSelectExecution': function() {
			this._enableSelectExecution = false;
			this.$find('.btn-select-execution').addClass('disabled');
		},

		'_triggerSelectExecution': function(screenshot) {
			if (!screenshot.execution) {
				return;
			}

			this._selectedExecution = screenshot.execution;
			this._updateExecutionTree();

			var mode = this._mode;
			this.trigger('selectExecution', {
				'screenshot': screenshot.execution,
				'mode': mode
			});
		},

		'_updateExecutionTree': function() {
			if (this._treeData.length == 1) {
				this._treeData.unshift({
					'text': 'Pitalium execution result',
					'state': {
						'opened': true
					},
					'children': [{
						'text': '',
						'state': {
							'opened': true
						},
						'children': [],
						'a_attr': {
							'data-screenshot-type': 'directory'
						}
					}],
					'a_attr': {
						'data-screenshot-type': 'directory'
					}
				});
			}

			this._treeData[0].children[0].text = this._selectedExecution.executionTime;
			this._treeData[0].children[0].children = [];

			this._refreshTree();

			this._testResultDiffLogic.listScreenshot(this._selectedExecution.executionId,
					this._selectedExecution.environmentId).done(
					this.own(this._updateExecutionTreeChildren));
		},

		'_updateExecutionTreeChildren': function(data) {
			for ( var className in data) {
				var methodTree = [];
				this._treeData[0].children[0].children.push({
					'text': className,
					'state': {
						'opened': false
					},
					'children': methodTree,
					'a_attr': {
						'data-screenshot-type': 'directory'
					}
				});

				var methods = data[className];
				for ( var methodName in methods) {
					var testTree = [];
					methodTree.push({
						'text': methodName,
						'state': {
							'opened': false
						},
						'children': testTree,
						'a_attr': {
							'data-screenshot-type': 'directory'
						}
					});

					var tests = methods[methodName];
					for (var i = 0; i < tests.length; i++) {
						var test = tests[i];
						testTree.push({
							'text': test.screenshotName,
							'icon': false,
							'a_attr': {
								'class': 'screenshot',
								'data-screenshot-type': 'execution',
								'data-screenshot-id': test.id
							}
						});
					}
				}
			}

			this._refreshTree();
		}
	};

	h5.core.expose(imageListController);
})(jQuery);