var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const formidable = require('express-formidable');
const sqlite3 = require('sqlite3').verbose();


var index = require('./routes/index');
var multichain = require('./routes/multichain');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

app.use('/', index);
app.use('/mc', multichain);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

 
// open the database
let db = new sqlite3.Database('./db/multichain.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the multicahin database.');
  }
});
 
db.serialize(() => {
  // creating tables
  db.run('CREATE TABLE IF NOT EXISTS users (id TEXT(50) primary key, name TEXT(50), email TEXT(50), password TEXT(50), role TEXT(50));')
    .run('CREATE TABLE IF NOT EXISTS chaininfo (id INTEGER primary key AUTOINCREMENT, user_id TEXT(50), ip TEXT(50), port TEXT(50), chain_name TEXT(100), address TEXT, grant TEXT(1));')
    .run('CREATE TABLE IF NOT EXISTS published_data (id INTEGER primary key AUTOINCREMENT, user_id TEXT(50), chain_id TEXT(50), stream TEXT(50), key TEXT(50), tx_id TEXT(500));')
    .run('CREATE TABLE IF NOT EXISTS received_data (id INTEGER primary key AUTOINCREMENT, receiver_id TEXT(50), sender_id TEXT(50), chain_id TEXT(50), stream TEXT(50), key TEXT(50), tx_id TEXT(500));')
  console.log("Table created")
  });
 
// db.close((err) => {
//   if (err) {
//     console.error(err.message);
//   }
//   console.log('Close the database connection.');
// });

module.exports = app;
