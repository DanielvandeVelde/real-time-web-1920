const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
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
      io.emit("userlist", nicknames);
      io.emit("server message", {
        msg: `${socket.nickname} connected`,
        type: "connect"
      });
    }
  });

  socket.on("new video", function(data) {
    io.emit("new video", data);
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
    socket.broadcast.emit("chat message", { msg: data, nick: socket.nickname });
  });
});

http.listen(port, function() {
  console.log("Listening on localhost:" + port);
});
