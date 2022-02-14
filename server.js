'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const app = express();
const passport = require('passport');
const session = require("express-session")
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const passportSocketIo = require('passport.socketio')
const MongoStore = require('connect-mongo')(session)
const cookieParser = require('cookie-parser')
const store = new MongoStore({ url: process.env.MONGO_URI });
const routes = require('./routes.js')
const auth = require('./auth.js')
fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug')


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))
app.use(passport.initialize())
app.use(passport.session())
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'experss.sid',
  secret: process.env.SESSION_SECRET,
  store: store,
  succss: onAuthorizeSuccess,
  fail: onAuthorizeFail
}))
myDB(async (client) => {
  const myDataBase = await client.db('myFirstDatabase').collection('users')
  let currentUsers = 0;
  io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user', {
      name: io.request.user.name,
      currentUsers,
      connected: true
    });
    console.log('A user has connected');
     socket.on('chat message', (message) => {
      io.emit('chat message', { name: socket.request.user.name, message });
    });
    socket.on('disconnect', () => {
      --currentUsers
      io.emit('user', {
        name: io.request.user.name,
        currentUsers,
        connected: false
      });

      console.log('A user has disconnected')
    })

  });
  routes(app, myDataBase);
  auth(app, myDataBase);

}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
function onAuthorizeSuccess(data, accept) {
  console.log('success', data, accept)
}
function onAuthorizeFail(data, message, accept, error) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}
