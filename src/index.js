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

io.on("connection", socket => {
  socket.on("nickname", (nickname, done) => {
    socket["nickname"] = nickname;
    done();
  });
});
