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
define(["sap/designstudio/sdk/component"], function(Component) {
	Component.subclass("org.scn.community.utils.FlowLayouter", function(){
		this.init = function() {
			if(sap && sap.zen && sap.zen.designmode) {
				this.$().css("background-color", "rgba(0,64,128,0.5)");
				this.$().html("This area represents Flow Layouter size.  This message is hidden at runtime.")
			}else{
				this.$().css("display", "none");
			}
		};
	});
});