const socket = io();

window.addEventListener("load", () => {
  //Form listener for when messages are send.
  document.getElementById("chatForm").addEventListener("submit", function(e) {
    e.preventDefault();
    if (/\S/.test(document.getElementById("m").value)) {
      socket.emit("chat message", document.getElementById("m").value);
      appendMessage(document.getElementById("m").value);
    }
    document.getElementById("m").value = "";
  });

  //form listener for nickname
  document
    .getElementById("nicknameForm")
    .addEventListener("submit", function(e) {
      e.preventDefault();

      socket.emit("new user", document.getElementById("u").value, function(
        data
      ) {
        if (data == true) {
          document.getElementById("nicknameSection").classList.toggle("hidden");
          document.getElementById("chatSection").classList.toggle("hidden");
          document.body.setAttribute(
            "data-nickname",
            document.getElementById("u").value
          );
          document.getElementById("u").value = "";
        } else {
          document.getElementById("nicknameError").textContent =
            "That username is already taken";
          document.getElementById("u").value = "";
        }
      });
    });
});

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

function appendMessage(msg) {
  const nickname = document.body.dataset.nickname;
  createMessage({
    msg: msg,
    nick: nickname,
    ownMessage: true
  });
}

function createMessage(data) {
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
    node.className = "mine";
  }

  document.getElementById("messages").append(node);
}

//When receiving messages
socket.on("chat message", function(data) {
  createMessage(data);
});

socket.on("userlist", function(data) {
  const userlist = document.getElementById("userlist");
  userlist.textContent = "";

  for (var i = 0; i < data.length; i++) {
    const li = document.createElement("li"),
      text = document.createTextNode(data[i]);
    li.appendChild(text);
    userlist.appendChild(li);
  }
});
