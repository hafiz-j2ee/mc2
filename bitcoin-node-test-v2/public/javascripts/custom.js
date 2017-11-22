$(function () {
    streams = [];
    getStreams();
    $('#refresh').click(getStreams);
    function getStreams() {
        var params = {};
        $.ajax({
            type: 'POST',
            url: '/mc/stream-details',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
            .then(function (data) {
                console.log(data);
                streams = data;
                changeTableData(streams);
            })
            .catch(function (err) {
                alert(err);
            })
    };
    
    function changeTableData(data){
        var tbody = $("#stream-details-table").children('tbody');
        tbody.empty();
        var rows = data.map(function(element) {
            return $("<tr></tr>").append(
                "<td>"+element.name+"</td><td>"+element.items+"</td><td>"+element.keys+"</td><td>"
                +new Date(element.time*1000).toISOString()+"</td><td>"+element.createtxid+"</td><td>"+element.subscribed+"</td>");
        });
        tbody.append(rows);
    };

    $('#search').keyup(function () {
        var val = $('#search').val();

        if(!val || val == ""){
            changeTableData(streams);
        } else {
            var data = streams.filter(element => {
                return(element.name.indexOf(val) != -1 || element.items.toString().indexOf(val) != -1 ||
                element.keys.indexOf(val) != -1 || new Date(element.time*1000).toISOString().indexOf(val) != -1 ||
                element.createtxid.indexOf(val) != -1 || element.subscribed.toString().indexOf(val) != -1 );
            })
            changeTableData(data);
        }
    });
})