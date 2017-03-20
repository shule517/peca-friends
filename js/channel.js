let fs = require('fs');
let app = angular.module('App', []);

app.controller('mainCtrl', function($scope, $http){
    let jsonFilePath = "favorite.json"

    getHistory = (channelName) => {
        url = 'https://peca-tsu.herokuapp.com/channels?name=' + channelName
        $http.get(url, {})
            .success((data, status, headers, config) => {
                console.log('success');
                if (data.length > 0) {
                    let history = {
                        name: data[0].name,
                        genre: data[0].last_genre,
                        details: data[0].last_detail,
                        contactUrl: data[0].contact_url,
                        lastStartedAt: data[0].last_started_at,
                        lastComment: data[0].last_comment,
                        icon: './img/not-live.png'
                    }
                    if (!$scope.favoriteChannels.map((ch) => { return ch.name; }).includes(channelName)) {
                        // いなければ追加
                        $scope.favoriteChannels.push(history)
                    }
                }
            })
            .error((data, status, headers, config) => {
                console.log('error');
            });
    }

    // お気に入り
    $scope.favoriteChannelNames = [];
    $scope.favoriteChannels = [];
    try { $scope.favoriteChannelNames = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')); } catch (err){ console.log(err) }

    $scope.favoriteChannelNames.forEach((channelName) => {
        getHistory(channelName)
    });

    $scope.favorite = (channel) => {
        console.log("お気に入り:" + channel.name)
        if ($scope.isFavorite(channel)) {
            let index = $scope.favoriteChannelNames.indexOf(channel.name);
            $scope.favoriteChannelNames.splice(index, 1);
        } else {
            $scope.favoriteChannelNames.push(channel.name)
        }
        // お気に入り情報をファイル保存
        fs.writeFile(jsonFilePath, JSON.stringify($scope.favoriteChannelNames), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

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
                    if ($scope.favoriteChannelNames.includes(channel.name)) {
                        if ($scope.favoriteChannels.includes(channel)) {
                            let index = $scope.favoriteChannels.indexOf(channel);
                            $scope.favoriteChannels.splice(index, 1);
                        }
                        $scope.favoriteChannels.push(channel);
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

    $scope.isFavorite = (channel) => {
        return $scope.favoriteChannelNames.includes(channel.name);
    }
});
