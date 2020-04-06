const socket = io();

window.addEventListener("load", () => {
  document.getElementById("form").addEventListener("submit", function(e) {
    e.preventDefault();
    socket.emit("chat message", document.getElementById("m").value);
    document.getElementById("m").value = "";
  });
});
