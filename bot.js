const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();

var player1 = [];
var player2 = [];
var number1 = [];
var number2 = [];
var player1turn = [];
var interval = [];
var number1set = [];
var number2set = [];
var gameChannel = [];
var gameState = [];
const GameState = ["no game", "waiting for player 2", "waiting for numbers", "guessing", "player 2 guess remaining"];

client.once('ready', () => {
    console.log('Ready!');
    
    client.user.setPresence({
        status: "online",
        game: {
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
                    if(verifyMessage(message.content) && !number1set[i]) {
                        number1[i] = message.content;
                        number1set[i] = true;
                        message.channel.send("Your number is " + number1[i]);
                        return;
                    } else {
                        message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
                    }
                }

                if(message.author == player2[i]) {
                    if(verifyMessage(message.content) && !number2set[i]) {
                        number2[i] = message.content;
                        number2set[i] = true;
                        message.channel.send("Your number is " + number2[i]);
                        return;
                    } else {
                        message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
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

    const chIdx = gameChannel.indexOf(message.channel);

    if(chIdx == -1) {
        gameChannel.push(message.channel);
        add();
        chIdx = gameChannel.indexOf(message.channel);
        message.channel.send("This channel has been added");
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
                
                "**To start playing, type !play @user**");
                
            break;
    }
    
    if(chIdx != -1) {
        switch(command) {
            case "play":
            case "p":
                if(args.length == 1 && (gameState[chIdx] == GameState[0] || gameState[chIdx] == GameState[1])) {
                    player1[chIdx] = message.author;
                    player2[chIdx] = getUserFromMention(args[0]);

                    if(player1[chIdx] == player2[chIdx]) {
                        message.channel.send("You can't play with yourself!");
                        gameState[chIdx] = GameState[0];
                    } else {
                        gameState[chIdx] = GameState[1];
                        message.channel.send(args[0] + " please type !ready to start game");
                    }
                }
                break;

            case "ready":
            case "r":
                if(gameState[chIdx] == GameState[1] && player2[chIdx] == message.author && message.channel == gameChannel[chIdx]) {
                    gameState[chIdx] = GameState[2];
                    message.channel.send("Please DM your numbers to me <@" + player1[chIdx].id + "> and <@" + player2[chIdx].id + ">");
                    player1[chIdx].send("Send a 3 digit number.");
                    player2[chIdx].send("Send a 3 digit number.");
                    interval[chIdx] = setInterval(function() { checkForNumbers(chIdx); }, 3000);
                }
                break;

            case "guess":
            case "g":
                if(gameState[chIdx] == GameState[3] && message.channel == gameChannel[chIdx] && args.length == 1) {
                    if((player1turn[chIdx] && message.author == player1[chIdx]) || (!player1turn[chIdx] && message.author == player2[chIdx])) {
                        if(verifyMessage(args[0])){
                            if((player1turn[chIdx] && args[0] == number2[chIdx]) || (!player1turn[chIdx] && args[0] == number1[chIdx])) {
                                if(player1turn[chIdx]) {
                                    gameState[chIdx] = GameState[4];
                                    player1turn[chIdx] = !player1turn[chIdx];
                                    gameChannel[chIdx].send("3 " + config.redsname + "!!!")
                                    gameChannel[chIdx].send("<@" + player2[chIdx].id + "> , you have a chance to tie! Its your turn.");
                                } else {
                                    reset(chIdx);
                                    gameChannel[chIdx].send("<@" + player2[chIdx].id + "> won lol :partying_face:");
                                } 
                            } else {
                                if(player1turn[chIdx]) message.channel.send(checkGuess(args[0], number2[chIdx]))
                                else message.channel.send(checkGuess(args[0], number1[chIdx]))

                                player1turn[chIdx] = !player1turn[chIdx];

                                if(player1turn[chIdx]) gameChannel[chIdx].send("Its <@" + player1[chIdx].id + "> 's turn");
                                else gameChannel[chIdx].send("Its <@" + player2[chIdx].id + "> 's turn");
                            }
                        } else {
                            message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
                        }
                    }
                } else if(gameState[chIdx] == GameState[4] && message.channel == gameChannel[chIdx] && args.length == 1) {
                    if(message.author == player2[chIdx]) {
                        if(verifyMessage(args[0])){
                            if(args[0] == number1[chIdx]) {
                                reset(chIdx);
                                gameChannel[chIdx].send("Its a tie! :partying_face:");
                            } else {
                                reset(chIdx);
                                gameChannel[chIdx].send("<@" + player1[chIdx].id + "> won lol :partying_face:");
                            }
                        } else {
                            message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
                        }
                    }
                }
                break;

            case "exit":
            case "e":
                if((message.author == player1[chIdx] || message.author == player2[chIdx]) && gameState[chIdx] != GameState[0] && gameState[chIdx] != GameState[1] && message.channel == gameChannel[chIdx]) {
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

function checkForNumbers(chIdx) {
    if(number1set[chIdx] && number2set[chIdx]) {
        gameState[chIdx] = GameState[3];
        gameChannel[chIdx].send("You can start guessing using !guess [number]");
        gameChannel[chIdx].send("Its <@" + player1[chIdx].id + "> 's turn");
        player1turn[chIdx] = true;
        clearInterval(interval[chIdx]);
        interval[chIdx] = null;
    }
}

function verifyMessage(message) {
    var b = true;
    if(message.length != 3) b = false;
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
    gameState[chIdx] = GameState[0];
}

function add() {
    number1.push(0);
    number2.push(0);
    player1turn.push(true);
    number1set.push(false);
    number2set.push(false);
    gameState.push(GameState[0]);
}

client.login(process.env.BOT_TOKEN);