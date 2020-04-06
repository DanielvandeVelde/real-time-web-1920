const socket = io();

window.addEventListener("load", () => {
  //Form listener for when messages are send.
  document.getElementById("chatForm").addEventListener("submit", function(e) {
    e.preventDefault();
    socket.emit("chat message", document.getElementById("m").value);
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
        } else {
          document.getElementById("nicknameError").textContent =
            "That username is already taken";
        }
      });
      document.getElementById("u").value = "";
    });
});

//When receiving messages
socket.on("chat message", function(data) {
  const node = document.createElement("li");
  const textnode = document.createTextNode(data.nick + ": " + data.msg);
  node.appendChild(textnode);
  document.getElementById("messages").append(node);
});

socket.on("userlist", function(data) {
  const userlist = document.getElementById("userlist");
  let rawHTML = "";
  for (var i = 0; i < data.length; i++) {
    rawHTML += "<li>" + data[i] + "</li>";
  }
  userlist.textContent = "";
  userlist.insertAdjacentHTML("beforeend", rawHTML);
});
