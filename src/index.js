import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import http from "http";
import SocketIO from "socket.io";

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());

const serverListening = () => {
  console.log(`# server is running : http://localhost:${PORT}`);
};

const httpServer = http.createServer(app);
const io = SocketIO(httpServer);
httpServer.listen(PORT, serverListening);

const getSids = () => {
  const ids = [];
  const { sids, rooms } = io.of("/").adapter;

  rooms.forEach((_, key) => {
    if (sids.get(key)) {
      ids.push(key);
    }
  });

  return ids;
};

const getUserRooms = () => {
  const userRooms = [];
  const { sids, rooms } = io.of("/").adapter;
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      userRooms.push(key);
    }
  });

  return userRooms;
};

const updateRoomList = () => {
  const ids = getSids();
  const userRooms = getUserRooms();

  ids.forEach(id => io.to(id).emit("updateRooms", userRooms));
};

io.on("connection", socket => {
  socket.on("leave-room", (roomName, done) => {
    socket.leave(roomName);
    done();
    const rooms = getUserRooms();
    if (!rooms.includes(roomName)) {
      io.emit("remove-room", roomName);
    }
  });

  socket.on("message", (msg, roomName, done) => {
    done();
    socket.broadcast.to(roomName).emit("message", msg);
  });

  socket.on("join-room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket
      .to(roomName)
      .emit("join-msg", `${socket["nickname"]}님께서 입장하셨습니다. !!!`);
  });

  socket.on("login", () => {
    io.to(socket.id).emit("updateRooms", getUserRooms());
  });

  socket.on("create-room", (roomName, done) => {
    socket.join(roomName);
    done();
    updateRoomList();
  });

  socket.on("nickname", (nickname, done) => {
    socket["nickname"] = nickname;
    done();
  });
});
