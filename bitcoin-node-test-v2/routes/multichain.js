var express = require('express');
var router = express.Router();
var bitcoinClient = require('bitcoin-promise');
const sqlite3 = require('sqlite3').verbose();

//chain-name : 
var client = new bitcoinClient.Client({
    host: 'localhost',
    port: '4344',
    user: 'multichainrpc',
    pass: 'FNRjt9FfNSddde5rBmPFvWDzc62X22c7FLsFFVkek5w3',
    timeout: 10000
});

router.post('/login', function (req, res) {
    let db = new sqlite3.Database('../wallet/db/multichain.db', (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        } else {
            console.log('Connected to the multicahin database in multichain db.');
        }
    });
    let values = [req.body.userId, req.body.password];
    let sql = "SELECT id FROM admin WHERE id = ? and password = ?";

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
    db.close();
});

router.post('/wallet-users', function (req, res) {
    let sql = "SELECT id, name, email, \"role\" FROM users";

    new sqlite3.Database('../wallet/db/multichain.db', (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        } else {
            console.log('Connected to the multicahin database in multichain db.');
        }
    }).all(sql, [], (err, row) => {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else {
            console.log('Successfully data fetched from DB : '+ JSON.stringify(row))
            res.json(row);
        }   
    }).close();
});

router.post('/registration', function (req, res) {
    let db = new sqlite3.Database('../wallet/db/multichain.db', (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        } else {
            console.log('Connected to the multicahin database in multichain db.');
        }
    });
    let values = [req.body.userId, req.body.password, req.body.name, req.body.email];
    db.run("INSERT INTO admin (id, password, name, email) VALUES (?, ?, ?, ?)", values, function (err) {
        if (err) {
            console.log(err.message);
            res.status(500).send(err.toString());
        } else {
            console.log("data inserted : " + JSON.stringify(req.body));
            res.json({ "status": "New Admin Created" });
        }
    });
    db.close();
});

router.post('/change-pass', function (req, res) {
    let db = new sqlite3.Database('../wallet/db/multichain.db', (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        } else {
            console.log('Connected to the multicahin database in multichain db.');
        }
    });
    let values = [req.body.userId, req.body.oldPassword];
    let sql = "SELECT id FROM admin WHERE id = ? and password = ?";

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
            let sql2 = "UPDATE admin SET password = ? WHERE id = ?";
            
            db.run(sql2, data, function(err) {
              if (err) {
                return console.error(err.message);
                res.status(500).send("Did not able to update password");
              }
              res.json({"status":"ok"});
            });
        }   
    });
    db.close();
});

/**
 * Getting transaction information by its txid
 * @param {string} txid Hash representing current transaction.
 * @returns {object} Decoded object representing transaction with current txid.
 */
router.get('/read/:txid', function (req, res) {
    return client.getRawTransaction(req.params.txid)
        .then(function (result) {
            return client.decodeRawTransaction(result);
        })
        .then(function (decoded) {
            res.json(decoded);
        })
        .catch(function (err) {
            res.status(500).send(err.toString())
        })
});

/**
 * Getting current chain block data by its hash or height
 * @param {string / number} block Hash or height representing current block.
 * @returns {object} Object representing block of current chain.
 */
router.get('/read-header/:block', function (req, res) {
    return client.getBlock(req.params.block)
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            res.status(500).send(err.toString())
        })
});


router.get('/get-all-addresses-write', function (req, res) {
    return client.cmd('listpermissions', 'write', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data.map(d => d['address']));
        }
    })
});

