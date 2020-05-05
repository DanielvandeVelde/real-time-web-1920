require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let playing = false;
let currentVideo = "dQw4w9WgXcQ";
let currentTime = "";
const nicknames = [];

const port = process.env.PORT || 1337;

app.use(express.static(__dirname + "/static"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  socket.on("new user", function(data, callback) {
    if (
      nicknames.indexOf(data) != -1 ||
      data == "" ||
      data == undefined ||
      data.length > 16
    ) {
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      nicknames.push(socket.nickname);
      io.emit("server message", {
        msg: `${socket.nickname} connected`,
        type: "connect"
      });
      prepareNewUser();
    }
  });

  function prepareNewUser() {
    io.emit("userlist", nicknames);
    socket.emit("new video", currentVideo);
    socket.emit("playpause", playing);
    //Get Rick Astley lyrics
  }

  socket.on("new video", function(messageValue) {
    const re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi;
    const url = messageValue.substr(messageValue.indexOf(" ") + 1);
    const videoID = url.replace(re, `$1`);
    if (videoID) {
      io.emit("new video", videoID);
      playing = true;
    }
  });

  socket.on("get lyrics", function(player) {
    if (currentVideo != player.video_id) {
      currentVideo = player.video_id;
      musixAPI(player);
    }
  });

  socket.on("disconnect", function() {
    if (!socket.nickname) {
      return;
    }
    nicknames.splice(nicknames.indexOf(socket.nickname), 1);
    io.emit("userlist", nicknames);
    io.emit("server message", {
      msg: `(${socket.nickname} was banned)`,
      type: "disconnect"
    });
  });

  socket.on("chat message", function(data) {
    if (/\S/.test(data) && data.length < 2000 && socket.nickname) {
      socket.broadcast.emit("chat message", {
        msg: data,
        nick: socket.nickname
      });
    }
  });

  socket.on("video to", function(data) {
    currentTime = data;
    io.emit("video to", data);
  });

  socket.on("playpause", function() {
    if (playing == false) {
      playing = true;
    } else {
      playing = false;
    }
    io.emit("playpause", playing);
  });
});

function musixAPI(player) {
  const apiKey = process.env.API_KEY;
  let cleanedTitle = player.title;
  cleanedTitle = cleanedTitle.replace(/ *\([^)]*\) */g, ""); // ()
  cleanedTitle = cleanedTitle.replace(/ *\[[^\]]*] */g, ""); // []
  cleanedTitle = cleanedTitle.replace(/\s+/g, " ").trim();
  const searchQuery = cleanedTitle;

  fetch(
    "https://api.musixmatch.com/ws/1.1/track.search?q=" +
      searchQuery +
      "&apikey=" +
      apiKey
  )
    .then(res => res.json())
    .then(json => {
      if (json.message.header.available > 0) {
        const queryNum = json.message.body.track_list[0].track.track_id;
        if (queryNum) {
          fetch(
            "https://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=" +
              queryNum +
              "&apikey=" +
              apiKey
          )
            .then(res => res.json())
            .then(json => {
              io.emit("change lyrics", json.message.body.lyrics);
            });
        }
      } else {
        const lyrics = {
          lyrics_body: "No lyrics found for: " + searchQuery
        };
        io.emit("change lyrics", lyrics);
      }
    });
  //Put video down, get video title, grab video title, do fetch, do another fetch, place for everyone
}

http.listen(port, function() {
  console.log("Listening on localhost:" + port);
});
