/*!
 * Copyright 2013 Justinmind. All rights reserved.
 */

(function(window, undefined) {
    /*********************** START LOCAL METHOD DEFINITION ************************/

    var regexp = /m\-[a-z0-9]+\-([a-zA-Z0-9_\-]+)/;
    
    function highLightElements(elements, shape_elements, fired) {
    	var zoom = jimUtil.getZoom() * (1/jimUtil.getDivZoom());
		
		var rects = [];
		if (elements.length > 0 && fired) $(document.body).addClass("highlightTransition");
		for (var i = 0; i < elements.length + shape_elements.length; ++i) {
			//Obtain info about the element
			var el;
			var shape = false;
			if (i < elements.length) el = $(elements[i]);
			else {
				el = selectShapeWrapper(shape_elements[i - elements.length]);	
				shape = true;
			}
			
			//Item is a masterinstance
			if (el.hasClass("master")) {
			  var masterinstance = el.closest(".masterinstance");
			  if (masterinstance.length > 0) el = masterinstance;
			}
			
			if (isScenarioFiltered(el)) {
				var bb = el[0].getBoundingClientRect();
				var absolutePos = $(el).css("position") == "absolute";
				
				//Create element that contains the rectangle
				var newElement = $('<div />', {"class": 'highlightEffect'})
				newElement.css({"position": "absolute", "width": bb.width*zoom, "height": bb.height*zoom});
				newElement.bind('click', function() {event.stopPropagation();});
				if (absolutePos) newElement.css({"top": $(el).css("top"), "left": $(el).css("left")});
				
				//Create the wrapper if the element is not a cell
				if ($(el).is("td") || $(el).is("tr")) $(el).append(newElement);
				else {
					var $parent = $(el).parent();
					if ($parent.is("td.layout.vertical"))
						$parent.prepend(newElement);
					else if ($parent.is("td.layout.horizontal")) {
						if ($(el).index() == 0)
							$(el).after(newElement);
						else $(el).before(newElement);
					} else $parent.append(newElement);
				}
				
				fixRectanglePosition($(el), newElement, zoom, shape);
				if (jimUtil.getAdditiveRotationDegrees($(el)) == 0)
					shrinkElementByMargin($(el), newElement);
				rects.push(newElement);
			}
		}
		
		//Animate the rectangle and restore the initial state
		if (rects.length == 0 && fired) $(document.body).removeClass("highlightTransition");
		else {
		  rects = $(rects).map (function () {return this.toArray(); } );	
		  
		  rects.css("opacity", 0);
		  rects.animate({opacity: 1}, 500, function() {	
			  rects.animate({ opacity: 0 }, 500, function() {
				  rects.remove();
			  	  if (fired) $(document.body).removeClass("highlightTransition");
	          });			
		  });
		}
    }
    
	function highLight(value, fired) {
		//Obtain elements to highlight
		var elements = jQuery("#simulation " + value)
		var shape_elements = elements.filter(function (index, element) {
												if (element.tagName == "path" || element.tagName == "ellipse") return true;
												return false;
											});
		
		elements = elements.not(':hidden').not('.shapewrapper, path, ellipse').filter(function(index,element) {return $(element).closest(".shapewrapper").length == 0;});
		
		highLightElements(elements, shape_elements, fired);
	}
	
	function endsWith(suffix) {
	    return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
	
	function isScenarioFiltered(el) {
		if (jimScenarios.currentNode != -1) {
			var canvas = el.closest(".template,.screen,.master");
			var canvasId = canvas.attr("id").substring(2);
			
			var links;
			if (canvas.hasClass("master")) links = jimLinks[canvasId][regexp.exec(el.attr("id"))[1]];
			else {
			  var canvasLinks = jimLinks[canvasId];
			  if (canvasLinks != undefined) {
				var id = el.attr("id");
				if (id.startsWith("shapewrapper"))
				  id = id.substring("shapewrapper-s-".length);
				else id = id.substring(2);

				links = canvasLinks[id];
			  } 
			  else links = [];
			} 
			
			if (links == undefined || links.length == 0) return true;
			else {
				var scenario = jimScenarios.activeScenario[jimScenarios.currentNode];
				if (scenario != undefined) {
					var scenarioLinks = scenario.links;		
					for (var i = 0; i < scenarioLinks.length; ++i) {
						var scenarioScreen = jimScenarios.activeScenario[scenarioLinks[i]];
						if (scenarioScreen != undefined) scenarioScreen = scenarioScreen.screenId;
						
						for (var j = 0; j < links.length; ++j)
							if (scenarioScreen == links[j]) return true;
					}
				}
			}
			
			return false;
		}
		return true;
	}
	
	//Given a shape returns the shapewrapper div
	function selectShapeWrapper(el) {
		while (!$(el).hasClass("shapewrapper") && el.tagName != "BODY") 
			el = $(el).parent();
		
		return el;
	}
	
	//This function fixes any difference between the highlight rectangle and the element positions.
	function fixRectanglePosition(el, rect, zoom, shape) {
		var rpos = rect.offset();
		var epos = el.offset();
		var panel = (el.hasClass('panel'));
		var angle = (panel) ? getRotationDegrees(el.parent().parent()) : getRotationDegrees(el);
		var addAngle = jimUtil.getAdditiveRotationDegrees(el);
		
		if (addAngle == 0) {
			if (rpos.left != epos.left) rect.css({"left": parseInt(rect.css("left")) + (epos.left - rpos.left)*zoom});
			if (rpos.top != epos.top) rect.css({"top": parseInt(rect.css("top")) + (epos.top - rpos.top)*zoom});
		}
		else {
			//Special treatment for rotated elements
			var border = 4;
			var left = parseInt(el.css('left'));
			var top = parseInt(el.css('top'));

			if (!isNaN(left) && !isNaN(top)) rect.css({"left": left*zoom, "top": top*zoom});
			rect.css({ "width":parseInt(el.css('width')) - border, "height":parseInt(el.css('height'))-border});
			
			if(!(panel)) {				
				var margin = jimUtil.getItemMarginWidth(el);
				
				var ebb = el[0].getBoundingClientRect();
				var rbb = rect[0].getBoundingClientRect();
				left = (ebb.left + ebb.width / 2) - (rbb.left + rbb.width / 2);
				top = (ebb.top + ebb.height / 2) - (rbb.top + rbb.height / 2 );
				
				var trueCenterX = ebb.left + margin.left + (ebb.width - margin.left - margin.right)/2;
				var vectorToTrueCenterX = trueCenterX - (ebb.left + ebb.width / 2);				
				var trueCenterY = ebb.top + margin.top + (ebb.height - margin.top - margin.bottom)/2;
				var vectorToTrueCenterY = trueCenterY - (ebb.top + ebb.height / 2);
				
				var parentAngle = addAngle - angle;
				var tString = "rotate(" + -parentAngle + "deg)" +
							  "translate(" + left*zoom + "px," + top*zoom + "px)" +
							  "rotate(" + (parentAngle+angle) + "deg)" +
							  "translate(" + vectorToTrueCenterX*zoom + "px," + vectorToTrueCenterY*zoom + "px)";
				rect.css({ "-webkit-transform": tString, 
					   "-moz-transform": tString,
			           "transform": tString});
			} else {
				var margin = jimUtil.getItemMarginWidth(el);
				rect.css("left", parseInt(rect.css("left")) + margin.left);
				rect.css("top", parseInt(rect.css("top")) + margin.top);
			}
		}
	}
	
	function shrinkElementByMargin(el, rect) {
		var margin = jimUtil.getItemMarginWidth(el);
		rect.css("left", parseInt(rect.css("left")) + margin.left);
		rect.css("top", parseInt(rect.css("top")) + margin.top);
		rect.css("width", parseInt(rect.css("width")) - margin.left - margin.right);
		rect.css("height", parseInt(rect.css("height")) - margin.top - margin.bottom);
	}

    

    var jimHighlight = {
		"highLightAll" : function() {
			if (!$(document.body).hasClass("noHighlight") && 
					!$(document.body).hasClass("highlightTransition") && 
					!jQuery("#comments-switch-img").hasClass(commentOnClass) &&
					!jimDevelopers.isActive()) {
				var value = ".click, .toggle";
				highLight(value, true);
			}
		},
		"highlightElement" : function (element) {
		  if (!element.is(".shape"))
			highLightElements($(element), [],true);
		  else highLightElements([], $(element), true)
		}
    }
    
    function isInteractiveSrcElement(e) {
    	var el = (event.target || event.srcElement);
    	if (el != undefined) {
    		el = $(el).hasClass("backgroundLayer") ? $(el).parent()[0] : el;
    	  	var tag = el.tagName;
    	  	if (tag == "INPUT" || tag == "SELECT" || tag == "TEXTAREA" || $(el).hasClass("option") || $(el).hasClass("options") || $(el).hasClass("treeicon") || $(el).hasClass("radiobutton") || $(el).hasClass("checkbox")) return true;    	  	
    	}
    	
    	return false;
    }
      
	function hasFirerDataRow(e) {
		if (e.srcElement != undefined) {
			var dr = $(e.srcElement).closest("tr.datarow");
			if (dr != undefined && $(dr).hasClass("click")) return true;
		}
		return false;
	}
			  
	$('#simulation').bind('click', function (event, handled) {
		if ((handled == undefined || !handled) && !isInteractiveSrcElement(event) && !hasFirerDataRow(event)) {
			jimHighlight.highLightAll();
        }
	});

	window.jimHighlight = jimHighlight;
})(window);

