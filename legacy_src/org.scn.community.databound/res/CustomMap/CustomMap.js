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
	"./CustomMapSpec",
	"../../../"+scn_pkg+"shared/modules/component.core",
	"../../../"+scn_pkg+"shared/modules/component.basics",
	"../../../"+scn_pkg+"shared/modules/component.databound",
	"../../../"+scn_pkg+"databound/os/jquery.imagemapster/jquery.imagemapster",
	"../../../"+scn_pkg+"databound/os/d3v3/d3.min",
	"../../../"+scn_pkg+"shared/os/jsrender/jsrender"
	],
	function(
		Component,
		spec,
		core,
		basics
	) {
//%DEFINE-END%

var myComponentData = spec;

var CSS_CLASS_DIV 		= "scn-sdk-CustomMap";
var CSS_CLASS_LOADING 	= "scn-sdk-CustomMap-LoadingPane";
var CSS_CLASS_IMG 		= "scn-sdk-CustomMap-Image";

CustomMap = function () {

	var that 					= this;
	
	var _redrawStatus 			= false;
	var _firstRun	 			= true;
	
	var _mapsterCurrW 			= 0;
	var _mapsterCurrH 			= 0;
	
	var _attributeBeforeUpdate 	= {};
	
	var _selectedAreasArray 	= [];
	var _selectedAreasString 	= "";
	var _highlightedArea 			= "";
	
	var _dataUpdated 			= false;
	var _referenceKFUpdated 	= false;
	var _processData			= false;
	
	var _mapsterJson 			= {};
	
	var dataForTmpl 			= [];
		
	that.init = function() {
		// define root component
		
		that.specComp.supportsFlatData = true;
		
		org_scn_community_basics.fillDummyDataInit(that, that.initAsync);
		
		that._firstRun = true;
		that._redrawStatus = false;
		that._selectedAreasArray = [];
		that._selectedAreasString = "";
		that._highlightedArea = "";
		
		that._mapsterCurrW = 0;
		that._mapsterCurrH = 0;
		
		that._mapsterJson = {};
		
		//Override Data and DataCellList get/set function with custom made to catch updates
		that._originalDataFunction = that.data;
		that.data = function(value) {
			that._originalDataFunction(value);
			if (typeof value != "undefined")
				that._dataUpdated = true;
		}
		
		that._originalDataCellListFunction = that.dataCellList;
		that.dataCellList = function(value) {
			that._originalDataCellListFunction(value);
			if (typeof value != "undefined")
				that._referenceKFUpdated = true;
		}
		
		//zen/mimes/CM5/
	};
	
	that.initAsync = function (owner) {
		var that = owner;
		org_scn_community_component_Core(that, myComponentData);

		/* COMPONENT SPECIFIC CODE - START(initDesignStudio)*/
		that.$().addClass(CSS_CLASS_DIV);
		
			
		/* COMPONENT SPECIFIC CODE - END(initDesignStudio)*/
	};
	
	/**
	 * Relays Data Source Metadata over to Additional Properties Sheet.
	 */
	that.getAPSMetaData = function(){
		try{
			return JSON.stringify({
    			msg : "Success",
    			data : that.data()
    		});	
		}catch(e){
			var errMsg = "Component error in getAPSMetaData:\n\n" + e;
    		return JSON.stringify({
    			msg : errMsg,
    			data : {}
    		})
			alert(errMsg);
		}
	};
	
	/**
	 * Relays Flattened Data to Additional Properties Sheet.
	 */
	that.getAPSFlatData = function(){
		try{
			return JSON.stringify({
    			msg : "Success",
    			data : that.flatData
    		});
    	}catch(e){
    		var errMsg = "Problem returning flattened data to APS.\n\n" + e;
    		return JSON.stringify({
    			msg : errMsg,
    			data : {}
    		})
			alert(errMsg);
		}
	};

	that.areaSelected = function(e) {
		var itemIndex = that._selectedAreasArray.indexOf(e.key);
		if (itemIndex == -1) {
			//Newly selected
			that._selectedAreasArray.push(e.key);
		} else {
			//Deselected
			that._selectedAreasArray.splice(itemIndex, 1); 
		}
		
		that._selectedAreasString = "";
		for (var i in that._selectedAreasArray) {
			var sep = "";
			if (i > 0)
				sep = ",";
			that._selectedAreasString = that._selectedAreasString + sep + that._selectedAreasArray[i];
		}
		var changedProperties = ["selectedAreas"];
		that.setSelectedAreas(that._selectedAreasString);
		that.firePropertiesChangedAndEvent(changedProperties, "onClick");
	};
	
	that.handleMouseMovement = function(data, action) {
		var changedProp = ["highlightedArea"];
		
		switch(action) {
			case "onMouseOut": {
				that._highlightedArea = ""
					break;
			}
			case "onMouseOver":
				that._highlightedArea = data.key;
				break;
			default:
				return;
		}
		that.sethighlightedArea(that._highlightedArea);
		that.firePropertiesChangedAndEvent(changedProp, action);
	};
	
	that.maspterMouseOver = function(data) {
		that.handleMouseMovement(data, "onMouseOver" );
	};
	
	that.maspterMouseOut = function(data) {
		that.handleMouseMovement(data, "onMouseOut" );
	};
	
	that.splitText = function(dimensionKeyText) {
		var dimkeySplit = dimensionKeyText.split(" | ");
		var result = {
				key: "",
				text:""
		};
		
		if (dimkeySplit.length > 1) {
			result.key 		= dimkeySplit[0];
			result.text 	= dimkeySplit[1];
		} else {
			result.key 		= dimensionKeyText;
		}
		
		return result;
	};
	
	that.processData = function (flatData, afterPrepare, owner) {
		var that = owner;
		
		if(flatData == undefined) {
			var options = org_scn_community_databound.initializeOptions();
			options.ignoreResults = false;

			flatData = org_scn_community_databound.flatten(that.getData(),options);
			org_scn_community_databound.toRowTable(flatData, options);
		}
		
		
		this.flatData = flatData;
		that.flatData = flatData;
		//.key or .text
		if (flatData.dimensionRows.length > 0) {
			
			//Main dimension, the first one. The others will be added as a table
			var rowMeta = flatData.dimensionRows[0];
			
			//columnHeaders contains text of KF
			//columnHeadersKeys contains keys of KF
			
			that.dataForTmpl	= {};
			
			var lastDimKey 		= "";
			var dimAttributes 	= {};
			
			var dimKeyExemple 	= "";
			
			//Populate attributes tables with internal key as table key
			for(var iDim in flatData.dimensionRows) {
				var dim = flatData.dimensionRows[iDim];
				
				if (dim.dimension.hasOwnProperty("attributes")) {
					//Loop at each member to find the correct dim
					
					//Name of the IO
					dimAttributes[dim.key] = {};
					for (var index_dim in dim.dimension.members) {

						//Ignore totals
						if (dim.dimension.members[index_dim].key == "SUMME") {
							continue;
						}
						
						var attributes = dim.dimension.members[index_dim].attributeMembers;
						
						dimAttributes[dim.key][dim.dimension.members[index_dim].key] = {};
						var attrContent = dimAttributes[dim.key][dim.dimension.members[index_dim].key];
						
						console.log(dim.key + " / " + dim.dimension.members[index_dim].key);
						
						for(var iAttr in attributes) { 
							attrContent[dim.dimension.attributes[iAttr].key + "_KEY"] 	= attributes[iAttr].key;
							attrContent[dim.dimension.attributes[iAttr].key + "_TEXT"] 	= attributes[iAttr].text;
						}
					}
				}
			}
			
			//Loop at data2D and build template data
			var data2DStructure 		= {};
			//data2DStructure.total 		= [];
			//var data2DCopy 		= flatData.data2D.slice();
			
			sap.common.globalization.NumericFormatManager.setPVL(that.data.locale);
			
			for (var i in rowMeta.dimension.members) {
				//loop at each members of the first Dim, and populate its data
				var member 						= rowMeta.dimension.members[i];
				
				var tableKey 					= member.key;
				data2DStructure[tableKey] 		= {};
				
				if (dimKeyExemple == "") {
					dimKeyExemple = member.key;
				}
				
				//Build corresponding detailed lines
				data2DStructure[tableKey].lines = [];
				
				if (dimAttributes)
					if (dimAttributes[rowMeta.key])
						if (dimAttributes[rowMeta.key][member.key])
							data2DStructure[tableKey].attributes = dimAttributes[rowMeta.key][member.key];
				
				
				var dimKeyText = that.splitText(member.text);
				
				data2DStructure[tableKey]["DIM_" + rowMeta.key + "_INTERNAL_KEY"] 	= member.key;
				data2DStructure[tableKey]["DIM_" + rowMeta.key + "_KEY"] 			= dimKeyText.key;
				data2DStructure[tableKey]["DIM_" + rowMeta.key + "_TEXT"] 			= dimKeyText.text; //empty if only key or text
				
				var hasSum = false;
				
				for(var j in flatData.data2D) {
					
					if (member.key != flatData.data2D[j].raw[0]) {
						continue;
					}
					
					var lineID = data2DStructure[tableKey].lines.length;
					data2DStructure[tableKey].lines[lineID] = {};
					
					that.transformDataToTemplate(j, data2DStructure[tableKey].lines[lineID], flatData, true, true);
					
					//Get the total of the lines to put on the main char
					if (flatData.dimensionRows.length > 1 && ( 
							flatData.data2D[j].raw[1] == "RESULT" ||
							flatData.data2D[j].raw[1] == "SUMME" )
							) {
				
						that.transformDataToTemplate(j, data2DStructure[tableKey], flatData, false, true);
						hasSum = true;
						
					}
					
				}
				
				if (member.key == "RESULT" || member.key == "SUMME") {
					data2DStructure["RESULT"] = {};
					that.transformDataToTemplate(j, data2DStructure["RESULT"], flatData, true, true);
				}
			}
			
			that.dataForTmpl = data2DStructure;
			
			that.setDataExemple(JSON.stringify(that.getAreaDataFromDatasource(dimKeyExemple)));
		}
	};
	
	that.transformDataToTemplate = function(pIndex, pResult, pFlatData, pGenDim, pGenKF) {
		//Dimensions
		if (pGenDim) {
			for(var i in pFlatData.rowHeadersKeys2D[pIndex]) {
				pResult["DIM_" + pFlatData.dimensionHeadersKeys[i] + "_INTERNAL_KEY"] 	= pFlatData.rowHeadersKeys2D[pIndex][i];
				var keyText = that.splitText(pFlatData.rowHeaders2D[pIndex][i]);
				pResult["DIM_" + pFlatData.dimensionHeadersKeys[i] + "_KEY"] 			= keyText.key;
				pResult["DIM_" + pFlatData.dimensionHeadersKeys[i] + "_TEXT"] 			= keyText.text;
			}
		}
		
		
		//Keys figures
		if (pGenKF) {
			for(var i in pFlatData.columnHeadersKeys) {
				var formatedVal = pFlatData.formattedValues[pIndex][i];
				pResult["MES_" + pFlatData.columnHeadersKeys[i] + "_RAW"] 			= pFlatData.values[pIndex][i];
				pResult["MES_" + pFlatData.columnHeadersKeys[i] + "_FORMATED"] 		= formatedVal;
				//retrieve the unit from the formatted values. The different units are not stored in the table elsewhere ...
				pResult["MES_" + pFlatData.columnHeadersKeys[i] + "_UNIT"] 		    = formatedVal.split(" ").splice(-1)[0];
			}
		}

	}
	
	that.beforeUpdate = function() {
		that._redrawStatus = false;
		
		that.saveProperties();		
	};
	
	that.saveProperties = function () {
		that._attributeBeforeUpdate = {};
		for (var i in that.props) {
			switch(i) {
				case "data":
				case "dataCellList":
					continue;
			}
			that._attributeBeforeUpdate[i] = that.props[i].actualValue;
		}
		
		that._dataUpdated 			= false;
		that._referenceKFUpdated 	= false;
		that._processData 			= false;
	};
	
	that.checkNeedRedraw = function() {	
		
		if(that._firstRun) {
			that._firstRun 		= false;
			that._processData 	= true;
			return true;
		}
		
		for(var i in that._attributeBeforeUpdate) {
			switch(i) {
				case "highlightedArea":
				case "onMouseOut":
				case "onMouseOver":
				case "onMouseClick":
				case "onUpdate":
				case "selectedAreas":
					break;
				default: 
					that._redrawStatus = that.props[i].actualValue != that._attributeBeforeUpdate[i];
			}
			
			if (that._redrawStatus)
				break;
		}
		if (!that._redrawStatus) {
			that._redrawStatus 	= that._dataUpdated || that._referenceKFUpdated;
			that._processData 	= that._redrawStatus;
		}
		
		return that._redrawStatus;
	};
	
	that.afterPrepare = function() {
		
	}
	
	that.afterUpdate = function() {
		/* COMPONENT SPECIFIC CODE - START(afterDesignStudioUpdate)*/
		var that = this;
		
		console.log("after update");
		
		/* COMPONENT SPECIFIC CODE - START(afterDesignStudioUpdate)*/

		/* COMPONENT SPECIFIC CODE - START(afterDesignStudioUpdate)*/
		
		if (that.checkNeedRedraw()) {			
			if (that._processData && org_scn_community_databound.hasData(that.getData())) {
				org_scn_community_basics.fillDummyData(that, that.processData, function() {});
			}
				
			that.redraw();
		}
		
		//org_scn_community_basics.resizeContentAbsoluteLayout(that, that._canvas, that.onResize);
		//that._mapsterResize();
		
		org_scn_community_basics.resizeContentAbsoluteLayout(that, that.$()[0], that.onResize);
		
		//call resize
		if (that.getAutoResize())
			that.onResize(this.$().width(), this.$().height(), "");
	};
	
	that.compareForPalette = function(a,b) {
	 if (a.value < b.value)
		    return -1;
		  else if (a.value > b.value)
		    return 1;
		  else 
		    return 0;
	};
	
	
	that.redraw = function() {
		that.$().empty();
		
		//that._loadingPane = $("<div></div>");
		//that._loadingPane.attr("id","scn-custommap-loadingscreen");
		//that._loadingPane.addClass(CSS_CLASS_LOADING);
		
		//that.$().append(that._loadingPane);
		
		//Destroy old tooltips not linked to the new Mapster context
		var tooltips = $(".mapster_tooltip").remove();
		
		//if (that.getAutoResize()) {
		//	that.$().removeClass();
		//} else 
		//	that.$().addClass(CSS_CLASS_DIV);
		
		//Build image
		var image = that.getImage();
		if(image === "undefined" || image == "") {
			that.$().append($("<p>Please select an image</p>"));
			return;
		}
		
		that._image = $("<image id=\"myimage\" src=\"" + image + "\" usemap=\"#scn-CustomMap\"/>");
		var tmpImage = that._image[0];
		that.$().append(that._image);
		
		var map = that.getMap();
		that._map = $("<map name=\"scn-CustomMap\">" + map + "<map/>");
		that._map.children().each(function(index) {
			//loop at each area and add / Modify href
			$( this ).attr("href", "#");
		});
		
		that.$().append(that._map);
		
		that.buildPropMaster();

		that._image.mapster(that._mapsterJson)
		  .mapster('set',true,that._selectedAreasString)
		  ;
	};
	
	that.buildPropMaster = function() {
		that._mapsterJson = {};
		
		that._mapsterJson.fill 				= that.getEnableAreaFill();
		that._mapsterJson.fillColor 		= that.getAreaFillColor().replace('#','');
		that._mapsterJson.fillOpacity 		= that.getAreaFillOpacity();
		that._mapsterJson.singleSelect  	= that.getOnlySingleSelect();
		that._mapsterJson.isSelectable  	= that.getAreaSelectable();
		that._mapsterJson.isDeselectable 	= that.getAreaDeselectable();
		that._mapsterJson.stroke 			= that.getDisplayStroke();
		that._mapsterJson.strokeColor 		= that.getAreaStrokeColor().replace('#','');
		that._mapsterJson.strokeOpacity 	= that.getAreaStrokeOpacity();
		that._mapsterJson.strokeWidth 		= that.getAreaStrokeWidth();
		that._mapsterJson.showToolTip 		= that.getDisplayTooltip();
		that._mapsterJson.mapKey 			= that.getMapDataKey();
		
		that._mapsterJson.render_highlight = {};
		
		that._mapsterJson.render_highlight.fillColor 		= that.getHighlightFillColor().replace('#','');
		that._mapsterJson.render_highlight.fillOpacity 		= that.getHighlightFillOpacity();
		that._mapsterJson.render_highlight.strokeColor 		= that.getHighlightStrokeColor().replace('#','');
		that._mapsterJson.render_highlight.strokeOpacity 	= that.getHighlightStrokeOpacity();
		that._mapsterJson.render_highlight.strokeWidth 		= that.getHighlightStrokeWidth();
	
		that._mapsterJson.render_select = {};
		
		that._mapsterJson.render_select.fillColor 		= that.getSelectedFillColor().replace('#','');
		that._mapsterJson.render_select.fillOpacity 		= that.getSelectedFillOpacity();
		that._mapsterJson.render_select.strokeColor 		= that.getSelectedStrokeColor().replace('#','');
		that._mapsterJson.render_select.strokeOpacity 	= that.getSelectedStrokeOpacity();
		that._mapsterJson.render_select.strokeWidth 		= that.getSelectedStrokeWidth();
				
		that.updateAreasFromMap();
		that.updateTooltips();
		that.applyPalette();
		that.applyStaticDisplay();
		
		that._mapsterJson.onConfigured = function(success) {
			if (success) {
				that.fireEvent("onUpdate");
				//that._loadingPane.hide('slow');
			}
		};
		
		that._mapsterJson.onClick = function (e) {
			that.areaSelected(e);
		};
		
		if (that.getActivateOnMouseOverOut()) {
			that._mapsterJson.onMouseover = function (data) {
				that.maspterMouseOver(data);
			};
			
			that._mapsterJson.onMouseout = function (data) {
				that.maspterMouseOut(data);
			};
		}
	};
	
	that.updateAreasFromMap = function() {
		//if (that.getGenerateAreasFromMap() && that.getMapDataKey() != "") {
			
			//var oldAreas = that._mapsterJson.areas;
			//overwrite areas prop in JSON
			that._mapsterJson.areas = [];
			
			//Get specific properties of the different areas
			var specProps = JSON.parse(that.getAreaProperties());
			
			//Loop at the map from HTML and extract the key
			
			that._map.children().each(function () {
				var currentArea = $(this);

			    if (currentArea.attr(that.getMapDataKey())) {
			    	
			    	var areaKey = currentArea.attr(that.getMapDataKey());
			    	
			    	var curProp = {
			    			key: areaKey
		    		};
			    		
			    	var specProp = that.findAreaProperty(specProps,"key",areaKey);
			    	
			    	if (specProp != null) {
			    		//update specific prop
			    		for (var propKey in specProp) {
			    			switch(propKey) {
			    				default:{
			    					if (specProp[propKey] != "") {
					    				curProp[propKey] = specProp[propKey];
					    			}
			    					break;
			    				}
			    				case "key":
			    				case "leaf":
			    				case "parentKey":
			    					continue;
			    			}
			    		}
			    	}
			    	that._mapsterJson.areas.push(curProp);
			    	//}
			    }
			});
		//}
	};
	
	that.findAreaProperty = function(jsonObject, searchKey, searchValue) {
	    for (var i in jsonObject) {
	        if (!jsonObject[i].hasOwnProperty(searchKey)) continue;
	        if (jsonObject[i][searchKey] == searchValue) {
	            return jsonObject[i];
	        }
	    }
	    return null;
	}
	
	that.applyStaticDisplay = function() {
		if (that.getStaticDisplay()) {
			that._mapsterJson.staticState = true;
			
			for(var i in that._mapsterJson.areas) {
				that._mapsterJson.areas[i].staticState = true;
			}
		}
	}
	
	that.applyPalette = function() {
		
		if (!that.getEnableDynamicColors())
			return;
		
		var options = org_scn_community_databound.initializeOptions();
		var metaData = that.getDSMetadata;
		var maxDataInfo = org_scn_community_databound.getTopBottomElements(that.getDataCellList(),that.getDataCellList(), options);
			
		//Loop at array and calculate according
		
		var scale = d3.scale.quantile()
							.domain([maxDataInfo.minValue, maxDataInfo.maxValue])
							.range(that.getDynamicColorPalette().split(','));
		
		for(var i in that._mapsterJson.areas) {
			
			var area = that._mapsterJson.areas[i];
			
			var color = "";
			for(var j in maxDataInfo.list) {
				if (maxDataInfo.list[j].key == area.key)
					area.fillColor = scale(maxDataInfo.list[j].value).substr(1);
			}
		}
	}
	
	that.updateTooltips = function() {
		
		//allow JS code in JSRender
		$.views.settings.allowCode(true); 
		
		if(that.getTooltipMode() != "Default" && that.getDisplayTooltip()) {
			//Loop on mapster data, if tooltip: override.
			
			var tmpl = "";
			
			if (that.getTooltipMode() == "override") {
				tmpl = $.templates(that.getContentTooltip());
			}
			 
			for(var i in that._mapsterJson.areas) {
				
				var area = that._mapsterJson.areas[i];
				
				if (that.getTooltipMode() == "keep+template" && area.hasOwnProperty("toolTip")) {
					//else
					tmpl = $.templates(area.toolTip);
				} 
				
				var dataSelection = that.getAreaDataFromDatasource(area.key);
				
				//avoid JS errors
				try {
					area.toolTip = tmpl.render(dataSelection);
				} catch (e) {
					area.toolTip = "Error rendering the template:<br>" + tmpl;
				}
				
			}
		}
	}
	
	that.getAreaDataFromDatasource = function(areaKey) {
		var dataSelection = {};
		
		if (that.dataForTmpl.hasOwnProperty(areaKey)) {
			dataSelection = that.dataForTmpl[areaKey];
			if (that.dataForTmpl.hasOwnProperty("SUMME")) {
				dataSelection.total = that.dataForTmpl["SUMME"];
			} else if (that.dataForTmpl.hasOwnProperty("RESULT")) {
				dataSelection.total = that.dataForTmpl["RESULT"];
			}
		}
		
		return dataSelection;
	}

	that.onResize = function (width, height, parent) {
		if (!that.getAutoResize())
			return;
		
		if (!that.getImage()) {
			return;
		}
		//avoid errors in resizing, happens on Chrome in local mode 
		if (width <= 0 || height <= 0) {
			return;
		}
		
		var ratio = Math.min(width / that._image.width(), height / that._image.height());

		that._mapsterCurrW = that._image.width()*ratio;
		that._mapsterCurrH = that._image.height()*ratio;
		
		that._image.mapster('resize', that._mapsterCurrW, that._mapsterCurrH, that.getResizeDuration());
	};

	/* COMPONENT SPECIFIC CODE - END METHODS*/

	// called from Additional Properties Sheet JavaScript file

	org_scn_community_component_Core(that, myComponentData);
	
	return that;
};
//%INIT-START%
myComponentData.instance = CustomMap;
Component.subclass(myComponentData.fullComponentName, myComponentData.instance);


});