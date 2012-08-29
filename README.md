ThirdPlace
==========

"Third Place" Javascript Library for Stack Exchange Chat Userscripts. [Listed on Stack Apps](http://stackapps.com/questions/3033/thirdplace-javascript-chat-library)

<!-- thumbnail: http://i.stack.imgur.com/i8TLJ.png -->
<!-- version: 0.5a -->
<!-- tag: chat -->
<!-- excerpt: ThirdPlace.js is a library which abstracts some of the concepts of the SE Chat system (the "Third Place") into easy to use JavaScript objects. -->

##Screenshot / Code Snippet

![Screen Capture][1]

<!-- language: javascript -->

    var room = ThirdPlace.Room.GetCurrentRoom();
    var message = new ThirdPlace.Message;
    message.room_id = room.id;
    message.content = "ThirdPlace.js is a library which abstracts some of the concepts of the SE Chat system (the \"Third Place\") into easy to use JavaScript objects.";
    message.post();
    message.content += " You can find it over at StackApps.";
    message.post();

##About

ThirdPlace.js is a library which abstracts some of the concepts of the SE Chat system (the "Third Place") into easy to use JavaScript objects. It's still very much a work in progress, but it is functional. When complete, almost all parts of chat should have `ThirdPlace` objects associated with them, allowing others to create event-driven UserScripts without having to reverse-engineer chat. For example, running code when a user enters / leaves a room, when messages are posted / edited, when notifications happen, etc, will all be as simple as observing events on `ThirdPlace`. In addition, posting/editing messages, joining rooms, and more will all be able to be done through a simple set of objects. (See code sample)

###License

This is free software released under [the MIT license](http://en.wikipedia.org/wiki/MIT_License).

###Download

[Current version v0.6a available from my website](http://josh.gitlin.name/userscripts/ThirdPlace.js). Also available [on GitHub](https://github.com/hmblprogrammer/ThirdPlace)

Posting of messages and observing new message events both confirmed to work. Other events coming soon!

##Release Notes

 * **v0.6a:**
  * Added a 1 second poll for new events; this makes `ThirdPlace` work with the new WebSockets based chat system. Event firing should work again!
  * Made `ThirdPlace.debug` default to `false`, this should eliminate "`console.log.apply` is not a function" errors. Set `ThirdPlace.debug = true;` to enable debugging.

##Platform

Currently tested on Chrome. Should work on Safari and Firefox as well.

##Contact

This library was created and is maintained by [Joshua Gitlin](http://josh.gitlin.name/) a.k.a [The Unhandled Exception](http://meta.stackoverflow.com/users/131541/the-unhandled-exception). You can contact me [via my website](http://josh.gitlin.name/contact) or via email at `thirdplace -at- josh -dot- gitlin -dot- name`

##Code

This library was built with snippits of code from Tim Stone and includes chunks of `Prototype.js` including the `Class` implementation. If others with to develop it, contact me and I will set up a repo.


  [1]: http://i.stack.imgur.com/i8TLJ.png