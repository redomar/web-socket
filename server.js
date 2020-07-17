'use strict';

const socketIO = require('socket.io');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const server = http.Server(app);

const io = socketIO.listen(server);

app.get('/', (req, res) => {
  res.send('hello');
});

io.sockets.on('connection', function (socket) {

  // convenience function to log server messages on the client
  function log() {
    console.log(arguments)
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function (message, room) {
    log(`Client ${socket.id} said: `, message);
    // for a real app, would be room-only (not broadcast)
    socket.to(room).emit('message', message);
  });

  socket.on('join', function (room) {
    log('Received request to join room ' + room);
    if (socket.handshake.query.room) {
      socket.leave(socket.handshake.query.room);
    }

    let clientsInRoom = io.sockets.adapter.rooms[room];
    let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' currently has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.handshake.query.room = room;
      socket.emit('on-join', true);
    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      socket.join(room);
      socket.handshake.query.room = room;
      socket.emit('on-join', true);
    } else { // max two clients
      socket.emit('on-join', false);
    }
  });

  // TODO: remove
  socket.on('call', function (offer) {
    if (socket.handshake.query.room) {
      log('Forwarding offer')
      socket.to(socket.handshake.query.room).emit('on-call', offer);
    } else {
      log('Who r u?');
    }
  });

  socket.on('answer', (answer) => {
    if (socket.handshake.query.room) {
      log('Forwarding answer')
      socket.to(socket.handshake.query.room).emit('on-answer', answer);
    } else {
      log('Who r u?');
    }
  });

  socket.on('candidate', (candidate) => {
    if (socket.handshake.query.room) {
      log('Forwarding candidate')
      socket.to(socket.handshake.query.room).emit('on-candidate', candidate);
    } else {
      log('Who r u?');
    }
  });

  socket.on('disconnect', () => {
    log('disconnecting');
    socket.disconnect();
  });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log('running on ' + PORT);
});
