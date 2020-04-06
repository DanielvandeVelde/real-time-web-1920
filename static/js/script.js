const socket = io();

window.addEventListener("load", () => {
  //Form listener for when messages are send.
  document.getElementById("form").addEventListener("submit", function(e) {
    e.preventDefault();
    socket.emit("chat message", document.getElementById("m").value);
    document.getElementById("m").value = "";
  });
});

//When receiving messages
socket.on("chat message", function(msg) {
  const node = document.createElement("li");
  const textnode = document.createTextNode(msg);
  node.appendChild(textnode);
  document.getElementById("messages").append(node);
});
