const axios = require('axios');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 1621;

app.listen(PORT, () => {
    console.log(`server has been started...${PORT}`);
});

let good = `✅✅✅`;
let bad = `❌❌❌`;

let othersGames = /Simulated|Reality|Cyber|RHL/;
let xhttp = new XMLHttpRequest();
const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-4071489870&text=';

const getData = async () => {
    let data = await axios.get("https://1xstavka.ru/LiveFeed/Get1x2_VZip?sports=2&count=50&gr=44&antisports=188&mode=4&country=1&partner=51&getEmpty=true");
    data = await data;
    return data.data;
}

function getCurrentDate() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1; //months start at 0
    var year = date.getFullYear();

    if(day<10) {
        day='0'+day;
    }
    if(month<10) {
        month='0'+month;
    }

    return year+'/'+month+'/' + day;
}

const calculateDate = (statistics) => {
    let statisticsCopy = {
        hour: 22,
        statistics: {
            hour: 22,
            successCount: 0,
            failCount: 0,
            allCount: 0,
            allGame: [],
            successGames: [],
            failGames: []
        },
        actualityGame: [],
        successGame: [],
        failGame: [],
        gameDays: [],
        days: {}
    };
    if (statistics.gameDays?.length) {
        let obj = {};
        statistics.gameDays.forEach(game => {
            if (game.date != getCurrentDate()) {
                obj = game;
            }
            statisticsCopy.days[game.date] = [...statisticsCopy.days[game.date], game];
        });
        statisticsCopy.gameDays?.push(obj);
    } else {
        statisticsCopy.gameDays?.push({
            date: getCurrentDate(),
            games: {
                successGame: statistics.statistics.successGames,
                failGame: statistics.statistics.failGames,
                allGame: statistics.statistics.allGames,
            },
            successCount: statistics.statistics.successGames.length,
            failCount: statistics.statistics.failGames.length,
        });
    }
    return statisticsCopy;
};

const getStatisticGame = (statistics) => {
    let stockGame = ["\nВряд\n"];
    statistics.statistics.allGame.forEach((game)=> {
        if (getSuccessGames([game]).length) {
            stockGame.push('✅\n');
        } else if (getFailGames([game]).length) {
            stockGame.push('❌\n');
        } else {
            stockGame.push('⚠️\n');
        }
    });
    return stockGame.join("");
};

const getGames = (data) => {
    let myGame = [];

    data.forEach( game => {
        let describeGame = {
            id: '',
            date: getCurrentDate(),
            country: '',
            game: '',
            name: '',
            title: '',
            player1: '',
            player2: '',
            set: '',
            cf1: '',
            cf2: '',
            period2: '',
            period3: '',
            set1player1: 0,
            set1player2: 0,
            set2player1: 0,
            set2player2: 0,
            set3player1: 0,
            set3player2: 0,
        };

        describeGame.id = game.N;
        describeGame.country = game.CN;
        describeGame.title = game.L;
        describeGame.name = game.SN;
        describeGame.game = game.MIO && game.MIO.TSt || 'simple';
        describeGame.player1 = game.O1;
        describeGame.player2 = game.O2;
        describeGame.set = game.SC.CPS;
        describeGame.set1player1 = game.SC.PS[0] && game.SC.PS[0].Value.S1 || 0;
        describeGame.set1player2 = game.SC.PS[0] && game.SC.PS[0].Value.S2 || 0;
        describeGame.period2 = game.SC.PS[1] && game.SC.PS[1].Value.NF || '';
        describeGame.set2player1 = game.SC.PS[1] && game.SC.PS[1].Value.S1 || 0;
        describeGame.set2player2 = game.SC.PS[1] && game.SC.PS[1].Value.S2 || 0;
        describeGame.period3 = game.SC.PS[2] && game.SC.PS[2].Value.NF || '';
        describeGame.set3player1 = game.SC.PS[2] && game.SC.PS[2].Value.S1 || 0;
        describeGame.set3player2 = game.SC.PS[2] && game.SC.PS[2].Value.S2 || 0;
        myGame.push(describeGame);
    });
    return myGame;
};

const getSelectedGames = (games) => {
    let selectedGame = [];
    games.forEach(game => {
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        if (countSet1 == 0 && game.period2 &&
            !othersGames.test(game.title) &&
            !othersGames.test(game.country)) {
            selectedGame.push(game);
        }
    })
    return selectedGame;
};

const getSuccessGames = (games) => {
    let successGame = [];

    games.forEach( game => {
        let player1count = Number(game.set2player1)
        let player2count = Number(game.set2player2)

        if (player1count || player2count) {
            successGame.push(game);
        }
    });
    return successGame;
};

const getFailGames = (games) => {
    let failGame = [];

    games.forEach( game => {
        let count = Number(game.set2player1) + Number(game.set2player2)
        if (count == 0 && game.period3) {
            failGame.push(game);
        }
    });
    return failGame;
};

