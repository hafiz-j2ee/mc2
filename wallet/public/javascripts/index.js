$(function () {

    getChainList();
    getPublishedData();
    getReceivedData();
    var overlay = $('.overlay');
    var header = $('.overlay-header');
    var content = $('.overlay-content');
    var download = $('#download');

    $('#create-stream-form').on('submit', createStream);
    $('#registration-form').on('submit', registration);
    $('#login-form').on('submit', login);
    $('#publish-stream-form').on('submit', publishStream);
    $('#view-stream-form').on('submit', viewStream);

    function registration(e) {
        e.preventDefault();
        var name = $('#name').val();
        var email = $('#email').val();
        var userId = $('#user-id').val();
        var password = $('#password').val();
        var ip = $('#ip').val();
        var port = $('#port').val();
        var chain = $('#chain').val();

        var params = { name: name, email: email, userId: userId, password: password, ip: ip, port: port, chain: chain };
        console.log(params);
        $.ajax({
            type: 'POST',
            url: '/mc/registration',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                alert(data.status);
                window.location.href = '/login';
            })
            .catch(function (err) {
                displayResponse(err, 'ERROR!!!', true);
            })
    }

    function login(e) {
        e.preventDefault();
        var userId = $('#user-id').val();
        var password = $('#password').val();

        var params = { userId: userId, password: password };

        $.ajax({
            type: 'POST',
            url: '/mc/login',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                localStorage['multichain-id'] = data.id;
                window.location.href = '/dashboard';
            })
            .catch(function (err) {
                alert(data.status);
                window.location.href = '/login';
            })
    }

    function createStream(e) {
        e.preventDefault();
        var address = $('#address-create').val();
        var stream = $('#stream-name-create').val();
        var params = { address: address, stream: stream };
        $.ajax({
            type: 'POST',
            url: '/mc/create-stream',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (datao) {
                $.ajax({
                    type: 'POST',
                    url: '/mc/subscribe',
                    data: JSON.stringify(params),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                })
                    .then(function (data) {
                        console.log(data);
                        displayResponse(datao, 'Stream Created');
                    })
                    .catch(function (err) {
                        console.log(err);
                    })

            })
            .catch(function (err) {
                displayResponse(err, 'ERROR!!!', true);
            })
    }

    function publishStream(e) {
        e.preventDefault();
        var id = $('#id').val();
        var stream = $('#stream-name').val();
        var key = $('#stream-key').val();
        var data = $('#stream-data-text').val();
        var files = document.getElementById('files').files;

        if (files.length > 0) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var text = files[0].name+'<,,>'+reader.result;
                var params = { id: id, stream: stream, data: text, key: key };
                $.ajax({
                    type: 'POST',
                    url: '/mc/publish-stream',
                    data: JSON.stringify(params),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                })
                    .then(function (data) {
                        alert('Stream Published. TX ID : '+ data);
                    })
                    .catch(function (err) {
                        alert('ERROR!!! ' + JSON.stringify(err));
                    })
            }
            reader.readAsDataURL(files[0]);
            // reader.readAsArrayBuffer(files[0]);
        } else {
            var params = { id: id, stream: stream, data: data, key: key };
            $.ajax({
                type: 'POST',
                url: '/mc/publish-stream',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    alert('Stream Published');
                })
                .catch(function (err) {
                    alert('ERROR!!! ' + err);
                })
        }
    }

    
    function viewStream(e) {
        e.preventDefault();
        var id = $('#id').val();
        var txid = $('#txid').val();
        var stream = $('#stream-name').val();
        var params = { id: id, txid: txid, stream: stream };
        $.ajax({
            type: 'POST',
            url: '/mc/view-stream',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                if (data && typeof data === 'string') {
                    var d=data.split('<,,>');
                    var encodedUri = encodeURI(d[1]);
                    download.attr('href', encodedUri);
                    download.attr("download", d[0]);
                    download.text("Download");
                    download.show();
                    $('#text-show-div').hide()
                } else {
                    console.log(data);
                    download.hide();
                    $('#stream-data-show').attr('readonly', true);
                    $('#stream-data-show').val(data.data);
                    $('#text-show-div').show();
                    var encodedUri = encodeURI("data:text/csv;charset=utf-8,"+data.data);
                    $('#export').attr('href', encodedUri);
                    $('#export').attr("download", data.key+".txt");
                    // displayResponse(data, 'View Stream');
                }
            })
            .catch(function (err) {
                allert('ERROR!!!' + JSON.stringify(err));
            })
    }
 
    function getChainList(){
        let table = $('#chain-list-table tbody');
        if (table){
            $.ajax({
                type: 'POST',
                url: '/mc/get-chain-list',
                data: JSON.stringify({id : localStorage['multichain-id'] }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
            .then(function (data) {
                console.log(data);
                table.empty();
                table.append(data.map(function (d) {
                    return "<tr><td>"+d['ip']+"</td><td>"+d['port']+"</td><td>"+d['chain_name']+"</td><td>"+d['address']+
                    "</td><td>"+d['grant']+"</td><td><a href='/publish-stream/"+d['id']+"'>Publish Stream</></td></tr>";
                }));
            })
            .catch(function (err) {
                table.empty();
                alert(JSON.stringify(err));
            })
        } else {
            console.log("Table not found")
        }
    }

    function getPublishedData(){
        let table = $('#published-data-table tbody');
        if (table){
            $.ajax({
                type: 'POST',
                url: '/mc/get-published-data-list',
                data: JSON.stringify({id : localStorage['multichain-id'] }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
            .then(function (data) {
                console.log(data);
                table.empty();
                table.append(data.map(function (d) {
                    return "<tr><td>"+d['stream']+"</td><td>"+d['key']+"</td><td>"+d['tx_id']
                    +"</td><td><a href='/view-stream/"+d['chain_id']+"/"+d['stream']+"/"+d['tx_id']+"'>View Stream</></td><td>"
                    +"<button onclick=$(this).sendData('" + d['id'] + "')>Send</button></td></tr>";
                }));
            })
            .catch(function (err) {
                table.empty();
                alert(JSON.stringify(err));
            })
        } else {
            console.log("Table not found")
        }
    }

    function getReceivedData(){
        let table = $('#received-data-table tbody');
        if (table){
            $.ajax({
                type: 'POST',
                url: '/mc/get-received-data-list',
                data: JSON.stringify({id : localStorage['multichain-id'] }),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
            .then(function (data) {
                console.log(data);
                table.empty();
                table.append(data.map(function (d) {
                    return "<tr><td>"+d['sender_id']+"</td><td>"+d['stream']+"</td><td>"+d['key']+"</td><td>"+d['tx_id']
                    +"</td><td><a href='/view-stream/"+d['chain_id']+"/"+d['stream']+"/"+d['tx_id']+"'>View Stream</></td></tr>";
                }));
            })
            .catch(function (err) {
                table.empty();
                alert(JSON.stringify(err));
            })
        } else {
            console.log("Table not found")
        }
    }

    $.fn.sendData = function (id) {
        var user_id = prompt("Please enter receiver id")
        var params = { userId: user_id, id: id };
        console.log(params);
            $.ajax({
                type: 'POST',
                url: '/mc/send-data',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    alert("Data send to "+user_id);
                })
                .catch(function (err) {
                    console.log(err);
                    alert(err);
                })
    };

});