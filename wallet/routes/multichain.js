var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();
var requestify = require('requestify'); 
var crypto = require('crypto');

let db = new sqlite3.Database('./db/multichain.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the multicahin database in multichain db.');
    }
});

router.post('/registration', function (req, res) {
    let values = [req.body.userId, req.body.name, req.body.email, req.body.password, "user"];
    var hash = crypto.createHash('md5').update(values[0]+values[1]+values[2]+values[3]+values[4]).digest('hex');
    console.log(hash);
    console.log(-2);
    values[5] = hash;
    
    console.log(-1);
    db.run("INSERT INTO users (id, name, email, password, role, privatekey ) VALUES (?, ?, ?, ?, ?, ?)", values, function (err) {
        
        console.log(0);
        if (err) {
            console.log(1);
            console.log(err.message);
            res.status(500).send(err.toString());
        } else {
            let chainValues = [req.body.userId, req.body.ip, req.body.port, req.body.chain]
            console.log(2);
            db.run("INSERT INTO chaininfo (user_id, ip, port, chain_name, grant) VALUES (?, ?, ?, ?, 'N')", chainValues, function (err) {
                if (err) {
                    console.log(3);
                    console.log(err.message);
                    res.status(500).send(err.toString());
                } else {
                    console.log(4);
                    console.log("data inserted : " + JSON.stringify(req.body));
                    res.json({ "status": "Registration complete", "privateKey":hash });
                }
            });
        }
    });
});

router.post('/change-pass', function (req, res) {
    let values = [req.body.userId, req.body.oldPassword];
    let sql = "SELECT id FROM users WHERE id = ? and password = ?";

    db.get(sql, values, (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else if (!row){
            console.log("User ID or Password doesn't matched");
            res.status(500).send("User ID or Password doesn't matched");
        } else {
            console.log('User varified : ' + values[0])
            let data = [req.body.newPassword, req.body.userId];
            let sql2 = "UPDATE users SET password = ? WHERE id = ?";
            
            db.run(sql2, data, function(err) {
              if (err) {
                return console.error(err.message);
                res.status(500).send("Did not able to update password");
              }
              res.json({"status":"ok"});
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

router.post('/authenticate', function (req, res) {
    let values = [req.body.privateKey];
    let sql = "SELECT name, role, id FROM users WHERE privatekey = ?";
    db.get(sql, values, (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else if (!row){
            console.log("Private key not found");
            res.status(500).send("Authentication error : Private key not found");
        } else {
            console.log('User varified : ' + values[0])
            res.json(row);
        }   
    });
});

router.post('/get-chain-list', function (req, res) {
    let sql = "select * from chaininfo where user_id = ?";
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
                    res.json({"txid":response.getBody()});
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
