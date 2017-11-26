$(function () {
    if(window.location.href.lastIndexOf('login') == -1 && !localStorage['admin-id']){
        window.location.href = '/login';
    }
    getNodesAddress();
    getSubscribeStreams();
    getAllStreams();
    var overlay = $('.overlay');
    var header = $('.overlay-header');
    var content = $('.overlay-content');
    var download = $('#download');
    var addresses = [];
    var streams = [];

    $('#create-stream-form').on('submit', createStream);
    $('#publish-stream-form').on('submit', publishStream);
    $('#view-stream-form').on('submit', viewStream);
    $('#read-form').on('submit', readTransaction);
    $('#read-headers-form').on('submit', readHeaders);
    $('#write-form').on('submit', writeTransaction);
    $('.overlay-btn').on('click', closeOverlay);
    $('#address-refresh-create').on('click', getNodesAddress);
    $('#stream-refresh').on('click', getSubscribeStreams);
    $('#stream-name').on('change', getTxId);
    $('#txid-refresh').on('click', getTxId);
    $('#grant-permissions-form').on('submit', grantPermission);
    $('#stream-write-permissions-form').on('submit', grantWritePermission);
    $('#nodes-address').on('blur', getPermissions);
    $('#stream-name-write').on('change', checkWritePermissions);
    $('#login-form').on('submit', login);
    $('#update-pass-form').on('submit', changePass);
    $('#logout').on('click', logout);
    $("#admin-name").text(localStorage['admin-id']);

    function logout(){
        localStorage['admin-id'] = '';
        window.location.href = '/login';
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
                localStorage['admin-id'] = data.id;
                $("#admin-name").text(data.id);
                window.location.href = '/';
            })
            .catch(function (err) {
                alert("User Id or password did not matched");
                window.location.href = '/login';
            })
    }

    function changePass(e) {
        e.preventDefault();
        var userId = $('#user-id').val();
        var oldPassword = $('#old-password').val();
        var newPassword = $('#new-password').val();
        var params = { userId: userId, oldPassword: oldPassword, newPassword: newPassword };
        
        $.ajax({
            type: 'POST',
            url: '/mc/change-pass',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                alert("Password successfully updated");
                window.location.href = '/';
            })
            .catch(function (err) {
                alert(data.status);
            })
    }

    function getNodesAddress() {
        $.get('/mc/get-nodes-addresses')
            .then(function (data) {
                addresses = data;
                $('#address-create').empty();
                $('#address-create').append(addresses.map(d => "<option value=" + d + ">" + d + "</option>").join("\n"));
            })
            .catch(function (err) {
                $('#address-create').empty();
                alert(JSON.stringify(err));
            })
    }

    function getAddressWithWritePermission() {
        $.get('/mc/get-all-addresses-write')
            .then(function (data) {
                addresses = data;
                $('#address').empty();
                $('#address').append(addresses.map(d => "<option value=" + d + ">" + d + "</option>").join("\n"));
            })
            .catch(function (err) {
                $('#address').empty();
                alert(JSON.stringify(err));
            })
    }

    function getSubscribeStreams() {
        $.get('/mc/get-all-streams')
            .then(function (data) {
                streams = data.filter(s => s['subscribed']);
                $('#stream-name').empty();
                $('#stream-name').append(streams.map(d =>
                    "<option value=" + d['name'] + ">" + d['name'] + "</option>").join("\n"));
                $('#total-stream').empty();
                $('#total-stream').text("Total stream : " + streams.length);
            })
            .catch(function (err) {
                $('#stream-name').empty();
                $('#total-stream').empty();
                alert(JSON.stringify(err));
            })
    }

    function getAllStreams() {
        $.get('/mc/get-all-streams')
            .then(function (data) {
                $('#stream-name-write').empty();
                $('#stream-name-write').append(streams.map(d =>
                    "<option value=" + d['name'] + ">" + d['name'] + "</option>").join("\n"));
            })
            .catch(function (err) {
                $('#stream-name-write').empty();
                alert(JSON.stringify(err));
            })
    }
    //  $('##stream-subscription-table').append(streams.map(d =>
    //                     "<tr><td>"+d['name']+"</td><td>"+d['subscribed'] ? 'Unsubscribe' : 'Subscribe' + "</td></tr>").join("\n"));

    function getStreams() {
        $.get('/mc/get-all-streams')
            .then(function (data) {
                $('#stream-subscription-table').empty();
                var table = $("<table></table>").attr({
                    "class": "table table-striped table-bordered table-hover table-condensed",
                    "style": "text-align:center", "width": "50%"
                })
                var tableBody = $("<tbody></tbody>");
                // tableBody.append("<tr><th>Stream Name</th><th>Action</th></tr>");
                tableBody.append(data.map(function (d) {
                    var name = $("<td></td>").html(d['subscribed'] ? "<span class='glyphicon glyphicon-ok' style='color:#6ec633'></span>  " + d['name'] : d['name']);
                    var btn = $("<button></button>").attr("onclick", "$(this).changeSubscription('" + d['name'] + "', " + d['subscribed'] + ")").text(d['subscribed'] ? 'Unsubscribe' : 'Subscribe');
                    var action = $("<td></td>").append(btn);
                    return $("<tr></tr>").append(name, action);
                }));
                $('#stream-subscription-table').append(table.append(tableBody));
            })
            .catch(function (err) {
                $('#stream-subscription-table').empty();
                alert(JSON.stringify(err));
            })
    };

    $("#show-subscription").click(getStreams);


    function readHeaders(e) {
        e.preventDefault();
        var blockParam = $('#read-headers-input').val();
        if (blockParam) {
            $.get('/mc/read-header/' + blockParam)
                .then(function (data) {
                    displayResponse(data, 'Block ' + blockParam + ' Headers');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }
    }

    function readTransaction(e) {
        e.preventDefault();
        var txid = $('#read-input').val();
        if (txid) {
            $.get('/mc/read/' + txid)
                .then(function (data) {
                    displayResponse(data, 'Transaction txid: ' + txid);
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }

    }

    function writeTransaction(e) {
        e.preventDefault();
        var transaction = $('#write-input').val();
        if (transaction) {
            transaction = transaction.split(';');
            var params = {
                transactionsList: JSON.parse(transaction[0]),
                addresses: transaction[1] ? JSON.parse(transaction[1]) : null
            };
            $.ajax({
                type: 'POST',
                url: '/mc/write',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    displayResponse(data, 'Transaction has been written');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }
    }

    function getTxId() {
        var stream = $('#stream-name').val();
        if (stream) {
            var params = { stream: stream };
            $.ajax({
                type: 'POST',
                url: '/mc/get-txid',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    $('#txid').empty();
                    $('#txid').append(data.map(d => "<option value=" + d + ">" + d + "</option>").join("\n"));
                })
                .catch(function (err) {
                    $('#txid').empty();
                    displayResponse(err, 'ERROR!!!', true);
                })
        } else {
            alert("Please select a stream")
        }
    }

    function streamSubscription(url, stream) {
        if (url && stream) {
            var params = { stream: stream };
            $.ajax({
                type: 'POST',
                url: '/mc/' + url,
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    getStreams();
                })
                .catch(function (err) {
                    alert(err);
                })
        } else {
            alert("Invalid request")
        }
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
        var address = $('#address-create').val();
        var stream = $('#stream-name').val();
        var key = $('#stream-key').val();
        var data = $('#stream-data-text').val();
        var files = document.getElementById('files').files;

        if (files.length > 0) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var text = files[0].name+'<,,>'+reader.result;
                // console.log(text.toString());
                var params = { address: address, stream: stream, data: text, key: key };
                $.ajax({
                    type: 'POST',
                    url: '/mc/publish-stream',
                    data: JSON.stringify(params),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                })
                    .then(function (data) {
                        displayResponse(data, 'Stream Published');
                    })
                    .catch(function (err) {
                        displayResponse(err, 'ERROR!!!', true);
                    })
            }
            reader.readAsDataURL(files[0]);
            // reader.readAsArrayBuffer(files[0]);
        } else {
            var params = { address: address, stream: stream, data: data, key: key };
            $.ajax({
                type: 'POST',
                url: '/mc/publish-stream',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    displayResponse(data, 'Stream Published');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }
    }

    function viewStream(e) {
        e.preventDefault();
        var txid = $('#txid').val();
        var stream = $('#stream-name').val();
        var params = { txid: txid, stream: stream };
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
                    $('#hidden-key').val(data.key);
                    $('#hidden-publisher').val(data.publishers[0]);
                    $('#text-show-div').show();
                    var encodedUri = encodeURI("data:text/csv;charset=utf-8,"+data.data);
                    $('#export').attr('href', encodedUri);
                    $('#export').attr("download", data.key+".txt");
                    // displayResponse(data, 'View Stream');
                }
            })
            .catch(function (err) {
                displayResponse(err, 'ERROR!!!', true);
            })
    }


    function displayResponse(data, text, error) {
        overlay.show();
        header.text(text);
        content.append(JSON.stringify(data));
        if (error) {
            console.log(data);
            header.addClass('overlay-header_error');
        }
    }

    function closeOverlay() {
        header.empty().removeClass('overlay-header_error');
        content.empty();
        overlay.hide();
        location.reload();
    }

    function getPermissions() {
        var nodesAddress = $('#nodes-address').val();
        if (nodesAddress) {
            var params = { address: nodesAddress };
            $.ajax({
                type: 'POST',
                url: '/mc/get-permissions',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    console.log(data);
                    $('#current-permissions').empty();
                    $('#current-permissions').text('Current permissions : ' + data.join(", "));
                })
                .catch(function (err) {
                    $('#current-permissions').empty();
                    $('#current-permissions').text('No permission found for this address');
                })
        }
    }

    function checkWritePermissions() {
        var nodesAddress = $('#stream-write-nodes-address').val();
        var stream = $('#stream-name-write').val();
        if (nodesAddress && stream) {
            var params = { address: nodesAddress, permission: stream + ".write" };
            $.ajax({
                type: 'POST',
                url: '/mc/get-permissions',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    $('#current-permissions-write').empty();
                    if (data.length > 0) {
                        $('#current-permissions-write').text("Alrady have write permission. You can REVOKE it");
                    } else {
                        $('#current-permissions-write').empty();
                        $('#current-permissions-write').text("Don't have write permission. Tou can GRANT it");
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    $('#current-permissions-write').empty();
                    $('#current-permissions-write').text("Don't have write permission. you can GRANT it");
                })
        }
    }

    function grantPermission(e) {
        e.preventDefault();
        var nodesAddress = $('#nodes-address').val();
        var nodesPermission = $('#nodes-permissions').val();
        var type = $('#type').val();
        if (nodesAddress && nodesPermission != "") {
            var params = { type: type, address: nodesAddress, permission: nodesPermission };
            $.ajax({
                type: 'POST',
                url: '/mc/grant-permissions',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    displayResponse(data, 'Permission granted');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        } else {
            alert("Please fill all information")
        }
    }

    function grantWritePermission(e) {
        e.preventDefault();
        var nodesAddress = $('#stream-write-nodes-address').val();
        var streamName = $('#stream-name-write').val();
        var type = $('#stream-write-type').val();
        if (nodesAddress && streamName != "") {
            var params = { type: type, address: nodesAddress, permission: streamName + ".write" };
            $.ajax({
                type: 'POST',
                url: '/mc/grant-permissions',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    displayResponse(data, 'Permission granted');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        } else {
            alert("Please fill all information")
        }
    }

    $.fn.changeSubscription = function (name, isSubsribe) {
        if (isSubsribe) {
            streamSubscription("unsubscribe", name)
        } else {
            streamSubscription("subscribe", name)
        }
    };

    $.fn.grantUser = function (id) {
        var params = { id: id };
            $.ajax({
                type: 'POST',
                url: '/mc/grant-user',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    alert("New address created for user");
                    window.location.href = '/wallet';
                })
                .catch(function (err) {
                    alert(err);
                })
    };

    $("#edit").click(function(e){
        e.preventDefault();
        $('#stream-data-show').attr('readonly', false);
    })

    $("#republish").click(function(e){
        e.preventDefault();
        var address = $('#hidden-publisher').val();
        var stream = $('#stream-name').val();
        var key = $('#hidden-key').val();
        var data = $('#stream-data-show').val();
        var params = { address: address, stream: stream, data: data, key: key };
        $.ajax({
            type: 'POST',
            url: '/mc/publish-stream',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                $('#stream-data-show').attr('readonly', true);
                displayResponse(data, 'Stream Published');
            })
            .catch(function (err) {
                displayResponse(err, 'ERROR!!!', true);
            })
    })
});