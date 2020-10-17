const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();

var player1;
var player2;
var number1;
var number2;
var player1turn;
var interval;
var number1set = false;
var number2set = false;
const GameState = ["no game", "waiting for player 2", "waiting for numbers", "guessing", "player 2 guess remaining"];
var gameChannel;
var gameState = GameState[0];

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
        if(gameState == GameState[2]) {
            if(message.author == player1) {
                if(verifyMessage(message.content) && !number1set) {
                    number1 = message.content;
                    number1set = true;
                    message.channel.send("Your number is " + number1);
                } else {
                    message.channel.send("Number should be 3 digits long, and have no zeroes or repetition")
                }
            }

            if(message.author == player2) {
                if(verifyMessage(message.content) && !number2set) {
                    number2 = message.content;
                    number2set = true;
                    message.channel.send("Your number is " + number2);
                } else {
                    message.channel.send("Number should be 3 digits long, and have no zeroes or repetition")
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
    
    switch(command) {
        case "help":
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
                
                "To start playing, type !play @user");
            break;

        case "play":
            if(args.length == 1 && (gameState == GameState[0] || gameState == GameState[1])) {
                player1 = message.author;
                player2 = getUserFromMention(args[0]);

                if(player1 == player2) {
                    message.channel.send("You can't play with yourself!");
                } else {
                    gameState = GameState[1];
                    gameChannel = message.channel;
                    message.channel.send(args[0] + " please type !ready to start game");
                }
            }
            break;

        case "ready":
            if(gameState == GameState[1] && player2 == message.author && message.channel == gameChannel) {
                gameState = GameState[2];
                message.channel.send("Please DM your numbers to me <@" + player1.id + "> and <@" + player2.id + ">");
                player1.send("Send a 3 digit number.");
                player2.send("Send a 3 digit number.");
                interval = setInterval(checkForNumbers, 3000);
            }
            break;

        case "guess":
            if(gameState == GameState[3] && message.channel == gameChannel && args.length == 1) {
                if((player1turn && message.author == player1) || (!player1turn && message.author == player2)) {
                    if(verifyMessage(args[0])){
                        if((player1turn && args[0] == number2) || (!player1turn && args[0] == number1)) {
                            if(player1turn) {
                                gameState = GameState[4];
                                player1turn = !player1turn;
                                gameChannel.send("3 " + config.redsname + "!!!")
                                gameChannel.send("<@" + player2.id + "> , you have a chance to tie! Its your turn.");
                            } else {
                                reset();
                                gameChannel.send("<@" + player2.id + "> win lol :partying_face:");
                            } 
                        } else {
                            if(player1turn) message.channel.send(checkGuess(args[0], number2))
                            else message.channel.send(checkGuess(args[0], number1))

                            player1turn = !player1turn;

                            if(player1turn) gameChannel.send("Its <@" + player1.id + "> 's turn");
                            else gameChannel.send("Its <@" + player2.id + "> 's turn");
                        }
                    } else {
                        message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
                    }
                }
            } else if(gameState == GameState[4] && message.channel == gameChannel && args.length == 1) {
                if(message.author == player2) {
                    if(verifyMessage(args[0])){
                        if(args[0] == number1) {
                            reset();
                            gameChannel.send("Its a tie! :partying_face:");
                        } else {
                            reset();
                            gameChannel.send("<@" + player1.id + "> win lol :partying_face:");
                        }
                    } else {
                        message.channel.send("Number should be 3 digits long, and have no zeroes or repetition");
                    }
                }
            }
            break;   
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

function checkForNumbers() {
    if(number1set && number2set) {
        gameState = GameState[3];
        gameChannel.send("You can start guessing using !guess [number]");
        gameChannel.send("Its <@" + player1.id + "> 's turn");
        player1turn = true;
        clearInterval(interval);
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

function reset() {
    number1set = false;
    number2set = false;
    gameState = GameState[0];
}

client.login(process.env.BOT_TOKEN);