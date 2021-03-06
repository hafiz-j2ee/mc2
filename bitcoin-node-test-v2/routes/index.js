var express = require('express');
var router = express.Router();
var request = require('request');
const sqlite3 = require('sqlite3').verbose();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('stream-details', {title: 'Enfusion'});
});

router.get('/wallet-users', function (req, res, next) {
    res.render('wallet-users', {title: 'Enfusion'});
});

/* GET home page. */
router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Enfusion'});
});

/* GET home page. */
router.get('/change-pass', function (req, res, next) {
    res.render('changePass', {title: 'Enfusion'});
});

router.get('/registration', function (req, res, next) {
    res.render('registration', {title: 'Enfusion'});
});

/* GET create stream page. */
router.get('/create-stream', function (req, res, next) {
    res.render('create-stream', {title: 'Enfusion'});
});

/* GET publish stream page. */
router.get('/publish-stream', function (req, res, next) {
    res.render('publish-stream', {title: 'Enfusion'});
});

/* GET view stream page. */
router.get('/view-stream', function (req, res, next) {
    res.render('view-stream', {title: 'Enfusion'});
});

router.get('/permissions', function (req, res, next) {
    res.render('permissions', {title: 'Enfusion'});
});

/* GET view nodes page. */
router.get('/view-nodes', function (req, res, next) {
    request("http://localhost:3000/mc/get-nodes", function (err, response, body) {
        if (err) {
            res.render('nodes', {title: 'Enfusion'});
        } else {
            body = JSON.parse(body);
            if (body.length > 0){
                 res.render('nodes', { nodes: body, title: 'Enfusion'});
            } else {
                res.render('nodes', {title: 'Enfusion'});
            }
        }
    })
});

/* GET view streams page. */
router.get('/transactions', function (req, res, next) {
    res.render('transactions');
});


router.get('/wallet', function (req, res, next) {
    let sql = `SELECT c.id, user_id, chain_name, u.name, u.email 
                FROM chaininfo c JOIN users u on c.user_id = u.id 
                WHERE c."grant" = 'N' or c."grant" is NULL;`;
    new sqlite3.Database('../wallet/db/multichain.db', (err) => { if (err) console.error(err.message)})
    .all(sql, [], (err, rows) => {
        if (err) {
            console.log(err);
            res.render('wallet');
        } else {
            console.log(rows);
            res.render('wallet', { rows: rows});
        }
    }).close();
});

module.exports = router;
