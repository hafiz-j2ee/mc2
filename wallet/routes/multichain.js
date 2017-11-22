var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();
var requestify = require('requestify'); 

let db = new sqlite3.Database('./db/multichain.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the multicahin database in multichain db.');
    }
});

router.post('/registration', function (req, res) {
    let values = [req.body.userId, req.body.name, req.body.email, req.body.password, "user"];
    db.run("INSERT INTO users (id, name, email, password, role ) VALUES (?, ?, ?, ?, ?)", values, function (err) {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else {
            let chainValues = [req.body.userId, req.body.ip, req.body.port, req.body.chain]
            db.run("INSERT INTO chaininfo (user_id, ip, port, chain_name, grant) VALUES (?, ?, ?, ?, 'N')", chainValues, function (err) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send(err.toString());
                } else {
                    console.log("data inserted : " + JSON.stringify(req.body));
                    res.json({ "status": "Registration complete" });
                }
            });
        }
    });
});

router.post('/login', function (req, res) {
    let values = [req.body.userId, req.body.password];
    let sql = "SELECT name, role, id FROM users WHERE id = ? and password = ?";

    db.get(sql, values, (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else if (!row){
            console.log("User ID or Password doesn't matched");
            res.status(500).send("User ID or Password doesn't matched");
        } else {
            console.log('User varified : ' + values[0])
            res.json(row);
        }   
    });
});

router.post('/get-chain-list', function (req, res) {
    let sql = "select * from chaininfo where user_id = ?";
    console.log(req.body.id);
    db.all(sql, [req.body.id], (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else if (!row){
            res.json([]);;
        } else {
            res.json(row);
        } 
    });
});

router.post('/get-published-data-list', function (req, res) {
    let sql = "select * from published_data where user_id = ?";
    db.all(sql, [req.body.id], (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else if (!row){
            res.json([]);;
        } else {
            res.json(row);
        } 
    });
});

router.post('/get-received-data-list', function (req, res) {
    let sql = "select * from received_data where receiver_id = ?";
    console.log(req.body);
    db.all(sql, [req.body.id], (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else if (!row){
            res.json([]);;
        } else {
            res.json(row);
        } 
    });
});

router.post('/send-data', function (req, res) {
    let sql = "INSERT INTO received_data (receiver_id, sender_id, chain_id, stream, \"key\", tx_id) "
               + "SELECT '"+req.body.userId+"', user_id, chain_id, stream, \"key\", tx_id "
               + "FROM published_data WHERE id = ?;";
    db.run(sql, req.body.id, function (err) {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else {
            console.log("data send");
            res.json({'success':"OK"})
        }
    });
});

router.post('/publish-stream', function (req, res) {
    let sql = "SELECT ip, port, address, user_id FROM chaininfo WHERE id = ? and \"grant\" = 'Y'";

    db.get(sql, [req.body.id], (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else if (!row){
            console.log("Your account is not granted yet");
            res.status(500).send("Your account is not granted yet");
        } else {
            console.log('Information found : ' + JSON.stringify(row));
            let data = {address : row.address, stream : req.body.stream, key : req.body.key, data : req.body.data};
            let url = "http://"+row.ip+":"+row.port+"/mc/publish-stream";
            requestify.post(url, data)
                .then(function(response) {
                    console.log(response.getBody());
                    let pData = [row.user_id, req.body.id, req.body.stream, req.body.key, response.getBody()];
                    db.run("INSERT INTO published_data (user_id, chain_id, stream, key, tx_id) VALUES (?, ?, ?, ?, ?)", pData, function (err) {
                        if (err) {
                            console.log(err.message);
                            res.status(500).send(err.toString());
                        } else {
                            console.log("data publisdhed data inserted ");
                        }
                    });
                    res.json(response.getBody());
                }); 
        }   
    });
});

router.post('/view-stream', function (req, res) {
    let sql = "SELECT ip, port, address FROM chaininfo WHERE id = ? and \"grant\" = 'Y'";

    db.get(sql, [req.body.id], (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else if (!row){
            console.log("Your account is not granted yet");
            res.status(500).send("Your account is not granted yet");
        } else {
            console.log('Information found : ' + JSON.stringify(row));
            let data = {stream : req.body.stream, txid : req.body.txid};
            let url = "http://"+row.ip+":"+row.port+"/mc/view-stream";
            requestify.post(url, data)
                .then(function(response) {
                    res.json(response.getBody());
                }); 
        }   
    });
});

module.exports = router;
