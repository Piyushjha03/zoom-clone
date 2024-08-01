import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
dotenv.config();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("message", (message) => {
    socket.broadcast.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

io.listen(3001, () => {
  console.log("Socket.io server is running on http://localhost:3001");
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
