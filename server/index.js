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

// Store active rooms
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("scheduleMeeting", ({ meetingId }) => {
    console.log(`Meeting scheduled with ID: ${meetingId}`);
    rooms.set(meetingId, []);
    socket.join(meetingId);
  });

  socket.on("joinMeeting", ({ meetingId }) => {
    console.log(`User ${socket.id} joining meeting: ${meetingId}`);
    if (rooms.has(meetingId)) {
      socket.join(meetingId);
      rooms.get(meetingId).push(socket.id);
      socket.to(meetingId).emit("message", { type: "ready" });
    } else {
      console.log(`Meeting ID ${meetingId} does not exist`);
    }
  });

  socket.on("chat", (message) => {
    const userRooms = Array.from(socket.rooms);
    const meetingRoom = userRooms.find((room) => rooms.has(room));

    if (meetingRoom) {
      socket.to(meetingRoom).emit("message", { type: "chat", message });
    } else {
      console.log("User not in any meeting room");
    }
  });

  socket.on("leaveMeeting", () => {
    const userRooms = Array.from(socket.rooms);
    const meetingRoom = userRooms.find((room) => rooms.has(room));

    if (meetingRoom) {
      socket.leave(meetingRoom);
      rooms.set(
        meetingRoom,
        rooms.get(meetingRoom).filter((id) => id !== socket.id)
      );
      console.log(`User ${socket.id} left meeting: ${meetingRoom}`);
      socket.to(meetingRoom).emit("message", { type: "bye" });
    } else {
      console.log("User not in any meeting room");
    }
  });

  socket.on("message", (message) => {
    const userRooms = Array.from(socket.rooms);
    const meetingRoom = userRooms.find((room) => rooms.has(room));

    if (meetingRoom) {
      socket.to(meetingRoom).emit("message", message);
    } else {
      console.log("User not in any meeting room");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    const userRooms = Array.from(socket.rooms);
    const meetingRoom = userRooms.find((room) => rooms.has(room));

    if (meetingRoom) {
      socket.leave(meetingRoom);
      rooms.set(
        meetingRoom,
        rooms.get(meetingRoom).filter((id) => id !== socket.id)
      );
      console.log(`User ${socket.id} left meeting: ${meetingRoom}`);
      socket.to(meetingRoom).emit("message", { type: "bye" });
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
