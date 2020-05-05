# Real-Time Web @cmda-minor-web · 2019-2020

## CoronaKaraokeTube

A place to chat and watch YouTube videos together.  
All the controls are shared (except for mute).  
[Demo running here.](https://socket-1920.herokuapp.com/)  
Now also with lyrics when a song is playing, thanks to Musixmatch.

## Installation

```bash
#Fork and then clone
git clone https://github.com/<your username>/real-time-web-1920.git

#Move to directory
cd real-time-web-1920

#Install dependencies
npm install

#Run app
npm start

#App will be listening on localhost:1337
```

## Commands

`!help` or `/help` will redirect you here.  
`!play dQw4w9WgXcQ` or `/play https://www.youtube.com/watch?v=dQw4w9WgXcQ` will play the video.

Play will also accept just the ID, youtu.be, and most other YouTube link variations.

## Data Lifecycle diagram

A Data Lifecycle diagram is supposed to show how data flow through an application.  
There's a lot more back and forth between the client and the server than shown here, which will be in the next chapter.
But to keep this diagram simple:

<kbd>![Data Lifecycle Diagram](https://raw.githubusercontent.com/DanielvandeVelde/real-time-web-1920/master/DLD.png "Data Lifecycle Diagram")</kbd>

## Socket events

### Nickname

##### Socket event: 'new user'

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

When the user disconnects we check for a nickname, if there is one we remove it from the userlist, display a server message and update the userlist for all users.
This userlist array gets send to the clientside where the element gets created/modified.

### Messages

##### Socket event: 'chat message'

There is some clientside checking for messages, but this same happens on the serverside as well.
We check if the user has a nickname (else they cheated the system!) and wether the message is not a bunch of empty spaces but also is less than 2000 characters.
If so, the users nickname and message gets broadcast to all users.
On the clientside a date also gets added to make sure it's set to the users local time.

The user itself never has to go through the serversided-check for himself. Their messages get added instantly on the clientside.
This is also why I added several other checks on the client side if the message starts with `/play` or `/help` the message will not be shown to other users.

When a message starts with `/help` a help message will be shown to the user. This definitely could be prettier.
When a message starts with `/play` this message will be send to the server not as a chatmessage but as a request for a new video.

### New video

##### Socket event: 'new video'

When a message starts with `/play` the client will discover this and send anything that comes after the `/play` to the server.  
On the server a [regex](https://stackoverflow.com/questions/5830387/how-do-i-find-all-youtube-video-ids-in-a-string-using-a-regex/6901180#6901180) finds the videoID.  
If a videoID is not found, the message is ignored.  
If a videoID is found it gets send to all users and the playing status is set to true.
On the clientside the YouTube iframe API is used to change the video to the one requested by a user and then used to play the video.

### Play/pause

##### Socket event: 'playpause'

When the play/pause button is clicked it gets send to the server.  
There the current `playing` variable is updated and sent to all users to update their video to the current status.
That way the playing-status for the video is always the same for everyone.

### Scrubbing

##### Socket event: 'video to'

When the slider gets moved the value of this is calculated and send to the server.
There is a variable there called `currentTime` that keeps track of at what point the video is.
This gets updated on the server and send to all sockets so the time is the same for everyone.
It's a to-do to make sure the server keeps track of this time itself so people that join late get the right time as well.

### Lyrics

#### Socket event: 'get lyrics'

When a new video is added the lyrics-boolean on the client-side gets set to false.  
As soon as the YouTube API is initialised and starts playing, the client grabs the title value from the YouTube-player variable.  
Then the boolean gets set to true and the request for lyrics gets send to the server.
The server checks and sets the `currentVideo` variable, so the lyrics don't get requested for the same video twice.  
The title of the video gets send to the MusixMatch API to search for a track that fits.  
If there's one or multiple, the track_id gets extracted from the first track and send back to the MusixMatch API but now asking for the lyrics to go with that track_id.
Then those lyrics gets send to all the connected sockets.
If there's no track found, we give the users a little message with the fact we didn't find anything.

### Mute

The mute happens locally. You don't want to share everything with your friends :-)

## YouTube iframe API

The [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference) is pretty cool.  
When adding the script to them DOM with Javascript it initializes the YouTube iframe and replaces the selected `<div>` and removes any extra work I would have with that.  
It also calls some events when the player is ready and loaded or when the state of the player changes.  
I'm starting to use it to its full potential although just using their player variable helps a lot.

## MusixMatch API

The [MusixMatch API](https://developer.musixmatch.com/) is the one I'm using to get my lyrics.  
With the free version I lack synced lyrics as well as translations and any licensing/commercial goodness.  
The ratelimit is set at '2.000' calls a day' so that would probably be more than enough for me.
Getting an API key is simple; you just have to sign up and the [documentation can be found here.](https://developer.musixmatch.com/documentation/)

I'm using the `/track.search` endpoint for searching a track.
I clean up the title I get from the YouTube iframe API by removing anything between `()` and `[]`.
I do this because most of the time YouTube video's have: (offical video) or [Full HD] or other weird stuff that will muddy up the search in the title.  
After getting a result I use extract the track_id of the first result I get.

Then I use the `/track.lyrics.get` endpoint where I request the lyrics from that specific track_id.
Once I get these lyrics I extract the actual lyrics from the data I get back and send these to the user.

<details>

<summary>
Example of `/track.search` endpoint data
</summary>

```json
{
  "message": {
    "header": {
      "status_code": 200,
      "execute_time": 0.031071901321411,
      "available": 160
    },
    "body": {
      "track_list": [
        {
          "track": {
            "track_id": 45123464,
            "track_name": "Never Gonna Give You Up (In The Style Of Rick Astley)",
            "track_name_translation_list": [],
            "track_rating": 1,
            "commontrack_id": 19508392,
            "instrumental": 0,
            "explicit": 0,
            "has_lyrics": 1,
            "has_subtitles": 0,
            "has_richsync": 0,
            "num_favourite": 0,
            "album_id": 16243360,
            "album_name": "Karaoke Downloads - Disco Vol.9",
            "artist_id": 24497428,
            "artist_name": "Ameritz Karaoke Band",
            "track_share_url": "https://www.musixmatch.com/lyrics/Ameritz-Karaoke-Band/Never-Gonna-Give-You-Up-In-The-Style-Of-Rick-Astley?utm_source=application&utm_campaign=api&utm_medium=Hogeschool+van+Den+Haag%3A1409619737399",
            "track_edit_url": "https://www.musixmatch.com/lyrics/Ameritz-Karaoke-Band/Never-Gonna-Give-You-Up-In-The-Style-Of-Rick-Astley/edit?utm_source=application&utm_campaign=api&utm_medium=Hogeschool+van+Den+Haag%3A1409619737399",
            "restricted": 0,
            "updated_time": "2015-02-21T12:24:01Z",
            "primary_genres": {
              "music_genre_list": [
                {
                  "music_genre": {
                    "music_genre_id": 14,
                    "music_genre_parent_id": 34,
                    "music_genre_name": "Pop",
                    "music_genre_name_extended": "Pop",
                    "music_genre_vanity": "Pop"
                  }
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```

</details>

<details>

<summary>
Example of `/track.lyrics.get` endpoint data
</summary>

```json
{
  "message": {
    "header": { "status_code": 200, "execute_time": 0.029282093048096 },
    "body": {
      "lyrics": {
        "lyrics_id": 9880962,
        "explicit": 0,
        "lyrics_body": "We're no strangers to love\nYou know the rules and so do I\nA full commitment's what I'm thinking of\nYou wouldn't get this from any other guy\nI just wanna tell you how I'm feeling\nGotta make you understand\n\nNever gonna give you up,\nNever gonna let you down\n...\n\n******* This Lyrics is NOT for Commercial use *******\n(1409619737399)",
        "script_tracking_url": "https://tracking.musixmatch.com/t1.0/m_js/e_1/sn_0/l_9880962/su_0/rs_0/tr_3vUCAD5SVY7qVU3PL04xWCCkupZYWFY35bPvMEgq5vMmVqmSAzpNTJTVgNfkApLgc8KhWWw6LYgKrA2aeRvDzACSAJ2RobNEGzk128SOOP4yZlpuWPNPQFmFoM0NkV3iuiZMjfEf_U8kPIKOMu3BLRq1AfbAafHKhKAnO4gFRZM_7T24XER45BFqr_hYUKcNxcP7k1m_03cHX7-d3BANb-S2QKxhZ6hM7qf-mE26kx0-mnrj9oc9XaY2-1YN3lQmeEX8vdIWlMdWl9_xu4nnIDJ-OvVYb_Y8T3t_plfKuUXFNX5Cr6wBUvDHyNKyDIWqCpfmA4ejuHeqBEkjVwD-AOTcwmDzOWsqWYmQP0FdaklO7uRL0SsNQL6vokiEk7l9WvhUo5xVO4pknGJe3icJG9M2jC3hpIz1_A7fb8hpp3tCrJ5LAKVBPd_9DKYzWQQRQZoNhQjXR_TsmvGp3Np6RHVzbOANR44dYpHVzhRE0qQJtv-JMZTyl7v0NbUF-HGNoC3W2I5b/",
        "pixel_tracking_url": "https://tracking.musixmatch.com/t1.0/m_img/e_1/sn_0/l_9880962/su_0/rs_0/tr_3vUCALF3Ozg2SnMCsaP0o2R4KmUyU5pPlx_ouaYVH3KEh-FSo77WojBGJ4qH7u4z4-Y6zYdX6uiy7xuHxc_g5TGRaWHakhafoaAEUsCijEW8hNTy4pRJCfPSU1WlmJGNNQ3ACSeGxGgq00rDyZlIDEdvadw1tDrk9HlgQjp4kKbl19d9Hox53S1NEkg-rP8hNWGDg8EepImngWU_PsyIME5pjOoBHod0SNmVffaF7ia9lQz5gJ3_X2t6ynfG3ixCz9ZE5l13w5hgKu6qANYVrV-DsZ2NiAlYZmPYcDWGhQ0t84nO6aZI25nFpy7AqUy3XDdCcqsHKc3JkrLR0-3S91vJnULdYg7TxqkJkpZP2hjiTatirlXd28f6djNrYJzQQyKEUrB1Meel4bE1g0T7Mydzq3m3GSDKoye-eakMjrksNbt8g-sA0ghP_HcqakGV7eO3teQdnFfixJRYwc2SH7EmbaUGQaZuzBsP3rFGC36L6j7xXTuNITs3ldepsBRjPCMNaxyH/",
        "lyrics_copyright": "Lyrics powered by www.musixmatch.com. This Lyrics is NOT for Commercial use and only 30% of the lyrics are returned.",
        "updated_time": "2017-07-21T15:20:41Z"
      }
    }
  }
}
```

</details>

## TODO/Wishlist

- [x] Playing the same video to all connected users
- [x] Pause/Play
- [x] Scrubbing/moving to certain time
- [x] Move video progress between all users
- [x] Local mute button
- [ ] Playing the exact video at the exact moment even when joining late
- [x] Remember video
- [ ] Count the time
- [x] Better regex for YouTube urls/ids
- [ ] Better styling for controls
- [ ] Mobile styling
- [ ] Modules
- [ ] Maybe add a volume slider?

## Helpful links

- [Great YouTube RegEx on StackOverflow](https://stackoverflow.com/questions/5830387/how-do-i-find-all-youtube-video-ids-in-a-string-using-a-regex/6901180#6901180)
- [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference)

</details>
