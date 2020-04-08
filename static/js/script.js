const socket = io();
let player;

window.addEventListener("load", () => {
  //Form listener for nickname
  document
    .getElementById("nicknameForm")
    .addEventListener("submit", function(e) {
      e.preventDefault();

      socket.emit("new user", document.getElementById("u").value, function(
        data
      ) {
        if (data == true) {
          document.getElementById("chatSection").classList.toggle("hidden");
          document.body.setAttribute(
            "data-nickname",
            document.getElementById("u").value
          );
          document.getElementById("u").value = "";
          document.body.removeChild(document.getElementById("nicknameSection"));
        } else {
          document.getElementById("nicknameError").textContent =
            "That username is unavailable";
          document.getElementById("u").value = "";
        }
      });
    });

  //Start YT api wizardry
  function appendYTiframeAPI() {
    const tag = document.createElement("script");
    tag.src = "/js/yt_iframe_api.js";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
  appendYTiframeAPI();

  document.getElementById("progress").addEventListener("input", function(e) {
    e.preventDefault();
    var newTime = player.getDuration() * (e.target.value / 100);
    socket.emit("video to", newTime);
  });

  //Form listener for when messages are send.
  document.getElementById("chatForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let messageValue = document.getElementById("m").value;
    if (/\S/.test(messageValue) && messageValue.length < 2000) {
      if (
        messageValue.startsWith("/help") ||
        messageValue.startsWith("!help")
      ) {
        appendMessage(
          "For help go here: https://github.com/DanielvandeVelde/real-time-web-1920#commands"
        );
        document.getElementById("m").value = "";
        return;
      }
      if (
        messageValue.startsWith("!play") ||
        messageValue.startsWith("/play")
      ) {
        document.getElementById("m").value = "";
        socket.emit("new video", messageValue);
        return;
      }
      socket.emit("chat message", messageValue);
      appendMessage(messageValue);
    }
    document.getElementById("m").value = "";
  });

  //Form listeners for the video
  document.getElementById("playPause").addEventListener("click", function(e) {
    e.preventDefault();
    socket.emit("playpause");
  });
  document.getElementById("mute").addEventListener("click", function(e) {
    e.preventDefault();
    muteOrUnmute();
  });
});

//When yt_iframe_api does its thing
function onYouTubeIframeAPIReady() {
  player = new YT.Player("video-placeholder", {
    width: 600,
    height: 400,
    videoId: "dQw4w9WgXcQ",
    playerVars: {
      color: "white",
      controls: 0,
      disablekb: 1
    },
    events: {
      onReady: timeUpdates,
      onStateChange: onStateChange
    }
  });
}

function timeUpdates() {
  updateTimerDisplay();
  updateProgressBar();
  let time_update_interval;

  if (time_update_interval) {
    clearInterval(time_update_interval);
  }

  time_update_interval = setInterval(function() {
    updateTimerDisplay();
    updateProgressBar();
  }, 1000);
}

function formatTime(time) {
  time = Math.round(time);
  const minutes = Math.floor(time / 60);
  let seconds = time - minutes * 60;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  return minutes + ":" + seconds;
}

function updateTimerDisplay() {
  document.getElementById("current").textContent = formatTime(
    player.getCurrentTime()
  );
  document.getElementById("duration").textContent = formatTime(
    player.getDuration()
  );
}

function updateProgressBar() {
  document.getElementById("progress").value =
    (player.getCurrentTime() / player.getDuration()) * 100;
}

function onStateChange(event) {
  if (event.data == 1) {
    console.log("playing");
  }
  if (event.data == 2) {
    console.log("paused");
  }
}

//Socket :-)
socket.on("chat message", function(data) {
  createChatMessage(data);
});

socket.on("new video", function(data) {
  createVideo(data);
});

socket.on("video to", function(data) {
  setNewTime(data);
});

socket.on("server message", function(data) {
  createServerMessage(data);
});

socket.on("userlist", function(data) {
  createUserlist(data);
});

socket.on("playpause", function(playing) {
  const playPauseButton = document.getElementById("playPause");
  if (playing) {
    player.playVideo();
    playPauseButton.textContent = "Pause";
  } else {
    player.pauseVideo();
    playPauseButton.textContent = "Play";
  }
});

function setNewTime(newTime) {
  player.seekTo(newTime);
}

//Server message
function createServerMessage(data) {
  const node = document.createElement("li");
  const message = document.createTextNode(data.msg);
  node.className = data.type;

  node.appendChild(message);
  document.getElementById("messages").append(node);
}

//Grab the name info without having to do a callback
function appendMessage(msg) {
  const nickname = document.body.dataset.nickname;
  createChatMessage({
    msg: msg,
    nick: nickname,
    ownMessage: true
  });
}

//Creating and appending the message
function createChatMessage(data) {
  const node = document.createElement("li");
  const nameElement = document.createElement("p");
  const messageElement = document.createElement("blockquote");
  const currentTime = document.createTextNode(getTime());
  const timeSpan = document.createElement("span");
  const messageText = document.createTextNode(data.msg);
  const nameText = document.createTextNode(data.nick);

  messageElement.appendChild(messageText);
  nameElement.appendChild(nameText);
  timeSpan.appendChild(currentTime);
  nameElement.appendChild(timeSpan);
  node.appendChild(nameElement);
  node.appendChild(messageElement);

  if (data.ownMessage) {
    node.className = "me";
  } else {
    node.className = "you";
  }

  document.getElementById("messages").append(node);
}

//Timestamps to get local time and date
function getTime() {
  var currentdate = new Date();
  var datetime =
    String(currentdate.getDate()).padStart(2, "0") +
    "/" +
    String(currentdate.getMonth() + 1).padStart(2, "0") +
    "/" +
    currentdate.getFullYear() +
    " " +
    String(currentdate.getHours()).padStart(2, "0") +
    ":" +
    String(currentdate.getMinutes()).padStart(2, "0") +
    ":" +
    String(currentdate.getSeconds()).padStart(2, "0");

  return datetime;
}

function createUserlist(data) {
  const details = document.getElementsByTagName("details")[0];
  const summary = document.getElementsByTagName("summary")[0];
  const userlist = document.getElementById("userlist");
  const summaryText = data.length + " user(s) online";
  userlist.textContent = "";

  summary.textContent = summaryText;

  for (var i = 0; i < data.length; i++) {
    const li = document.createElement("li"),
      text = document.createTextNode(data[i]);
    li.appendChild(text);
    userlist.appendChild(li);
  }
}

//For when a new video comes in
function createVideo(data) {
  player.cueVideoById(data);
  player.playVideo();
}

function muteOrUnmute() {
  if (player.isMuted()) {
    document.getElementById("mute").textContent = "Mute";
    player.unMute();
  } else {
    document.getElementById("mute").textContent = "Unmute";
    player.mute();
  }
}
