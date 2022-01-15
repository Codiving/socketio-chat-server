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
  socket.on("login", () => {
    io.to(socket.id).emit("updateRooms", getUserRooms());
  });

  socket.on("create-room", (roomName, done) => {
    console.log("create-room", roomName);
    socket.join(roomName);
    done();
    updateRoomList();
  });

  socket.on("nickname", (nickname, done) => {
    socket["nickname"] = nickname;
    done();
  });
});