router.get('/get-nodes-addresses', function (req, res) {
    return client.cmd('getaddresses', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.get('/get-all-streams', function (req, res) {
    return client.cmd('liststreams', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/subscribe', function (req, res) {
    return client.cmd('subscribe', req.body.stream, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/unsubscribe', function (req, res) {
    return client.cmd('unsubscribe', req.body.stream, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/write', function (req, res) {
    return client.createRawTransaction(req.body.transactionsList, req.body.addresses)
        .then(function (result) {
            return client.decodeRawTransaction(result);
        })
        .then(function (decoded) {
            res.json(decoded);
        })
        .catch(function (err) {
            res.status(500).send(err.toString())
        })
});

router.post('/create-stream', function (req, res) {
    client.cmd('createfrom', req.body.address, 'stream', req.body.stream, true, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json({ 'createtxid': data });
        }
    })
});

router.post('/get-txid', function (req, res) {
    if (!req.body.stream) {
        res.status(500).send("Stream not given in request");
    } else {
        client.cmd('liststreamitems', req.body.stream, function (err, data, resHeaders) {
            if (err) {
                console.log(err);
                res.status(500).send(err.toString());
            } else {
                res.json(data.filter(d => d.txid).map(d => d.txid));
            }
        })
    }
});

function bin2hex(bin) {
    var i = 0, l = bin.length, chr, hex = ''
    for (i; i < l; ++i) {
        chr = bin.charCodeAt(i).toString(16)
        hex += chr.length < 2 ? '0' + chr : chr
    }
    return hex;
}

function hex2bin(hex) {
    var bin = '';
    var i = 0, l = hex.length - 1, bytes = []
    for (i; i < l; i += 2) {
        bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return bin;
}

router.post('/publish-stream', function (req, res) {
    var hex = bin2hex(req.body.data);
    client.cmd('publishfrom', req.body.address, req.body.stream, req.body.key, hex,
        function (err, data, resHeaders) {
            if (err) {
                console.log(err);
                res.status(500).send(err.toString());
            } else {
                res.json(data);
            }
        })
});


router.get('/get-nodes', function (req, res) {
    client.cmd('getpeerinfo', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/view-stream', function (req, res) {
    try {
        client.cmd('getstreamitem', req.body.stream, req.body.txid,
            function (err, data, resHeaders) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err.toString())
                } else {
                    if (data.data && typeof data['data'] === 'string') {
                        data['data'] = hex2bin(data['data']);
                        res.json(data);
                    } else if (data.data && typeof data['data'] === 'object') {
                        client.cmd('gettxoutdata', data['data']['txid'], data['data']['vout'],
                            function (err, blob, resHeaders) {
                                if (err) {
                                    console.log(err);
                                    res.status(500).send(err.toString());
                                } else {
                                    res.json(hex2bin(blob));
                                }
                            })
                    }
                }
            })

    } catch (err) {
        console.log(err);
        res.status(500).send(err.toString());
    }
});

router.post('/grant-permissions', function (req, res) {
    client.cmd(req.body.type, req.body.address, req.body.permission, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/get-permissions', function (req, res) {
    if (!req.body.permission) {
        req.body.permission = '*';
    }
    client.cmd('listpermissions', req.body.permission, req.body.address, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data.map(p => p['type']));
        }
    })
});

router.post('/get-block-list', function (req, res) {
    client.cmd('listblocks', req.body.heights, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            res.json(data);
        }
    })
});

router.post('/get-keys', function (req, res) {
    var batch = req.body.streams.map((d) => { return { method: 'liststreamkeys', params: [d] } })
    list = [];
    client.cmd(batch, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            list.push(data);
        }
    })
});

function updateDb(id, address){
    let db = new sqlite3.Database('../wallet/db/multichain.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    db.run("UPDATE chaininfo SET address = ?, grant = 'Y' where id = ?", [address, id], function (err) {
        if (err) {
            console.log(err.message);
        } else {
            console.log("data updated for id : " + id);
        }
    });
    db.close();

}

router.post('/grant-user', function (req, res) {
    client.cmd('getnewaddress', function (err, address, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            client.cmd('grant', address, 'send,receive,create', function (err, data, resHeaders) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err.toString());
                } else {
                    updateDb(req.body.id, address);
                    res.json(address);
                }
            })
        }
    })
});

router.post('/stream-details', function (req, res) {
    return client.cmd('liststreams', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
            res.status(500).send(err.toString());
        } else {
            time = {};
            keys = {};
            var count = data.length;
            data.map(function (d) {
                if (d['streamref']) {
                    var ref = d['streamref'].split('-');
                    if (ref.length > 0) {
                        client.cmd('listblocks', ref[0], function (err, block, resHeaders) {
                            if (err) time[d.name] = "";
                            else if (block.length > 0) {
                                time[d.name] = block[0].time;
                                client.cmd('liststreamkeys', d.name, function (err, kdata, kHeaders) {
                                    if (err) keys[d.name] = "";
                                    else if (kdata.length > 0)
                                        keys[d.name] = kdata.map(s => s.key + '(' + s.items + ')').join(', ');
                                    else keys[d.name] = "";
                                    count--;
                                    if (count == 0) {
                                        data.forEach((t) => { t.time = time[t.name]; t.keys = keys[t.name]; });
                                        res.json(data);
                                    }
                                });
                            }
                            else time[d.name] = "";
                        })
                    }
                }
            });
        }
    })
});

module.exports = router;
