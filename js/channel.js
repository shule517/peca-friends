let fs = require('fs');
let app = angular.module('App', []);

/*
 *日付の差分日数を返却します。
 */
function getDiff(date1Str, date2Str) {
	var date1 = new Date(date1Str);
	var date2 = new Date(date2Str);

	// getTimeメソッドで経過ミリ秒を取得し、２つの日付の差を求める
	var msDiff = date2.getTime() - date1.getTime();

	// 求めた差分（ミリ秒）を日付へ変換します（経過ミリ秒÷(1000ミリ秒×60秒×60分×24時間)。端数切り捨て）
	var minitesDiff = Math.floor(msDiff / (1000 * 60));
	var hoursDiff = Math.floor(msDiff / (1000 * 60 * 60));
	var daysDiff = Math.floor(msDiff / (1000 * 60 * 60 *24));

    if (daysDiff > 0) {
        return daysDiff + "日前"
    } else if (hoursDiff > 0) {
        return hoursDiff + "時間前"
    } else if (minitesDiff > 0) {
        return minitesDiff + "分前"
    }
	return "";
}

app.controller('mainCtrl', function($scope, $http){
    let jsonFilePath = "favorite.json"

    getHistory = (channelName) => {
        url = 'https://peca-tsu.herokuapp.com/channels?name=' + channelName
        $http.get(url, {})
            .success((data, status, headers, config) => {
                console.log('success');
                if (data.length > 0) {
                    let lastStartedAt = data[0].last_started_at;
                    let lastDate = new Date(lastStartedAt);
                    let history = {
                        name: data[0].name,
                        genre: data[0].last_genre,
                        details: data[0].last_detail + ' ＠' + getDiff(lastDate, Date.now()),
                        contactUrl: data[0].contact_url,
                        lastStartedAt: lastStartedAt,
                        lastComment: data[0].last_comment,
                        icon: './img/not-live.png'
                    }
                    history.details = history.details.replace('&lt;Open&gt;', '').replace('&lt;Over&gt;', '').replace('&lt;Free&gt;', '')
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

    $scope.searchHistory = (keyword) => {
        searchHistory($scope.keyword)
    }

    $scope.searchChannels = []
    searchHistory = (keyword) => {
        $scope.searchChannels = []

        // 登録されていないチャンネルをpeca-tsuサーバに通知する
        url = 'https://peca-tsu.herokuapp.com/channels?name=' + keyword;
        $http.get(url, {});

        url = 'https://peca-tsu.herokuapp.com/histories?keyword=' + keyword;
        $http.get(url, {})
            .success((data, status, headers, config) => {
                console.log('success');
                data.forEach((ch) => {
                    let lastStartedAt = ch.last_started_at;
                    let lastDate = new Date(lastStartedAt);
                    let history = {
                        name: ch.name,
                        genre: ch.genre,
                        details: ch.detail + ' ＠' + getDiff(ch.end_time, Date.now()),
                        contactUrl: ch.contact_url,
                        lastStartedAt: ch.start_time,
                        lastComment: ch.comment,
                        icon: './img/not-live.png'
                    }
                    history.details = history.details.replace('&lt;Open&gt;', '').replace('&lt;Over&gt;', '').replace('&lt;Free&gt;', '')
                    $scope.searchChannels.push(history)
                });
            })
            .error((data, status, headers, config) => {
                console.log('error');
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
                    channel.details = channel.details.replace('<Open>', '').replace('<Free>', '').replace('<Over>', '')

                    // TODO START
                    url = 'https://peca-tsu.herokuapp.com/channels?name=' + channel.name;
                    $http.get(url, {});
                    // TODO END

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

    $scope.edit = (channel) => {
        const exec = require('child_process').execFile;
        console.log('edit:' + channel.name + ' ' + channel.contactUrl);
        exec('peerstplayer/PeerstViewer.exe', [channel.contactUrl], (err, stdout, stderr) => console.log('error'));
    }

    $scope.history = (channel) => {
        $scope.searchChannels = []
        url = 'https://peca-tsu.herokuapp.com/histories?name=' + channel.name;
        $http.get(url, {})
            .success((data, status, headers, config) => {
                console.log('success');
                data.forEach((ch) => {
                    let lastStartedAt = ch.last_started_at;
                    let lastDate = new Date(lastStartedAt);
                    let history = {
                        name: ch.name,
                        genre: ch.genre,
                        details: ch.detail + ' ＠' + getDiff(ch.end_time, Date.now()),
                        contactUrl: ch.contact_url,
                        lastStartedAt: ch.start_time,
                        lastComment: ch.comment,
                        icon: './img/not-live.png'
                    }
                    history.details = history.details.replace('&lt;Open&gt;', '').replace('&lt;Over&gt;', '').replace('&lt;Free&gt;', '')
                    $scope.searchChannels.push(history)
                });
            })
            .error((data, status, headers, config) => {
                console.log('error');
            });
    }

    $scope.isFavorite = (channel) => {
        return $scope.favoriteChannelNames.includes(channel.name);
    }
});
