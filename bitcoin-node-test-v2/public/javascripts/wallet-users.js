$(function () {
    streams = [];
    getWalletUsers();
    function getWalletUsers() {
        var params = {};
        $.ajax({
            type: 'POST',
            url: '/mc/wallet-users',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                streams = data;
                console.log(data);
                changeTableData(streams);
            })
            .catch(function (err) {
                alert(JSON.stringify(err));
            })
    };
    
    function changeTableData(data){
        var tbody = $("#wallet-users-table").children('tbody');
        tbody.empty();
        var rows = data.map(function(element) {
            return $("<tr></tr>").append(
                "<td>"+element.id+"</td><td>"+element.name+"</td><td>"+element.email+"</td><td>"+element.role+"</td>");
        });
        tbody.append(rows);
    };

    $('#search-wallet-users').keyup(function () {
        var val = $('#search-wallet-users').val();

        if(!val || val == ""){
            changeTableData(streams);
        } else {
            var data = streams.filter(element => {
                return(element.id.indexOf(val) != -1 || element.name.indexOf(val) != -1 ||
                element.email.indexOf(val) != -1 || element.role.indexOf(val) != -1 );
            })
            changeTableData(data);
        }
    });
})