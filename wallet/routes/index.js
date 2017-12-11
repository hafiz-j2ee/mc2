var express = require('express');
var router = express.Router();
var request = require('request');
const sqlite3 = require('sqlite3').verbose();

/* GET home page. */
router.get('/connection', function (req, res, next) {
    res.render('connection');
});

router.get('/change-pass', function (req, res, next) {
    res.render('changePass');
});
/* GET create stream page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

router.get('/registration', function (req, res, next) {
    res.render('registration');
});

router.get('/login', function (req, res, next) {
    res.render('login');
});

router.get('/dashboard', function (req, res, next) {
     res.render('dashboard');
});

router.get('/published-data', function (req, res, next) {
     res.render('published-data');
});

router.get('/received-data', function (req, res, next) {
     res.render('received-data');
});


router.get('/publish-stream/:id', function (req, res, next) {
    res.render('publish-stream', { id: req.params.id});
});

router.get('/view-stream/:id/:stream/:txid', function (req, res, next) {
    res.render('view-stream', { id: req.params.id, stream: req.params.stream, txid: req.params.txid  });
});


module.exports = router;
