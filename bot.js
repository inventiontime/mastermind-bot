const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();

var player1 = [];
var player2 = [];
var number1 = [];
var number2 = [];
var turnNumber = [];
var player1turn = [];
var interval = [];
var number1set = [];
var number2set = [];
var gameChannel = [];
var gameState = [];
var numberLength = [];
var isBlitz = [];
var blitzTime = [];
var blitzTimeRemaining = [];
var blitzInterval = [];
const GameState = ["no game", "waiting for player 2", "waiting for numbers", "guessing", "player 2 guess remaining", "solo"];

var games = 0;

client.once('ready', () => {
    console.log('Ready!');
    
    client.user.setPresence({
        status: "online",
        activity: {
            name: "!help",
            type: "LISTENING",
        }
    });
});

client.on('message', message => {
    if(message.channel.type == "dm") {
        for(var i = 0; i < gameChannel.length; i++) {
            if(gameState[i] == GameState[2]) {
                if(message.author == player1[i]) {
                    if(verifyMessage(message.content, numberLength[i]) && !number1set[i]) {
                        number1[i] = message.content;
                        number1set[i] = true;
                        message.channel.send("Your number is " + number1[i]);
                        return;
                    } else if(message.content == "rand") {
                        number1[i] = randomNumber(numberLength[i]);
                        number1set[i] = true;
                        message.channel.send("Your number is " + number1[i]);
                        return;
                    } else {
                        message.channel.send("Should be `rand` or a number " + numberLength[i] + " digits long, having no zeroes or repetition");
                    }
                }

                if(message.author == player2[i]) {
                    if(verifyMessage(message.content, numberLength[i]) && !number2set[i]) {
                        number2[i] = message.content;
                        number2set[i] = true;
                        message.channel.send("Your number is " + number2[i]);
                        return;
                    } else if(message.content == "rand") {
                        number2[i] = randomNumber(numberLength[i]);
                        number2set[i] = true;
                        message.channel.send("Your number is " + number2[i]);
                        return;
                    } else {
                        message.channel.send("Should be `rand` or a number " + numberLength[i] + " digits long, having no zeroes or repetition");
                    }
                }
            }
        }
        return;
    }

    if (!message.content.startsWith(config.prefix)) return;

	const withoutPrefix = message.content.slice(config.prefix.length);
	const split = withoutPrefix.split(/ +/);
	const command = split[0];
    const args = split.slice(1);

    var chIdx = gameChannel.indexOf(message.channel);

    if(chIdx == -1) {
        add(message.channel);
        chIdx = gameChannel.indexOf(message.channel);
        //message.channel.send("This channel has been added");
    }

    switch(command) {
        case "help":
        case "h":
            message.channel.send(
                "> **HOW TO PLAY**\n" +
                "1. Each person chooses a **secret 3 digit number**\n" +
                "2. The objective of the game is to guess the other persons number\n" +
                "3. For each guess, you are told number of cows and bulls you scored\n" +
                "4. First person to **guess the other's number** wins\n\n" +
                
                "> **COWS AND BULLS**\n" +
                "Let's say the number is 123 and your guess is 134\n" +
                "As the digit **1** is in both numbers and at the same position, it is a **bull**\n" +
                "As the digit **3** is in both numbers but is at different positions, it is a **cow**\n" +
                "So you get **1 cow, 1 bull**\n\n" +
                
                "If you get 0 cows and 0 bulls, the response is **shit**\n\n" +
                
                "**To start playing, type \"!play @user\"**\n\n" +

                "> **OTHER GAMEMODES**\n" +
                "For more digits, use **!play @user [number of digits]** eg. **!play @user 4**\n" +
                "For a quick paced game, play with a timer using **!play @user [number of digit] [time per move (in sec)]** eg. **!play @user 3 15**\n" +
                "To practice, you can play solo using **!play solo [number of digits]**\n\n" +

                "For any command, use the first letter as short, eg. **!p** instead of **!play**\n\n" +
                
                "This bot is made by @inventiontime");
                
            break;
    }
    
    if(chIdx != -1) {
        switch(command) {
            case "play":
            case "p":
                if(args.length > 0 && (gameState[chIdx] == GameState[0] || gameState[chIdx] == GameState[1])) {
                    if(args[0] == "solo" || args[0] == "s") {
                        if(args.length == 1) {
                            player1[chIdx] = message.author;
                            player2[chIdx] = null;
                            numberLength[chIdx] = 3;
                            gameState[chIdx] = GameState[5];
                            number2[chIdx] = randomNumber(numberLength[chIdx]);
                            message.channel.send("You can start guessing using !guess [number]");
                        } else if(args.length == 2) {
                            if(args[1] > 0 && args[1] < 10) {
                                player1[chIdx] = message.author;
                                player2[chIdx] = null;
                                numberLength[chIdx] = args[1];
                                gameState[chIdx] = GameState[5];
                                number2[chIdx] = randomNumber(numberLength[chIdx]);
                                message.channel.send("You can start guessing using !guess [number]");
                            }
                        }
                    } else {
                        if(args.length == 1) {
                            player1[chIdx] = message.author;
                            player2[chIdx] = getUserFromMention(args[0]);

                            numberLength[chIdx] = 3;
                            isBlitz[chIdx] = false;

                            if(player1[chIdx] == player2[chIdx]) {
                                message.channel.send("You can't play with yourself!");
                                gameState[chIdx] = GameState[0];
                            } else {
                                gameState[chIdx] = GameState[1];
                                message.channel.send(args[0] + " please type !ready to start game (" + gameInfo(chIdx) + ")");
                            }
                        } else if(args.length == 2) {
                            if(args[1] > 0 && args[1] < 10) {
                                player1[chIdx] = message.author;
                                player2[chIdx] = getUserFromMention(args[0]);

                                numberLength[chIdx] = args[1];
                                isBlitz[chIdx] = false;

                                if(player1[chIdx] == player2[chIdx]) {
                                    message.channel.send("You can't play with yourself!");
                                    gameState[chIdx] = GameState[0];
                                } else {
                                    gameState[chIdx] = GameState[1];
                                    message.channel.send(args[0] + " please type !ready to start game (" + gameInfo(chIdx) + ")");
                                }
                            }
                        } else if(args.length == 3) {
                            if(args[1] > 0 && args[1] < 10 && args[2] > 0) {
                                player1[chIdx] = message.author;
                                player2[chIdx] = getUserFromMention(args[0]);

                                numberLength[chIdx] = args[1];
                                isBlitz[chIdx] = true;
                                blitzTime[chIdx] = args[2];

                                if(player1[chIdx] == player2[chIdx]) {
                                    message.channel.send("You can't play with yourself!");
                                    gameState[chIdx] = GameState[0];
                                } else {
                                    gameState[chIdx] = GameState[1];
                                    message.channel.send(args[0] + " please type !ready to start game (" + gameInfo(chIdx) + ")");
                                }
                            }
                        }
                    }
                }
                break;

            case "ready":
            case "r":
                if(gameState[chIdx] == GameState[1] && player2[chIdx] == message.author) {
                    gameState[chIdx] = GameState[2];
                    games++;
                    console.log(games);
                    message.channel.send("Please DM your numbers to me <@" + player1[chIdx].id + "> and <@" + player2[chIdx].id + ">");
                    player1[chIdx].send("Send a " + numberLength[chIdx] + " digit number.");
                    player2[chIdx].send("Send a " + numberLength[chIdx] + " digit number.");
                    interval[chIdx] = setInterval(function() { checkForNumbers(chIdx); }, 3000);
                }
                break;

            case "guess":
            case "g":
                if(gameState[chIdx] == GameState[3] && args.length == 1) {
                    if((player1turn[chIdx] && message.author == player1[chIdx]) || (!player1turn[chIdx] && message.author == player2[chIdx])) {
                        if(verifyMessage(args[0], numberLength[chIdx])) {
                            if((player1turn[chIdx] && args[0] == number2[chIdx]) || (!player1turn[chIdx] && args[0] == number1[chIdx])) {
                                if(player1turn[chIdx]) {
                                    turnNumber[chIdx]++;
                                    gameState[chIdx] = GameState[4];
                                    player1turn[chIdx] = !player1turn[chIdx];
                                    gameChannel[chIdx].send("Correct number!!!");
                                    gameChannel[chIdx].send("<@" + player2[chIdx].id + "> , you have a chance to tie! Its your turn.");
                                    if(isBlitz[chIdx]) startBlitzTimer(chIdx);
                                } else {
                                    gameChannel[chIdx].send("<@" + player1[chIdx].id + "> vs <@" + player2[chIdx].id + ">, <@" + player2[chIdx].id + "> won in " + turnNumber[chIdx] + " moves! :partying_face: ID: " + Math.floor(Math.random() * 100000).toString());
                                    reset(chIdx);
                                }
                            } else {
                                if(player1turn[chIdx]) { 
                                    message.channel.send(checkGuess(args[0], number2[chIdx]));
                                    turnNumber[chIdx]++;
                                } else {
                                    message.channel.send(checkGuess(args[0], number1[chIdx]));
                                }

                                player1turn[chIdx] = !player1turn[chIdx];

                                if(player1turn[chIdx]) gameChannel[chIdx].send("Its <@" + player1[chIdx].id + "> 's turn");
                                else gameChannel[chIdx].send("Its <@" + player2[chIdx].id + "> 's turn");

                                if(isBlitz[chIdx]) startBlitzTimer(chIdx);
                            }
                        } else {
                            message.channel.send("Number should be " + numberLength[chIdx] + " digits long, and have no zeroes or repetition");
                        }
                    }
                } else if(gameState[chIdx] == GameState[4] && args.length == 1) {
                    if(message.author == player2[chIdx]) {
                        if(verifyMessage(args[0], numberLength[chIdx])){
                            if(args[0] == number1[chIdx]) {
                                gameChannel[chIdx].send("Its a tie between <@" + player1[chIdx].id + "> and <@" + player2[chIdx].id + "> in " + turnNumber[chIdx] + " moves! :partying_face: ID: " + Math.floor(Math.random() * 100000).toString());
                                reset(chIdx);
                            } else {
                                gameChannel[chIdx].send("<@" + player1[chIdx].id + "> vs <@" + player2[chIdx].id + ">, <@" + player1[chIdx].id + "> won in " + turnNumber[chIdx] + " moves! :partying_face: ID: " + Math.floor(Math.random() * 100000).toString());
                                reset(chIdx);
                            }
                        } else {
                            message.channel.send("Number should be " + numberLength[chIdx] + " digits long, and have no zeroes or repetition");
                        }
                    }
                } else if(gameState[chIdx] == GameState[5] && args.length == 1) {
                    if(verifyMessage(args[0], numberLength[chIdx])) {
                        turnNumber[chIdx]++;
                        if(args[0] == number2[chIdx]) {
                            gameChannel[chIdx].send("<@" + player1[chIdx].id + ">, you won in " + turnNumber[chIdx] + " moves! :partying_face: ID: " + Math.floor(Math.random() * 100000).toString());
                            reset(chIdx);
                        } else {
                            message.channel.send(checkGuess(args[0], number2[chIdx]));
                        }
                    } else {
                        message.channel.send("Number should be " + numberLength[chIdx] + " digits long, and have no zeroes or repetition");
                    }
                }
                break;

            case "exit":
            case "e":
                if((message.author == player1[chIdx] || message.author == player2[chIdx]) && gameState[chIdx] != GameState[0]) {
                    reset(chIdx);
                    gameChannel[chIdx].send("Match has ended");
                }
                break;
        }
    }
});

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}

