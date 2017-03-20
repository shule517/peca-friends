let app = angular.module('App', []);

app.controller('mainCtrl', function($scope, $http){
    $scope.channels = [];

    $scope.readYP = (ypUrl) => {
        $http.get(ypUrl + 'index.txt', {})
            .success((data, status, headers, config) => {
                console.log('success');
                let lines = data.split('\n');
                lines.forEach((line) => {
                    if (line.length == 0) {
                        return;
                    }
                    let elements = line.split("<>");
                    let channel = {
                        name:elements[0],
                        id:elements[1],
                        tip:elements[2],
                        contactUrl:elements[3],
                        genre:elements[4],
                        details:elements[5]
                            .replace("&lt;", "<")
                            .replace("&gt;", ">"),
                        listener:elements[6],
                        type:elements[9],
                        comments:elements[17],
                        icon:'./img/peca.png'
                    };
                    // YP情報は追加しない
                    if (channel.listener >= -1) {
                        $scope.channels.push(channel);
                    }
                });
            })
            .error((data, status, headers, config) => {
                console.log('error');
            });
    }
    $scope.readYP('http://temp.orz.hm/yp/');
    $scope.readYP('http://bayonet.ddo.jp/sp/');

    $scope.play = (channel) => {
        const exec = require('child_process').execFile;
        console.log('play:' + channel.name);

        let streamUrl = 'http://localhost:7146/pls/' + channel.id + '?tip=' + channel.tip;
        console.log(streamUrl);
        if (channel.type == 'FLV') {
            exec('peerstplayer/peerstplayer.exe', [streamUrl, 'FLV', channel.name], (err, stdout, stderr) => console.log('error'));
        } else {
            exec('peerstplayer/peerstplayer.exe', [streamUrl, 'WMV', channel.name], (err, stdout, stderr) => console.log('error'));
        }
    }
});
