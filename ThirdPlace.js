/**
 * Stack Overflow "Third Place" system
 *
 * A library containing a collection of classes, objectes, events and methods to
 * aid in the creation of userscripts for the Stack Exchange chat system, known
 * to its users as the "Third Place"
 *
 * This library was created by the user base and is **not** officual code; it is
 * not affiliated with or supported by Stack Overflow Internet Systems in any
 * way, shape or form.
 *
 * Copyright (C) 2011 by Joshua Gitlin, http://josh.gitlin.name
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author Joshua Gitlin <thirdplace@josh.gitlin.name>
 * @version 0.6a
 * @copyright 2012 Joshua Gitlin, released as an open source project
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
window.ThirdPlace = (function()
{
	/**
	 * Public ThirdPlace Object
	 *
	 * This is the object which will be returned from the constructor. Any methods
	 * or properties of this object will be public and available ouside of the
	 * closure. Eveything else defined inside this closure is private.
	 *
	 * @type Object
	 * @access Public
	 **/
	var ThirdPlace = {
		debug: false,
		version: '0.6a',
		fkey: function() { return fkey().fkey; }
	};
	
	///////////////////////////////////////////////////////////////////////////////
	/////////////////////////////// HELPER LIBRARIES //////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	
	// Class cystem, copied from Prototype.js and modified to work without
	// Prototype.js. Used for inheritance and method overlodaing for Event
	// and other classes
	
	ThirdPlace.extend = function(destination, source) {
	  for (var property in source)
	    destination[property] = source[property];
	  return destination;
	};
	
	var emptyFunction = function(){};
	
	function $A(iterable) {
	  if (!iterable) return [];
	  if ('toArray' in Object(iterable)) return iterable.toArray();
	  var length = iterable.length || 0, results = new Array(length);
	  while (length--) results[length] = iterable[length];
	  return results;
	}
	
	function update(array, args) {
		var arrayLength = array.length, length = args.length;
		while (length--) array[arrayLength + length] = args[length];
		return array;
	}
	
	function merge(array, args) {
		array = Array.prototype.slice.call(array, 0);
		return update(array, args);
	}
	
	function bind(context) {
		if (arguments.length < 2 && (typeof arguments[0] !== 'undefined')) return this;
		var __method = this, args = Array.prototype.slice.call(arguments, 1);
		return function() {
		  var a = merge(args, arguments);
		  return __method.apply(context, a);
		}
	}
	
	function wrap(wrapper) {
		var __method = this;
		return function() {
		  var a = update([bind(__method,this)], arguments);
		  return wrapper.apply(this, a);
		}
	}
	
	function argumentNames(func) {
		var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
		  .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
		  .replace(/\s+/g, '').split(',');
		return names.length == 1 && !names[0] ? [] : names;
	}
	
	/* Based on Alex Arnell's inheritance implementation. */
	var Class = {
	  create: function() {
	    var parent = null, properties = new $A(arguments);
	    if (typeof properties[0] == 'function')
	      parent = properties.shift();
	
	    function klass() {
	      this.initialize.apply(this, arguments);
	    }
	
	    ThirdPlace.extend(klass, Class.Methods);
	    klass.superclass = parent;
	    klass.subclasses = [];
	
	    if (parent) {
	      var subclass = function() { };
	      subclass.prototype = parent.prototype;
	      klass.prototype = new subclass;
	      parent.subclasses.push(klass);
	    }
	
	    for (var i = 0; i < properties.length; i++)
	      klass.addMethods(properties[i]);
	
	    if (!klass.prototype.initialize)
	      klass.prototype.initialize = emptyFunction;
	
	    klass.prototype.constructor = klass;
	
	    return klass;
	  }
	};
	
	Class.Methods = {
	  addMethods: function(source) {
	    var ancestor   = this.superclass && this.superclass.prototype;
	    var properties = Object.keys(source);
	
	    if (!Object.keys({ toString: true }).length)
	      properties.push("toString", "valueOf");
	
	    for (var i = 0, length = properties.length; i < length; i++) {
	      var property = properties[i], value = source[property];
	      if (ancestor && (typeof value == 'function')) {
			var args = argumentNames(value);
	        if(args[0] == "$super") {}
	          var method = value;
	          value = wrap((function(m) {
	            return function() { return ancestor[m].apply(this, arguments) };
	          })(property),method);
	  
	          value.valueOf = method.valueOf.bind(method);
	          value.toString = method.toString.bind(method);
			
	      }
	      this.prototype[property] = value;
	    }
	
	    return this;
	  }
	};
	
	var Abstract = { };
	
	
	
	///////////////////////////////////////////////////////////////////////////////
	////////////////////////////// PRIVATE VARIABLES //////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Hash to store event handlers regstered to various events
	 *
	 * @access private
	 **/
	var myThirdPlaceEventHandlers = {
		newMessage: [],
		editMessage: []
	}
	
	
	/**
	 * Hash to store chat rooms by ID
	 *
	 * @access private
	 **/
	var myThirdPlaceRoomsById = {};
	
	
	/**
	 * Hash to store chat users by ID
	 *
	 * @access private
	 **/
	var myThirdPlaceUsersById = {};
	
	
	/**
	 * Stores the last timestame we have seen
	 *
	 * @access private
	 **/
	var myLastSeenEventTimestamp = 0;
	
	///////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////// CLASSES ///////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	
	
	
	/**
	 * User Class, represents users in a SE Chat Room
	 *
	 * 
	 **/
	ThirdPlace.User = Class.create(
	{
		initialize: function()
		{
			this.id = false;
			this.name = false;
		}
	});
	
	/**
	 * Room Class, represents a SE Chat Room
	 *
	 * 
	 **/
	ThirdPlace.Room = Class.create(
	{
		initialize: function()
		{
			this.id = false;
			this.name = false;
			this.messages = [];
			this.presentUsers = [];
		}
	});
	
	/**
	 * Message Class, represents messages posted to an SE chat room
	 *
	 * 
	 **/
	ThirdPlace.Message = Class.create(
	{
		initialize: function()
		{
			this.id = false;
			this.content = false;
			this.user_id = false;
			this.room_id = false;
		},
		
		room: function() { 
			this.room_id ? myGetChatRoomById(this.room_id) : false;
		},
		
		user: function() { return myGetChatUserById(this.user_id); },
		
		post: function() {
			if(this.id) {
				$.ajax({
					url:'/messages/'+this.id,
					type:'POST',
					data: {
						text: this.content,
						fkey: ThirdPlace.fkey()
					},
					cache:true
				});
			} else {
				if(!this.room_id)
					throw new TypeError("Cannot post a new message without a valid numeric room_id");
				
				var message = this;
				
				$.ajax({
					url:'/chats/'+this.room_id+'/messages/new',
					type:'POST',
					data: {
						'fkey': ThirdPlace.fkey(),
						'text': this.content
					},
					success: function(data, textStatus, jqXHR){
						message.id = data.id;
					},
					cache:true
				});
			}
		}
	});
	
	/**
	 * Event Class, master class for all Third Place Events
	 *
	 * 
	 **/
	ThirdPlace.Event = Class.create(
	{
		initialize: function()
		{
			this.eventType = false;
			this.room_id = false;
		},
		
		fire: function()
		{
			var queue;
			
			myDebugLog('Event#fire called for',this);
			
			// we can only fire event types which are built in, and the ThirdPlace closure
			// has built in event queues for
			if(this.eventType && (queue = myThirdPlaceEventHandlers[this.eventType]))
			{
				var i,len = queue.length;
				
				//DEBUG:
				myDebugLog('firing chat event',this);
				
				for(i=0;i<len;++i)
				{
					try {
						queue[i](this);
					} catch(ex) {
						if(console && (typeof console.log == 'function'))
							console.log("ThirdPlace.Event.NewMessage handler caught an exception:",ex);
					}
				}
			}
		},
		
		room: function()
		{
			return this.room_id ? myGetChatRoomById(this.room_id) : false;
		}
	});
	
	/**
	 * New Message Event Class, represents a new message posted to a chat room
	 *
	 * 
	 **/
	ThirdPlace.Event.NewMessage = Class.create(ThirdPlace.Event,
	{
		initialize: function() 
		{
			this.eventType = 'newMessage';
			this.room_id = 0;
			this.message = false;
		}
	});
	
	/**
	 * Edit Message Event Class, triggered when a user edits a message that had previously been posted
	 *
	 * 
	 **/
	ThirdPlace.Event.EditMessage = Class.create(ThirdPlace.Event,
	{
		initialize: function() 
		{
			this.eventType = 'newMessage';
			this.room_id = 0;
			this.message = false;
		}
	});
	
	
	
	
	
	
	///////////////////////////////////////////////////////////////////////////////
	////////////////////////////// PRIVATE FUNCTIONS //////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	
	/**
	 * Writes a debug message to the console, if debugging is enabled and the console
	 * is available.
	 *
	 * @access private
	 **/
	var myDebugLog = function()
	{
		if(ThirdPlace.debug)
		{
			if(console && (typeof console.log == 'function'))
				console.log.apply(console,arguments);
		}
	}
	
	
	var myAddObserver = function(event,handler)
	{
		if(typeof handler != "function")
			throw new TypeError("handler must be a function");
		
		if(typeof myThirdPlaceEventHandlers[event] == "undefined")
			throw new TypeError("invalid event type");
		
		myThirdPlaceEventHandlers[event].push(handler);
	}
	
	ThirdPlace.observe = function(event,handler) { return myAddObserver(event,handler); }
	
	
	
	
	var myGetChatRoomById = function(id)
	{
		if(typeof id != "number")
			throw new TypeError("ID must be numeric");
		
		if(typeof myThirdPlaceRoomsById[id] != "object")
		{
			myThirdPlaceRoomsById[id] = new ThirdPlace.Room();
			myThirdPlaceRoomsById[id].id = id;
		}
		
		return myThirdPlaceRoomsById[id];
	}
	
	var myGetChatUserById = function(id)
	{
		if(typeof id != "number")
			throw new TypeError("ID must be numeric");
		
		if(typeof myThirdPlaceUsersById[id] != "object")
		{
			myThirdPlaceUsersById[id] = new ThirdPlace.User();
			myThirdPlaceUsersById[id].id = id;
		}
		
		return myThirdPlaceUsersById[id];
	}
	
	var myGetCurrentRoom = function() {
		var room=false, location_match = window.location.pathname.match(/^\/rooms\/([0-9]+)\/(.*)$/);
		
		if(location_match) {
			room = myGetChatRoomById(parseInt(location_match[1]));
			
			if(!room.name)
				room.name = location_match[2];
		}
		
		return room;
	}
	
	ThirdPlace.Room.GetById = function(id) { return myGetChatRoomById(id); }
	
	ThirdPlace.Room.GetCurrentRoom = function(id) { return myGetCurrentRoom(); }
	
	ThirdPlace.User.GetById = function(id) { return myGetChatUserById(id); }
	
	var myPollLocalStorage = function(){
		
	}
	
	var myParseThirdPlaceEventAndCreateObject = function(chatEventData)
	{
		var event = new ThirdPlace.Event();
		
		if(chatEventData.event_type == 1)
		{
			//DEBUG:
			myDebugLog('creating a new message event',chatEventData);
			
			// this is a new message being posted
			event = new ThirdPlace.Event.NewMessage;
			event.eventType = 'newMessage';
			event.message = new ThirdPlace.Message();
			
			event.room_id = chatEventData.room_id;
			
			event.message.user_id = chatEventData.user_id;
			event.message.content = chatEventData.content;
			event.message.room_id = event.room_id;
			
			event.room = myGetChatRoomById(event.message.room_id)
			event.room.name = chatEventData.room_name;
			
			event.user = myGetChatUserById(event.message.user_id)
			event.user.name = chatEventData.user_name;
		}
		else if(chatEventData.event_type == 2)
		{
			//DEBUG:
			myDebugLog('creating a new message event',chatEventData);
			
			// this is a new message being posted
			event = new ThirdPlace.Event.EditMessage;
			event.eventType = 'editMessage';
			event.message = new ThirdPlace.Message();
			
			event.room_id = chatEventData.room_id;
			
			event.message.user_id = chatEventData.user_id;
			event.message.content = chatEventData.content;
			event.message.room_id = event.room_id;
			
			event.room = myGetChatRoomById(event.message.room_id)
			event.room.name = chatEventData.room_name;
			
			event.user = myGetChatUserById(event.message.user_id)
			event.user.name = chatEventData.user_name;
		}
		
		return event;
	}
	
	var myGetChatEventQueue = function() {
		return $.parseJSON(localStorage['chat:broadcastQueue']);
	}
	
	var myGetNewChatEvents = function()
	{
		var chatEvents = myGetChatEventQueue();
		var chatEventCount = chatEvents.length, queueIndex, roomEventCount, roomIndex;
		
		var result = [];
		
		for(queueIndex=0; queueIndex<chatEventCount; ++queueIndex)
		{
			if(chatEvents[queueIndex].time > myLastSeenEventTimestamp)
			{
				for(roomKey in chatEvents[queueIndex].content.data)
				{
					if(chatEvents[queueIndex].content.data[roomKey].e instanceof Array)
					{
						var roomId = parseInt(roomKey.substr(1));
						
						roomEventCount = chatEvents[queueIndex].content.data[roomKey].e.length;
						
						// DEBUG:
						myDebugLog("parsing",roomEventCount,"chat events for room ID:",roomId,chatEvents[queueIndex].content.data[roomKey]);
						
						for(roomIndex=0; roomIndex<roomEventCount; ++roomIndex)
						{
							//DEBUG:
							myDebugLog('parse event #'+roomIndex,chatEvents[queueIndex].content.data[roomKey].e[roomIndex]);
							
							result.push(myParseThirdPlaceEventAndCreateObject(chatEvents[queueIndex].content.data[roomKey].e[roomIndex]))
						}
					}
				}
				
				
				myLastSeenEventTimestamp = chatEvents[queueIndex].time;
				
				//DEBUG:
				myDebugLog('myLastSeenEventTimestamp=',myLastSeenEventTimestamp);
			}
		}
		
		return result;
	}
	
	var myLocalStorageOnStorageHandler = function(event)
	{
		if(event.key == "chat:broadcastQueue")
		{
			// We have a chat event.
			var newEvents = myGetNewChatEvents();
			
			var eventCount = newEvents.length;
			
			//DEBUG:
			myDebugLog('myLocalStorageOnStorageHandler received '+eventCount+' events:',newEvents);
			
			for(var i = 0; i < eventCount; i++)
				newEvents[i].fire();
		}
	}
	
	var myGlobalAjaxCompleteHandler = function(event, XMLHttpRequest, ajaxOptions)
	{
		if(ajaxOptions.url == '/events')
		{
			var newEvents = myGetNewChatEvents();
			
			var eventCount = newEvents.length;
			
			//DEBUG:
			myDebugLog('myGlobalAjaxCompleteHandler received '+eventCount+' events:',newEvents);
			
			for(var i = 0; i < eventCount; i++)
				newEvents[i].fire();
		}
	}
	
	var myPollForNewEvents = function()
	{
		var newEvents = myGetNewChatEvents();
		
		var eventCount = newEvents.length;
		
		//DEBUG:
		myDebugLog('myPollForNewEvents received '+eventCount+' events:',newEvents);
		
		for(var i = 0; i < eventCount; i++)
			newEvents[i].fire();
	}
	
	window.addEventListener('storage', myLocalStorageOnStorageHandler, false);
	
	$(document).ajaxComplete(myGlobalAjaxCompleteHandler);
	
	window.setInterval(myPollForNewEvents,1000);
	
	return ThirdPlace;
	
})();