f=(x,y="")=>x?!y.match(z=(Math.random()*9+1)|0)&&y|z?f(x-1,y+z):f(x,y):y;

function randomNumber(numLen) {
    return f(numLen);
}

function checkForNumbers(chIdx) {
    if(number1set[chIdx] && number2set[chIdx]) {
        gameState[chIdx] = GameState[3];
        if(isBlitz[chIdx]) startBlitzTimer(chIdx);
        gameChannel[chIdx].send("You can start guessing using !guess [number]");
        gameChannel[chIdx].send("Its <@" + player1[chIdx].id + "> 's turn");
        player1turn[chIdx] = true;
        clearInterval(interval[chIdx]);
        interval[chIdx] = null;
    }
}

async function startBlitzTimer(chIdx) {
    if(blitzInterval[chIdx] != null) {
        clearInterval(blitzInterval[chIdx]);
        blitzInterval[chIdx] = null;
    }
    blitzTimeRemaining[chIdx] = blitzTime[chIdx];
    message = await gameChannel[chIdx].send("Time left: " + blitzTime[chIdx] + " seconds");
    blitzInterval[chIdx] = setInterval(function() { blitzIntervalFunction(message, chIdx) }, 1000);
}

function blitzIntervalFunction(message, chIdx) {
    if((gameState[chIdx] == GameState[3] || gameState[chIdx] == GameState[4]) && isBlitz[chIdx]) {
        blitzTimeRemaining[chIdx]--;
        message.edit("Time left: " + blitzTimeRemaining[chIdx] + " seconds");
        if(blitzTimeRemaining[chIdx] <= 0) {
            if(gameState[chIdx] == GameState[3]) {
                gameChannel[chIdx].send("Time's up, turn skipped");
                
                // lines copied with slight variation from section of code responding to "guess" command
                if(player1turn[chIdx]) { 
                    turnNumber[chIdx]++;
                } else {

                }

                player1turn[chIdx] = !player1turn[chIdx];

                if(player1turn[chIdx]) gameChannel[chIdx].send("Its <@" + player1[chIdx].id + "> 's turn");
                else gameChannel[chIdx].send("Its <@" + player2[chIdx].id + "> 's turn");

                if(isBlitz[chIdx]) startBlitzTimer(chIdx);
            } else if(gameState[chIdx] == GameState[4]) {
                gameChannel[chIdx].send("<@" + player1[chIdx].id + "> vs <@" + player2[chIdx].id + ">, <@" + player1[chIdx].id + "> won in " + turnNumber[chIdx] + " moves! :partying_face: ID: " + Math.floor(Math.random() * 100000).toString());
                reset(chIdx);
            }
        }
    } else clearInterval(blitzInterval[chIdx]);
}