const sendMessages = (subject, subjectFile, result) => {
    let obj = {};
    let obj2 = {};
    subject.forEach( game => {
        obj[game.id] = game;
    });

    subjectFile.forEach( game => {
        obj2[game.id] = game;
    });

    Object.keys(obj).forEach( gameId => {
        if (!Object.keys(obj2).length || !(obj2[gameId])) {
            const {
                title, player1, set1player1,
                player2, set1player2, set2player1, set2player2, id
            } = obj[gameId];

            let text = "Стратегия Хоккей\n" +
                `#${id} \n` +
                title + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало 2 Сета\n`}`
                + "1 Период закончился 0 0\n"
                + player1 + ":  " + set1player1 + " "+ set2player1 + "\n"
                + player2 + ":  " + set1player2 + " "+ set2player2 + "\n"
                "\nКогда начнется 2 Период," +
                " сделай ставку тотал 0,5 Б во втором периоде \n\n";
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            return;
        }
    });
};

const hockeyBot = async () => {
    try {
        let file = fs.readFileSync('recover.txt', "utf8", (err) => {
            if (err) throw err;
        })

        app.use('/', (req, res) => {
            res.send(JSON.stringify(file));
        });

        file = JSON.parse(file);

        let data = await getData();
        data = data.Value;

        const games = getGames(data);
        const selectedGames = getSelectedGames(games);
        const successGames = getSuccessGames(selectedGames)
        const failGames = getFailGames(selectedGames)

        const reWrite = (file, games) => {
            if (file.length && !games.length) {
                return file;
            }
            if (!file.length && games.length) {
                return games;
            }
            let arr = [...file];
            let obj = {};
            let obj2 = {};
            games.forEach(game => {
                obj[game.id] = game;
            })
            file.forEach(game => {
                obj2[game.id] = game;
            })
            Object.keys(obj).forEach(gameId => {
                if (Object.keys(obj2).length === 0) {
                    arr.push(obj[gameId]);
                } else {
                    if (!(obj2[gameId])) {
                        arr.push(obj[gameId])
                    } else {
                        arr = arr.map(item => {
                            if (item.id == gameId) {
                                return obj[gameId];
                            }
                            return item;
                        });
                    }
                }
            })
            return arr;
        }

        let statisFile = file && file.statistics || {};

        const statistics = {
            hour: new Date().getHours(),
            statistics: {
                hour: new Date().getHours(),
                successCount: statisFile.successGames && statisFile.successGames.length || 0,
                failCount: statisFile.failGames && statisFile.failGames.length || 0,
                allCount: statisFile.allGame && statisFile.allGame.length || 0,
                allGame: reWrite(statisFile.allGame, selectedGames) || [],
                successGames: reWrite(statisFile.successGames, successGames) || [],
                failGames: reWrite(statisFile.failGames, failGames) || []
            },
            actualityGame: selectedGames,
            successGame: successGames,
            failGame: failGames,
            gameDays: file.gameDays || [],
            days: file.days || {},
        }
//console.log(statisFile.allCount, statisFile.failCount, statisFile.successCount)
        if (statisFile.allGame && statistics.actualityGame) {
            if (statistics.actualityGame.length !== statisFile.allGame.length) {
                sendMessages(statistics.actualityGame, statisFile.allGame, '');
            }
        }

        if (statisFile.successGames && statistics.successGame) {
            if (statisFile.successGames.length !== statistics.successGame.length) {
                sendMessages(statistics.successGame, statisFile.successGames, good);
            }
        }

        if (statisFile.failGames && statistics.failGame) {
            if (statisFile.failGames.length !== statistics.failGame.length) {
                sendMessages(statistics.failGame, statisFile.failGames, bad);
            }
        }

        const myWriteFile = (text) => {
            fs.writeFile('recover.txt', text, (err) => {
                if (err) {
                    throw err;
                }
            });
        };

        let actualityCount = statistics.actualityGame.length;

        if (statistics.hour === 22 && file.statistics.hour !== 22) {
            const {successCount, failCount, allCount} = file.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }

            let text = `Статистика за весь день !!!!!\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent}\n${getStatisticGame(statistics)}`;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            myWriteFile(JSON.stringify(calculateDate(statistics), null, 2));
        } else if (statistics.hour !== statisFile.hour) {
            const {successCount, failCount, allCount} = statistics.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }
            let text = `Статистика\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent} ${getStatisticGame(statistics)}`;
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else {
            myWriteFile(JSON.stringify(statistics, null, 2));
        }
        setTimeout(() => hockeyBot(), 5000);
    } catch (e) {
        console.log(e);
        setTimeout(()=> hockeyBot(), 20000);
    }
};
hockeyBot();
