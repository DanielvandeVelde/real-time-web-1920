# Real-Time Web @cmda-minor-web · 2019-2020

## Corona karaoke?

A place to chat and watch YouTube videos together.  
[Demo running here.](https://socket-1920.herokuapp.com/)  
Lyrics to karaoke to coming soon.

## Commands

`!help` or `/help` will redirect you here.  
`!play dQw4w9WgXcQ` or `/play https://www.youtube.com/watch?v=dQw4w9WgXcQ` will play the video.

Play will also accept just the ID, youtu.be, and many more.

## Technical stuff

### Client side

As soon as the window is loaded the `script.js` does several things.  
It adds eventListeners to both the input for the nickname and the chatbox.  
It also appends the `<script>` for the YouTube iframe API, more about that after I discuss the serverside.  
The eventListeners for the different controls such as the buttons and the range are also added. These only use socket to emit something to the server.

### Server side

On the server there is always an array that holds the different usernames of everyone connected.  
There is also a boolean that keeps track of whether the video is playing or if the video is paused so it is the same for all users.

### Nickname

When the user joins they get a screen to type in their nickname.  
That form already has some requirements built in, but they are tested again as soon as they reach the server.  
I use a callback to give feedback to the user.  
It checks:

- If the nickname already exists in the nicknames array on the server
- If the nickname is empty or undefined
- If the nickname is over 16 characters

If any of those are true, it tells the user the nickname is unavailable.
If these are all false, the username is fine and the following happens:

- The username gets added to the nickname list on the server
- The userlist gets updated for all users
- The nickname gets added to that users socket
- A server message that the user connected
- The user that just joined gets the current video status (playing/paused)

It's a big to do to make sure the user also gets the right video at the right time, but that's for later.
When the user disconnects we check for a nickname, if there is one we remove it from the userlist, display a server message and update the userlist for all users.
This userlist array gets send to the clientside where the element gets created/modified.

### Messages

There is some clientside checking for messages, but this same happens on the serverside as well.
We check if the user has a nickname (else they cheated the system!) and wether the message is not a bunch of empty spaces but also is less than 2000 characters.
If so, the users nickname and message gets broadcast to all users.
On the clientside a date also gets added to make sure it's set to the users local time.

The user itself never has to go through the serversided-check for himself. Their messages get added instantly on the clientside.
This is also why I added several other checks on the client side if the message starts with `/play` or `/help` the message will not be shown to other users.

When a message starts with `/help` a help message will be shown to the user. This definitely could be prettier.
When a message starts with `/play` this message will be send to the server not as a chatmessage but as a request for a new video.

### New video

When a message starts with `/play` the client will discover this and send anything that comes after the `/play` to the server.  
On the server a [regex](https://stackoverflow.com/questions/5830387/how-do-i-find-all-youtube-video-ids-in-a-string-using-a-regex/6901180#6901180) finds the videoID.  
If a videoID is not found, the message is ignored.  
If a videoID is found it gets send to all users and the playing status is set to true.
On the clientside the YouTube iframe API is used to change the video to the one requested by a user and then used to play the video.

### Play/pause

When the play/pause button is clicked it gets send to the server.  
There the current `playing` variable is updated and sent to all users to update their video to the current status.
That way the playing-status for the video is always the same for everyone.

### Mute

The mute happens locally. You don't want to share everything with your friends :-)

### YouTube iframe API

The [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference) is pretty cool.  
When adding the script to them DOM with Javascript it initializes the YouTube iframe and replaces the selected `<div>` and removes any extra work I would have with that.  
It also calls some events when the player is ready and loaded or when the state of the player changes.  
I'm don't believe I'm using it to its full potential yet, but just using their player variable helps a lot.

## Data Lifecycle diagram

A Data Lifecycle diagram is supposed to show how data flow through an application.  
Since I'm not yet at my final version this is a very simplified look of how things actually are at the moment.  
There's a lot more back and forth between the client and the server than shown here, but to keep things simple, this is the best you're going to get :-)

<kbd>![Data Lifecycle Diagram](https://raw.githubusercontent.com/DanielvandeVelde/real-time-web-1920/master/DLD.svg?sanitize=true "Data Lifecycle Diagram")</kbd>

## TODO/Wishlist

- [x] Playing the same video to all connected users
- [x] Pause/Play
- [x] Scrubbing/moving to certain time
- [x] Move video progress between all users
- [x] Local mute button
- [ ] Playing the exact video at the exact moment even when joining late
- [x] Better regex for YouTube urls/ids
- [ ] Actual controls styling?
- [ ] Mobile styling

thoughts/questions:  
Send all messages to server and sort them there? (no client-side validation)  
Add a volume slider?

## Helpful links

- [Great YouTube RegEx on StackOverflow](https://stackoverflow.com/questions/5830387/how-do-i-find-all-youtube-video-ids-in-a-string-using-a-regex/6901180#6901180)
- [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference)

</details>