function verifyMessage(message, numLen) {
    var b = true;
    if(message.length != numLen) b = false;
    if(!(/^[1-9]\d*$/.test(message))) b = false;
    if(b) {
        for(var i = 0; i < message.length; i++) {
            if(message[i] == '0') b = false;
            for(var j = i-1; j >= 0; j--) {
                if(message[i] == message[j]) b = false;
            }
        }
    }

    return b;
}

function checkGuess(guess, number) {
    var reds = 0;
    var whites = 0;

    for(var i = 0; i < guess.length; i++) {
        if(guess[i] == number[i]) reds++;
        else {
            for (var j = 0; j < number.length; j++) {
                if(guess[i] == number[j]) whites++;
            }
        }
    }

    if(whites ==  0 && reds == 0)
        return config.flushname;
    else
        return reds.toString() + " " + config.redsname + ", " + whites.toString() + " " + config.whitesname;
}

function reset(chIdx) {
    number1set[chIdx] = false;
    number2set[chIdx] = false;
    turnNumber[chIdx] = 0;
    gameState[chIdx] = GameState[0];
    if(interval[chIdx] != null) {
        clearInterval(interval[chIdx]);
        interval[chIdx] = null;
    }
}

function add(channel) {
    number1.push(0);
    number2.push(0);
    player1.push(null);
    player2.push(null);
    player1turn.push(true);
    interval.push(null);
    number1set.push(false);
    number2set.push(false);
    turnNumber.push(0);
    gameChannel.push(channel);
    gameState.push(GameState[0]);
    numberLength.push(3);
    isBlitz.push(false);
    blitzInterval.push(null);
    blitzTime.push(0);
}

function gameInfo(chIdx) {
    var info = 
        numberLength[chIdx] +
        " digits";
    if(isBlitz[chIdx])
        info += ", " + blitzTime[chIdx] + " second blitz"; 
    return info;
}

client.login(process.env.BOT_TOKEN);