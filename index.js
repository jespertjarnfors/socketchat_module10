const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Global variables needed to display connected as well as typing users
const connectedUsers = {};
const typingUsers = {};

// Function to handle viewing online users
function updateOnlineUsers() {
  const onlineUsers = Object.keys(connectedUsers);
  io.emit("updateOnlineUsers", onlineUsers);
}

// Function to update the list of typing users
function updateTypingStatus() {
  const typingUsersList = Object.keys(typingUsers);
  if (typingUsersList.length > 0) {
    const typingMessage = `${typingUsersList.join(", ")} ${
      typingUsersList.length > 1 ? "are" : "is"
    } typing...`;
    io.emit("updateTypingStatus", typingMessage);
  } else {
    io.emit("updateTypingStatus", "");
  }
}

io.on("connection", (socket) => {
  // Emits a message when a user connects

  // Handle setting username
  socket.on("setUsername", (username) => {
    if (!connectedUsers[username]) {
      // Username is available, set it and notify the client
      socket.username = username;
      connectedUsers[username] = socket.id;
      io.emit("userJoined", `${username} joined the chat`);
      updateOnlineUsers();
    } else {
      // Username is already taken, notify the client
      socket.emit(
        "usernameError",
        "Username is already taken. Please choose another."
      );
    }
  });

  // Handle typing events
  socket.on("startTyping", () => {
    typingUsers[socket.username] = true;
    updateTypingStatus();
  });

  socket.on("stopTyping", () => {
    delete typingUsers[socket.username];
    updateTypingStatus();
  });

  // Handle chat messages
  socket.on("chat message", (msg) => {
    io.emit("chat message", `${socket.username}: ` + msg);
  });

  // Emit a message when a user disconnects
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.username}`);
    if (socket.username) {
      delete connectedUsers[socket.username];
      io.emit("userLeft", `${socket.username} left the chat`);
      updateOnlineUsers();
    }
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
