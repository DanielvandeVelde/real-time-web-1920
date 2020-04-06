const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 1337;

app.use(express.static("static"));

app.get("/", function(req, res) {
  res.render("index.html");
});

io.on("connection", function(socket) {
  console.log("a user connected");

  socket.on("disconnect", function() {
    console.log("user disconnected");
  });

  socket.on("chat message", function(msg) {
    io.emit("chat message", msg);
    console.log("message: " + msg);
  });
});

http.listen(port, function() {
  console.log("Listening on localhost:" + port);
});
