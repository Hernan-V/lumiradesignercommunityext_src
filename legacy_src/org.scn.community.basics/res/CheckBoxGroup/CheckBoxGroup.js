/**
 * Copyright 2014 Scn Community Contributors
 * 
 * Original Source Code Location:
 *  https://github.com/org-scn-design-studio-community/sdkpackage/
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 *  
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License. 
 */
 
//%DEFINE-START%
var scn_pkg="org.scn.community.";if(sap.firefly!=undefined){scn_pkg=scn_pkg.replace(".","_");}
define([
	"sap/designstudio/sdk/component",
	"./CheckBoxGroupSpec",
	"../../../"+scn_pkg+"shared/modules/component.core",
	"../../../"+scn_pkg+"shared/modules/component.basics"
	
	],
	function(
		Component,
		spec,
		core,
		basics
	) {
//%DEFINE-END%

var myComponentData = spec;

CheckBoxGroup = {

	renderer: {},
	
	initDesignStudio: function() {
		var that = this;

		org_scn_community_basics.fillDummyDataInit(that, that.initAsync);		
	},
	
	initAsync: function (owner) {
		var that = owner;

		if(that._lLayout == undefined) {
			org_scn_community_component_Core(that, myComponentData);
			/* COMPONENT SPECIFIC CODE - START(initDesignStudio)*/
			that.addStyleClass("scn-pack-CheckBoxGroup");

			var selectedLayout = that.getSelLayout();
			if(selectedLayout == undefined) {
				selectedLayout = "VerticalLayout";
			}
			that._usedLayout = selectedLayout;
			that._lLayout = new sap.ui.layout[selectedLayout]({
				
			});
			/* COMPONENT SPECIFIC CODE - END(initDesignStudio)*/
			
			that.onAfterRendering = function () {
				org_scn_community_basics.resizeContentAbsoluteLayout(that, that._lLayout, that.onResize);
			}
		}
	},
	
	afterDesignStudioUpdate: function() {
		var that = this;
		
		org_scn_community_basics.fillDummyData(that, that.processData, that.afterPrepare);
	},
	
	/* COMPONENT SPECIFIC CODE - START METHODS*/
	processData: function (flatData, afterPrepare, owner) {
		var that = owner;

		that.initAsync(owner);
		
		// processing on data
		that.afterPrepare(that);
	},

	afterPrepare: function (owner) {
		var that = owner;

		var selectedLayout = that.getSelLayout();
		if(selectedLayout == undefined) {
			selectedLayout = "VerticalLayout";
		}
		if(that._usedLayout != selectedLayout) {
			that._usedLayout = selectedLayout;
			
			if(that._lLayout != undefined) {
				that._lLayout.destroyContent();
				that._cummulatedContent = [];
				
				that._lLayout.destroy();
				that._oContentPlaced = false;
				that.destroyContent();
			}
			
			that._lLayout = new sap.ui.layout[selectedLayout]({
				
			});
			/* COMPONENT SPECIFIC CODE - END(initDesignStudio)*/
			
			that.onAfterRendering = function () {
				org_scn_community_basics.resizeContentAbsoluteLayout(that, that._lLayout, that.onResize);
			}
		}

		// visualization on processed data
		var lElementsToRender = that.getElements();
		if(lElementsToRender != null && lElementsToRender != undefined && lElementsToRender != "") {
			var lElementsToRenderArray = JSON.parse(lElementsToRender);

			// Destroy old content
			that._lLayout.destroyContent();
			that._cummulatedContent = [];
			
			// distribute content
			for (var i = 0; i < lElementsToRenderArray.length; i++) {
				var element = lElementsToRenderArray[i];
				var lImageElement = that.createCheckBoxElement(owner, i, element.key, element.text, element.url, element.selected);
				that._lLayout.addContent(lImageElement);
				that._cummulatedContent.push(lImageElement);
			}
		}
	},
	
	onResize: function(width, height, parent) {
		var that = parent;
		
		var isVertical = that._usedLayout != "HorizontalLayout";
		var maxDirection = (that._usedLayout == "HorizontalLayout" ? width : height);
		var maxInLine = maxDirection / (that._usedLayout == "HorizontalLayout" ? 225 : 30);

		var curLine = 0;
		var curRow = 0;

		// in case special resize code is required
		for(var layContentI in that._cummulatedContent) {
			if(isVertical) {
				that._cummulatedContent[layContentI].setWidth(width + "px");	
			}

			curLine++;
		}
	},
	
	createCheckBoxElement: function (owner, index, iKey, iText, iImageUrl, selected) {
		var that = owner;
		
		if(iImageUrl == undefined) {iImageUrl = ""};
		
		// in case starts with http, keep as is 
		if(iImageUrl.indexOf("http") == 0) {
			// no nothing
		} else {
			// in case of repository, add the prefix from repository
			iImageUrl = org_scn_community_basics.getRepositoryImageUrlPrefix(that, that.getFallbackPicture(), iImageUrl, "CheckBoxGroup.png");
		}

		var pictureSize = that.getPictureSize();
		pictureSize = pictureSize.replace("Size_", "");
		
		var withPicture = that.getWithPicture();

		var height = "20px";
		var topImage = "5px";
		var topText = "1px";
		var leftText = "5px";
		if(sap.m) {
			height = "26px";
			topImage = "8px";
			leftText = "5px";
		}

		if(withPicture && pictureSize.indexOf("32") > -1) {
			// for 32px
			height = "40px";
			topText = "11px";
			leftText = "42px";
			if(sap.m) {
				height = "50px";
			}
		} else if(withPicture) {
			// for 16px
			leftText = "26px";
			topImage = "3px";
			if(sap.m) {
				topImage = "8px";
			}
		} 

		var cbWidth = that.getCheckboxWidth();
		
		var oLayout = new sap.zen.commons.layout.AbsoluteLayout ({
			width: cbWidth + "px",
			height: height
		});
		
		oLayout.addStyleClass("scn-pack-CheckBoxGroup-Layout");
		oLayout.internalKey = iKey;
		
		var oImage = new myComponentData.unified.Image ({
			src : iImageUrl,
			width : pictureSize,
			height : pictureSize,
			alt : iText,
			tooltip : iText,
		});

		if(withPicture) {
			oImage.addStyleClass("scn-pack-CheckBoxGroup-Picture");
			oImage.internalKey = iKey;
		
			oLayout.addContent(
					oImage,
					{left: "4px", top: topImage}
			);
		}

		var selectionEvent = function(oControlEvent) {

			var lElementsToRender = that.getElements();
			if(lElementsToRender != null && lElementsToRender != undefined && lElementsToRender != ""){
				var lElementsToRenderArray = JSON.parse(lElementsToRender);

				// distribute content
				for (var i = 0; i < lElementsToRenderArray.length; i++) {
					var element = lElementsToRenderArray[i];

					if(element.key == oLayout.internalKey) {
						element.selected = oCheckBox.getChecked ? oCheckBox.getChecked() : oCheckBox.getSelected();
						break;
					}
				}

				lElementsToRender = JSON.stringify(lElementsToRenderArray);
				that.setElements(lElementsToRender);
			}

			that.fireDesignStudioPropertiesChangedAndEvent(["elements"], "onSelectionChanged");
		};

		if(sap.m) {
			eventName = "select";
		}
		
		var oCheckBox = new myComponentData.unified.CheckBox({
			
		});

		if(oCheckBox.attachChange) {
			oCheckBox.attachChange(selectionEvent);
		} else {
			oCheckBox.attachSelect(selectionEvent);
		}
		
		oCheckBox.setText(iText);
		if(oCheckBox.setChecked) {
			oCheckBox.setChecked(selected);
		} else {
			oCheckBox.setSelected(selected);
		}
		
		oCheckBox.addStyleClass("scn-pack-CheckBoxGroup-CheckBox");
		
		oLayout.addContent(
				oCheckBox,
				{left: leftText, top: topText}
		);
		
		if(withPicture) {
			if(selected) {
				oLayout.addStyleClass("scn-pack-CheckBoxGroup-SelectedValue");
			}
		}
		
		var requestForPicture = new XMLHttpRequest();
		
		requestForPicture.onreadystatechange = function() {
			// check status and react
			if (requestForPicture.readyState == 4){
				var imageToLoad = undefined;
				
				// sometimes it gets 200 without content
				if(requestForPicture.status == 404 || requestForPicture.responseUrl == "" || requestForPicture.response == "") {
					imageToLoad = that.getFallbackPicture();
				} else {
					imageToLoad = iImageUrl;
				};
				
				oImage.setSrc(imageToLoad);
			};
		};
		
		// just a check if there is some picture at all
		if(withPicture && iImageUrl != "") {
			requestForPicture.open("GET", iImageUrl, true);
			requestForPicture.send();
		} else {
			imageToLoad = that.getFallbackPicture();
			oImage.setSrc(imageToLoad);
		}
		
		return oLayout;
	},
	/* COMPONENT SPECIFIC CODE - END METHODS*/
};

myComponentData.unifiedContext = "sap.ui.commons";
myComponentData.unified = sap.ui.commons;
if(sap.m != undefined) { myComponentData.unifiedContext = "sap.m"; myComponentData.unified = sap.m; }

//%INIT-START%
myComponentData.instance = CheckBoxGroup;
jQuery.sap.require("sap.zen.commons.layout.AbsoluteLayout");
sap.zen.commons.layout.AbsoluteLayout.extend(myComponentData.fullComponentName, myComponentData.instance);
});