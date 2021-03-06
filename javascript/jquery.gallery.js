/**
* Gallery - A jQuery plugin
* Description: This plugin creates an animated, draggable gallery
* Author: Kellan Craddock
* Email: kellancraddock@gmail.com
*
* USEAGE
*
* Default:
* $('div').gallery();
*
* With params:
* $('div').gallery({items: 'li', itemsVisible: 3});
*
* Accessing the plugin after init
* $('div').data('gallery');
*
* Calling a method
* $('div').data('gallery').moveTo(5);
*
* Public Methods
* 
* $('div').data('gallery').autoRotate(param);
* The autoRotate method accepts a Boolean or String ('start' or 'stop').
* Will update the autoRotate setting for the gallery.
*/
//TO DO:
// Make a remove item method that removes an item based on a number passed in, then make a onRemoveItem callback



(function($) {
	//Create plugin obj
	$.fn.gallery = function(options) {
		return this.each(function(i) {
			$.fn.gallery.createInstance($(this), options);
		});
	}
	
	//Acuire an instance of the plugin
	$.fn.gallery.createInstance = function(element, options) {
		if (element.data('gallery')) {
			if (options != undefined) {
				element.data('gallery').options = $.extend(true, {}, element.data('gallery').options, options);
				element.data('gallery').init(element);
			}
			//Existing Instance
			return element;
		} else {
			//New Instance
			var instance = new $.fn.gallery.instance(element, options);
			element.data('gallery').init(element, options);
			return element;
		}
	}

	//Instance
	$.fn.gallery.instance = function(element, options) {
		var self = this;
		this.gallery;
		this.viewBoxWidth;
		this.galleryWrapper;
		this.paginationNav;
		
		//Defaults
		this.defaults = {
			defaultItem: 1, //The starting item. if not required, set to 0 or false
			items: 'li', //Specify item (can be a class)
			itemsVisible: 3, //# of items visible
			itemsIncrement: 1, //# of items to move by
			itemsOffset: 0, //# of items to offset the active by when moved (used for centering)
			direction: 'horizontal', //gallery direction (can be 'vertical')
			controls: false, //Takes an obj with 'next' and 'prev' options as references to nav elements {next: '#feature .galleryControl.right',prev: '#feature .galleryControl.left'}
			clickable: true, //Items are clickable and automatically move to the itemsOffset
			draggable: true, // Gallery is draggable
			galleryClass: 'galleryWrapper', //Class used for the 'viewbox' or gallery wrapper
			overflow: false,
			animate: true, //Does the gallery animate on move
			animationDuration: 500, //Animation duration
			animationEasing: 'swing', //Animation easing (using jquery easing plugin)
			autoRotate: false, // Set auto rotation boolean
			autoRotateDuration: 5000, // the default auto rotate duration
			pagination: false, // set the pagination boolean to default false
			paginationNavClass: 'paginationNav', //Class used for the 'viewbox' or gallery wrapper
			onPaginationClick: function() {}, // On pagination click callback
			onMove: function() {}, //On gallery move callback
			onMoveComplete: function() {}, //On move complete callback
			onItemRemove: function() {}, //On Item remove callback
			onItemRemoved: function() {}, //On Item removed callback
			onItemClick: function() {} //On Item click callback
		}
		
		//Extend the default options obj
		this.options = $.extend(true, {}, self.defaults, options);
		
		//Init (construct) function
		this.init = function(element) {
			//Set up default states
			self.gallery = element;
			
			var galleryClass = self.options.galleryClass;
			var overflow = (self.options.overflow) ? 'visible' : 'hidden';
			
			//Check to see if the gallery is already wrapped, else wrap it
			if(!$(self.gallery).parent('.' + galleryClass).length) {
				if(self.options.direction == 'horizontal') {
					$(self.gallery).wrap('<div class="' + galleryClass + '" />');
				} else if(self.options.direction == 'vertical') {
					$(self.gallery).wrap('<div class="' + galleryClass + '" />');
				}
			} 
			
			//Set the gallery Width
			var galleryWidth = $(self.options.items, self.gallery).length * ($(self.options.items, self.gallery).eq(0).outerWidth(true) + (parseInt($(self.options.items, self.gallery).eq(0).css('marginLeft')) + parseInt($(self.options.items, self.gallery).eq(0).css('marginRight')) ) + (parseInt($(self.options.items, self.gallery).eq(0).css('borderLeftWidth'), 10) + parseInt($(self.options.items, self.gallery).eq(0).css('borderRightWidth'), 10) ));
			var galleryHeight = $(self.options.items, self.gallery).length * ($(self.options.items, self.gallery).eq(0).outerHeight(true) + (parseInt($(self.options.items, self.gallery).eq(0).css('marginTop')) + parseInt($(self.options.items, self.gallery).eq(0).css('marginBottom')) ) + (parseInt($(self.options.items, self.gallery).eq(0).css('borderTopWidth'), 10) + parseInt($(self.options.items, self.gallery).eq(0).css('borderBottomWidth'), 10) ));
			
			//Set the gallery width & viewbox width
			if(self.options.direction == 'horizontal') {
				$(self.gallery).css({'width': galleryWidth});
				$(self.gallery).parent('.' + galleryClass).css({'width': self.viewBoxWidth, 'overflow-x': overflow});
			} else if(self.options.direction == 'vertical') {
				$(self.gallery).css({'height': galleryHeight});
				$(self.gallery).parent('.' + galleryClass).css({'height': self.viewBoxHeight, 'overflow-y': overflow});
			}

			//Set the gallery wrapper
			self.galleryWrapper = $(self.gallery).parent('.' + galleryClass);
			
			if(self.options.direction == 'horizontal') {
				//Set the view box width
				self.setViewBoxWidth();
			} else if(self.options.direction == 'vertical') {
				self.setViewBoxHeight();
			}
			
			//Check for controls 
			if (self.options.controls) {
				$(self.options.controls.prev).unbind('click').bind('click', function() {
					if(!$(this).hasClass('disabled')) {
						//If item exists, move to it
						if ($(self.options.items + '.active', self.gallery).prevAll().andSelf().length - self.options.itemsIncrement > 0) {
							self.moveTo($(self.options.items + '.active', self.gallery).prevAll().andSelf().length - self.options.itemsIncrement);
						//Else move to the begining
						} else {
							self.moveTo(1);
						}
					}
					return false;
				});
				$(self.options.controls.next).unbind('click').bind('click', function() {
					if(!$(this).hasClass('disabled')) {
						//If item exists, move to it
						if ($(self.options.items, self.gallery).eq($(self.options.items + '.active', self.gallery).prevAll().andSelf().length + self.options.itemsIncrement).length) {
							self.moveTo($(self.options.items + '.active', self.gallery).prevAll().andSelf().length + self.options.itemsIncrement);
						//Else move to the end
						} else {
							self.moveTo($(self.options.items, self.gallery).length);
						}
					}
					return false;
				});
			}
			
			//Check for ability to click on an item 
			if (self.options.clickable) {
				$(self.options.items, self.gallery).bind('click', function() {
					self.moveTo($(this));
					//On Click Callback
					self.options.onItemClick($(this));
					return false;
				});
			}
			//Check for ability to drag an item
			if (self.options.draggable) { self.setDraggable(); }
			
			//Check for pagination functionality boolean
			if( self.options.pagination ) self.createPagination();
			
			//Check initial moveTo
			if( self.options.defaultItem ) self.moveTo(self.options.defaultItem, false);

			//Check for auto rotate functionality boolean
			if( self.options.autoRotate ) self.setAutomaticRotator();
		}
		
		this.createPagination = function() {
			var navMarkup = "";
			navMarkup += "<div class='" + self.options.paginationNavClass + "'><ul></ul></div>";
			self.galleryWrapper.parent().prepend( navMarkup );

			// store the pagination nav
			self.paginationNav = $('.' + self.options.paginationNavClass);

			// create the nav bar markup based on the amount of gallery items in the markup
			var markup = "";
			$(self.options.items, self.gallery).each(function(index,item){
				markup += (index==0) ? '<li class="active"><a href="#">' + (index+1) + '</a></li>' : '<li><a href="#">' + (index+1) + '</a></li>';
			});
		
			$(self.paginationNav).find('ul').html(markup);
			
			$(self.paginationNav).find('a').bind('click', function(e) {
				var currSelected = $(this).parent().index() + 1;
				self.moveTo(currSelected);
				self.options.onPaginationClick( self.gallery );
				return false;
			});

		}
		
		this.setAutomaticRotator = function() {
			//set automatic rotater
			var interval = setInterval(function() {
				var position =  $(self.options.items, self.gallery).parent().find('.active').prevAll().andSelf().length;
				var total = $(self.options.items, self.gallery).length;

				if(position == total) {
					self.moveTo(1);
				} else {
					self.moveTo(position+1);
				}
			}, self.options.autoRotateDuration);

			//clear interval if mouse is over but if mouse off, reset interval
			var selectorStr = "";
			if ( self.options.pagination ) {
				selectorStr += '.' + self.options.galleryClass + ', ' +  '.' + self.options.paginationNavClass;
			} else {
				selectorStr += '.' + self.options.galleryClass;
			}
			
			$( selectorStr, self.galleryWrapper.parent() ).bind('mousemove', function(e) { 
				clearInterval(interval);
			}).bind('mouseleave', function(e) {
				clearInterval(interval);
				if( self.options.autoRotate ){
					interval = setInterval(function() {
						var position =  $(self.options.items, self.gallery).parent().find('.active').prevAll().andSelf().length;
						var total = $(self.options.items, self.gallery).length;

						if(position == total) {
							self.moveTo(1);
						} else {
							self.moveTo(position+1);
						}
					}, self.options.autoRotateDuration);
				}
			});

		}
		
		this.setViewBoxWidth = function() {
			var active = $(self.options.items+'.active', self.gallery);
			switch(typeof(self.options.itemsVisible)){
				case 'number':
				  	var activeEq = (self.options.itemsOffset) ? $(active).prevAll().length - self.options.itemsOffset : $(active).prevAll().length;
				  	activeEq = (activeEq > 0) ? activeEq : 0;
					var visibleElements = $(self.options.items, self.gallery).slice(activeEq, activeEq + self.options.itemsVisible);

					var viewBoxWidth = 0;
					var firstMarginLeft = parseInt(visibleElements.eq(0).css('marginLeft')); //Factor in first and last item margins
					var lastMarginRight = parseInt(visibleElements.last().css('marginRight'));

					visibleElements.each(function() {
						viewBoxWidth += $(this).outerWidth(true);
					});
					self.viewBoxWidth = viewBoxWidth - (firstMarginLeft + lastMarginRight); //Set the view box width minus the first and last viewable items margins
					break;
				case 'string':
					if (self.options.itemsVisible.toLowerCase() == 'all' || self.options.itemsVisible == '*') {
						self.viewBoxWidth = $(self.options.items, self.gallery).length * $(self.options.items, self.gallery).eq(0).outerWidth(true) + (parseInt($(self.gallery).css('marginLeft')) + parseInt($(self.gallery).css('marginRight')) ) + (parseInt($(self.gallery).css('borderLeftWidth'), 10) + parseInt($(self.gallery).css('borderRightWidth'), 10) );
					} else { //Else assume value is an exact width as a string	 	
			            self.viewBoxWidth = parseInt(self.options.itemsVisible);
           			}
					break;
				default:
					return false;
			}
		}
		
		this.setViewBoxHeight = function() {
			var active = $(self.options.items+'.active', self.gallery);
			switch(typeof(self.options.itemsVisible)){
				case 'number':
				  	var activeEq = (self.options.itemsOffset) ? $(active).prevAll().length - self.options.itemsOffset : $(active).prevAll().length;
				  	activeEq = (activeEq > 0) ? activeEq : 0;
					var visibleElements = $(self.options.items, self.gallery).slice(activeEq, activeEq + self.options.itemsVisible);

					var viewBoxHeight = 0;
					visibleElements.each(function() {
						viewBoxHeight += $(this).outerHeight(true) + (parseInt($(this).css('borderTopWidth')) + parseInt($(this).css('borderBottomWidth')) );
					});
					self.viewBoxHeight = viewBoxHeight;
/*
				  	var gallery =  $(self.gallery).parent('.' + self.options.galleryClass);
				  	var viewHeight = gallery.height() + parseInt($(self.options.items, self.gallery).eq(activeEq + self.options.itemsVisible - 1).css('marginBottom')) + parseInt($(active).outerHeight(false));
				  	var parentHeight = gallery.parent().height();
				  	var marginTop = (parentHeight - viewHeight) / 2;
				  	marginTop = (marginTop > 0) ? marginTop : 0;
				  	gallery.css({marginTop: marginTop +'px'});
				  	console.log(marginTop);
				  	console.log(viewHeight);
				  	console.log(parentHeight);
				  	console.log(parentHeight - viewHeight);
*/
					break;
				case 'string':
					if (self.options.itemsVisible.toLowerCase() == 'all' || self.options.itemsVisible == '*') {
						self.viewBoxHeight = $(self.options.items, self.gallery).length * $(self.options.items, self.gallery).eq(0).outerHeight(true) + (parseInt($(self.gallery).css('marginTop')) + parseInt($(self.gallery).css('marginBottom')) ) + (parseInt($(self.gallery).css('borderTopWidth'), 10) + parseInt($(self.gallery).css('borderBottomWidth'), 10) );
					}
					break;
				default:
					return false;
			}
		}
		
		/**
		 * @public autoRotate Public method that updates the autoRotate setting.
		 * @param {Boolean/String} setting The setting we'll use to update our autoslide setting.
		 */
		this.autoRotate = function(setting) {
			var autoRotateSetting;

			switch(typeof(setting)){
				case 'boolean':
				  autoRotateSetting = setting;
				  break;
				case 'string':
				  if (setting == 'start') {	
					autoRotateSetting = true;
				  } else if (setting == 'stop') {
					autoRotateSetting = false;
				  }
				  break;
				default:
				  return false;
			}
			
			//If there is no element available to move to, then return false
			if (!element) {return false}
			
			self.options.autoRotate = autoRotateSetting;
		}

		//moveTo method- resets the active item. Takes an object, number, or 'next' & 'back'
		this.moveTo = function(item, animate, duration) {
			var animate = (animate == undefined) ? true : animate;
			var element;
			switch(typeof(item)){
				case 'object':
				  element = item;
				  break;
				case 'number':
				  element = $(self.options.items, self.gallery).eq((item - 1));
				  break;
				case 'string':
				  var controlsCount = (self.options.controls) ? self.options.controls.count : 1;
				  if (item == 'next') {	
				  	newIndex = $(self.options.items+'.active', self.gallery).prevAll().andSelf().length + (controlsCount-1);
				  	element = ($(self.options.items+'.active', self.gallery).next(self.options.items).length > 0 && $(self.options.items, self.gallery).eq(newIndex).length > 0) ? $(self.options.items, self.gallery).eq(newIndex) : false;
				  } else if (item == 'back') {
				  	newIndex = $(self.options.items+'.active', self.gallery).prevAll().andSelf().length - (controlsCount+1);
				  	element = ($(self.options.items+'.active', self.gallery).prev(self.options.items).length > 0) ? $(self.options.items, self.gallery).eq(newIndex) : false;
				  }
				  break;
				default:
				  return false;
			}
			
			//If there is no element available to move to, then return false
			if (!element) {return false}
			
			//onMove Callback
			self.options.onMove(element, self.gallery, animate);
			//Remove all active classes in gallery
			$(self.options.items, self.gallery).removeClass('active');
			//Set active class on the new item
			element.addClass('active');
			
			//Check for option to animate gallery
			if (self.options.animate) {
				if(self.options.direction == 'horizontal') {
					var margin = _calcElementMargin(element); //Returns elements pixel position from the left in gallery
					var newMargin = _calcGalleryMargin(0, margin); //Returns the new gallery left margin based on the gallery starting point and the elements margin
					self.slideHorizontal(newMargin, animate, duration); //Move the gallery based on the new margin and an animate bool
				} else if(self.options.direction == 'vertical') {
					self.slideDown(self.options.itemsOffset, animate);
				}
			}
			
			//Update the controls to enable and disable visually
			var controls = { prevCount: element.prevAll().length, nextCount: element.nextAll().length };
			self.updateControls(controls);
			
			if( self.options.pagination ){
				//Update the pagination nav
				var currentIndex = element.index();
				self.updatePaginationNav( currentIndex  );
			}
		}
		
		this.updatePaginationNav = function( currIndex ) {
			self.paginationNav.find('li').removeClass('active').eq(currIndex).addClass('active');
		}
		
		this.updateControls = function(controls) {
			$(self.options.controls.prev + ', ' + self.options.controls.next).removeClass('disabled');
			if( (controls.nextCount-self.options.controls.count) < 0 || controls.nextCount == 0) {
				//no next, disable next
				$(self.options.controls.next).addClass('disabled');
			}
			if( controls.prevCount == 0) {
				//no prev, disable
				$(self.options.controls.prev).addClass('disabled');
			}
		}
		
		this.disableControls = function() {
			$(self.options.controls.prev + ', ' + self.options.controls.next).addClass('disabled');
		}
		
		//slideHorizontal- slides to the currently active item
		this.slideHorizontal = function(margin, animate, duration) {
			var horizontal = true;
			console.log(duration);
			var animateDuration = (duration == undefined) ? self.options.animationDuration : duration;
			//If set to animate
			if (animate) {
				if ($(self.gallery).css('-webkit-transform') === '') { //If dont have transform support, then animate the gallery margin manually
					//Animate the gallery items	
					$(self.gallery).animate({
					    marginLeft: margin
					}, {
						duration: animateDuration,
						queue: true,
						easing: self.options.animationEasing,
						complete: self.options.onMoveComplete
					});
					//Get the viewbox height
					self.setViewBoxWidth();
					//Animate the gallery height
					self.galleryWrapper.animate({
						width: self.viewBoxWidth + 'px'
					}, {
						duration: animateDuration,
						queue: true,
						easing: self.options.animationEasing,
						complete: function() {
					    // Animation complete.
					    }
					});
				} else {
					$(self.gallery).css({ //Else use transform to handle gallery movement
	                "-webkit-transition": "all " + (animateDuration == 0 ? "0" : animateDuration + "ms") + " cubic-bezier(0.33, 0.66, 0.66, 1)",
	                "-webkit-transform": horizontal ?
	                    ("translate3d(" + margin + ", 0, 0)") :
	                    ("translate3d(0, " + margin + ", 0)") });
				}
			//Else simply set css margin left
			} else {
				self.galleryWrapper.css({width: self.viewBoxWidth + 'px'}); //Reset viewable area
				
				if ($(self.gallery).css('-webkit-transform') === '') { //If dont have transform support, then set the gallery margin manually
					$(self.gallery).css('marginLeft', margin);
				} else {
					$(self.gallery).css({ //Else use transform to handle gallery movement
	                "-webkit-transition": "all 0ms cubic-bezier(0.33, 0.66, 0.66, 1)",
	                "-webkit-transform": horizontal ?
	                    ("translate3d(" + margin + ", 0, 0)") :
	                    ("translate3d(0, " + margin + ", 0)") });
				}
			}
				
		}
		
		//slideVertical- slides to the currently active item
		this.slideDown = function(offset, animate) {
			var items;
			var margin = 0;
			var prevItems = $(' .active', self.gallery).prevAll(self.options.items).length;
			
			var range = (offset) ? (prevItems - offset) : prevItems;
			range = (range > 0) ? range : 0;
			var rangeItems = $(self.options.items, self.gallery).slice(0, range);
			rangeItems.each(function() {
				margin += $(this).outerHeight(true) + (parseInt($(this).css('borderTopWidth')) + parseInt($(this).css('borderBottomWidth')) );
			});
			
/*
			if (offset) {
				margin = (prevItems - offset) * $(self.options.items, self.gallery).eq(0).outerHeight(true);
			} else {
				margin = prevItems * $(self.options.items, self.gallery).eq(0).outerHeight(true);
			} 
*/
			
			if (margin > 0) {
				margin = '-' + Math.abs(margin) + 'px';
			} else {
				margin = '+' + Math.abs(margin) + 'px';
			}
			
			//If set to animate
			if (animate) {	
				//Animate the gallery items
				$(self.gallery).animate({
				    marginTop: margin
				}, {
					duration: self.options.animationDuration,
					easing: self.options.animationEasing,
					complete: function() {
				    // Animation complete.
				    }
				});
				//Get the viewbox height
				self.setViewBoxHeight();
				//Animate the gallery height
				self.galleryWrapper.animate({
					height: self.viewBoxHeight + 'px'
				}, {
					duration: self.options.animationDuration,
					easing: self.options.animationEasing,
					complete: function() {
				    // Animation complete.
				    }
				});
			//Else simply set css margin left
			} else {
				$(self.gallery).css({marginTop: margin});
			}
				
		}
		
		//setDraggable- binds all dragging functionality
		this.setDraggable = function() {
			//Setup default states
			var defaultCursor = $(self.options.items, self.gallery).css('cursor');
			var newGalleryMargin;
			var timerInterval;
			var timer;
			var startX;
			var endX;
			var velocity;
			
			$(self.gallery).bind('mousedown touchstart', function(e) { //Bind mousedown to parent of items
				e.preventDefault();
				timer = 0;
				timerInterval = setInterval(function() {
					timer++;
				}, 1);
				//Set event down, either mouse or touch
				var event = (typeof e.originalEvent.touches != 'undefined') ? e.originalEvent.touches[0] : e;
				//on mousedown, set the initial gallery margin by checking if the new gallery margin has been already set. if not, set it to whatever the margin left is, which should be 0 initially.
				var initGalleryMargin = (newGalleryMargin == undefined) ? (1 * $(self.gallery).css('marginLeft').replace('px', '')) : (1 * newGalleryMargin.replace('px', '')); //Initial gallery position
				//Initial mouse or touch position
            	var initMousePos = event.pageX;
            	startX = event.pageX;
				//Set the cursor				
				$(self.options.items, self.gallery).css('cursor', 'move');
				//Bind to mouse move or touchmove
				$(self.gallery).bind('mousemove touchmove', function(e) {
					//set the move event, either mousemove or touchmove
					var event = (typeof e.originalEvent.touches != 'undefined') ? e.originalEvent.touches[0] : e;
					endX = event.pageX;
					var pointerPos = event.pageX - initMousePos;
					newGalleryMargin = _calcGalleryMargin(initGalleryMargin, pointerPos);
					self.slideHorizontal(newGalleryMargin, false); 
				});
			});
			//Bind to mouseup or touchend
			$('html').bind('mouseup touchend', function(e) {
				e.preventDefault();
				var event = (typeof e.originalEvent.touches != 'undefined') ? e.originalEvent.touches[0] : e;
				clearInterval(timerInterval);
				//get the absolute value of the distance travelled
				var distance = Math.abs(startX-endX);
				//if the distance too small, set it to higher
				distance = (distance < 50) ? 50 : distance;
				//if the distance is too small and the time is too long, also set the timer to shorter
				timer = ((distance < 100) && (timer > 20)) ? 20 : timer;
				//if the distance is too small time is too long, set the time to shorter
				timer = ((distance < 300) && (timer > 150)) ? 150 : timer;
/*
				console.log(timer);
				console.log(distance);
*/
				velocity = 4000/(distance/timer);
/* 				console.log(velocity); */
				
				$(self.gallery).unbind('mousemove touchmove');
				$(self.options.items, self.gallery).css('cursor', defaultCursor);
				
				//calculate the new active item
				$activeItem = _calcActiveDragItem( (1 * newGalleryMargin.replace('px', '')) );
				//reset newGalleryMargin
				newGalleryMargin = 0;
				//loop through each gallery item from left to right, to get the current item and the remainderWidth
				$.each($activeItem.prevAll(), function(index, item) {
					//add the current item's width to the total itemsWidth
					newGalleryMargin += $(item).outerWidth(true);
				});
				//add the px string
				newGalleryMargin = '-' + newGalleryMargin + 'px';
				
				//Move to the new item
				self.moveTo($activeItem, true, velocity);
			});
		}
		
		this.itemRemove = function(item, animate) {
			var element;
			var animate = (animate == undefined) ? true : false;
			switch(typeof(item)){
				case 'object':
				  element = item;
				  break;
				case 'number':
				  element = $(self.options.items, self.gallery).eq((item - 1));
				  break;
				default:
				  return false;
			}
			
			//Check for element
			if (!element) { return false; }
			
			//onItemRemove Callback
			self.options.onItemRemove(element, self.gallery);
			//Check for animation before removing
			if (animate) {
				element.addClass('removing').animate( { opacity: "0"}, 600).animate({width: "0"}, 600, function() {
					var location = element.prevAll('.show').length;
					$(this).remove();
					//Fire onItemRemoved callback 
					self.options.onItemRemoved(location, self.gallery)
				});
			} else {
				var location = element.prevAll('.show').length;
				element.addClass('removing').remove();
				//Fire onItemRemoved callback
				self.options.onItemRemoved(location, self.gallery);
			}
		}
		
		//Calculates the new gallery margin based on the galleries current position and a margin param
		var _calcGalleryMargin = function(initGalleryMargin, pointerPos) {
			
			var newMargin; //The new margin to return
			//check if pointerPosition is positive
			if (pointerPos > 0) {
				//new margin moves to the right
				newMargin = (initGalleryMargin + pointerPos) + 'px';
			//else pointerPosition is less than 0 and check if the initial gallery margin is greater than 0
			} else if ( initGalleryMargin >= 0 ) {
				//new margin moves to the left because pointerPos is negative
				newMargin = (initGalleryMargin + pointerPos) + 'px';
			//else pointerPosition is negative and initial gallery margin is negative
			} else {
				//new margin moves left and past the left edge of the gallery
				newMargin = "-" + Math.abs(initGalleryMargin + pointerPos) + 'px';
			}
			return newMargin;
		}
		
		//Calculates the elements left margin based on its position realitive to its siblings
		var _calcElementMargin = function(element) {
			//set the default margin
			var margin = 0;
			//get all the previous items before the original active item
			var prevItems = $(' .active', self.gallery).prevAll(self.options.items);
			//get the offset from the options object
			var offset = self.options.itemsOffset;
			
			//get the total number of all the previous items
			var prevItemsTotal = prevItems.length;
			//set the total number to factor in the offset
			prevItemsTotal = (offset > 0) ? prevItemsTotal - offset : prevItemsTotal;
			
			//loop through each previous item and use the indext to determine which item Width to add to the total margin
			$.each(prevItems, function(index, item) {
				//if the item you are on is less than the previous item total, add its margin to the total margin
				if (index < prevItemsTotal) {
					//get width
					margin += $(self.options.items, self.gallery).eq(index).outerWidth(true);
				}
			});
			
			//if margin is greater than 0
			if (margin > 0) {
				//margin is negative
				margin = '-1' * Math.abs(margin);
			} else {
				//margin is positive
				margin = Math.abs(margin);
			}
			
			return margin;
		}
	
		//Calculates the new active item on drag release based on the current left margin
		var _calcActiveDragItem = function(margin) {
			//set the initial variables
			var $allItems = $(self.options.items, self.gallery);
			var itemsWidth = 0;
			var remainderWidth = 0;
			var currentItemIndex;
			var $currentItem;
			var $activeItem;
			
			//loop through each gallery item from left to right, to get the current item and the remainderWidth
			$.each($allItems, function(index, item) {
				//check if the total width less than the margin
				if( itemsWidth < Math.abs(margin) ) {
					//add the current item's width to the total itemsWidth
					itemsWidth += $(item).outerWidth(true);
					//set the current item to the current item to be used outside this loop
					currentItemIndex = index;
					$currentItem = $(item);
				}
			});
			//get the remainder by calculating the difference between the total width and the margin
			remainderWidth = itemsWidth - Math.abs(margin);
			
/*
			console.log($currentItem);
			console.log(itemsWidth);
			console.log(remainderWidth);
*/
			//calculate the tolerance to determine what the active item should be
			//check if the margin is positive, which means you've dragged it past the first item, stay on the first item
			if ( (margin >= 0) && ($currentItem.is(':first-child')) ) {
				$activeItem = $currentItem;
			//else if the remainder width is less than half of the current item you're on, and you're not on the last item, move to the next item in the list
			} else if( (remainderWidth < ($currentItem.outerWidth(true)/2)) && !($currentItem.is(':last-child')) ) {
				//set the active item
				$activeItem = $currentItem.next();
			//else the current item has tolerance or you are on the last item
			} else {
				$activeItem = $currentItem;
			}
			
			//return the active item
/* 			console.log($activeItem); */
			return $activeItem;
		}
		
		//Set the instance to the elements data
		element.data('gallery', this);
	
	}
	
})(jQuery);