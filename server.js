/**
 * METRO TETRIS - Simple UDP Server
 */

var PORT = 1337;
var HOST = "127.0.0.1";

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var clients = [];

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

function getFreePlayer(seeker) {
	for (var i = 0; i < clients.length; i++) {
		var c = clients[i];
		if ((c.remote.port != seeker.remote.port || c.remote.address != seeker.remote.address) && c.enemy == null) {
			return clients[i];
		} else {
			console.log(seeker.remote.port + ' = ' + c.remote.port)
		}
	}
	return null;
}

function getSender(addr, port) {
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].remote.port == port && clients[i].remote.address == addr) {
			return clients[i];
		}
	}
	return null;
}

function removeClient(c) {
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].remote.port == c.remote.port && clients[i].remote.address == c.remote.address) {
			console.log("Remove client ", clients[i]);
			clients[i] = null;
			clients.splice(i, 1);
			return;
		}
	}
}
	
function getTimedOutPlayers() {
	var index = null;
	var freePlayer = null;
	for (var i = 0; i < clients.length; i++) {
		var diff = new Date().getTime() - clients[i].lastUpdate.getTime() ;
		
		if (diff >= 60000) {
	        removeClient(clients[i]);
	        break;
		}
	}
}

server.on('message', function (message, remote) {
	message = message.toString('utf8')
	var sender = getSender(remote.address, remote.port);
	if (sender == null) {
		if (message == "CONNECT") {
			var newClient = {
				remote: remote,
				free: true,
				enemy: null,
				lastUpdate: new Date()
			}
			clients.push(newClient);
		
			var response = new Buffer("WAIT");

			server.send(response, 0, response.length, remote.port, remote.address, function(err, bytes) {
			    if (err) throw err;
			});
		} else {
			response = new Buffer("UNKNOWN");
			server.send(response, 0, response.length, remote.port, remote.address, function(err, bytes) {
			    if (err) throw err;
			});
		}
	} else {
		// Update sender
		sender.lastUpdate = new Date();
		
		if (message == "RETRY") {
			if (sender.enemy != null) {
				response = new Buffer("IGNORED");
				server.send(response, 0, response.length, remote.port, remote.address, function(err, bytes) {
				    if (err) throw err;
				});
				return;
			}
			var freePlayer = getFreePlayer(sender);
			var response = new Buffer("WAIT");
			
			if (freePlayer == null) {
				response = new Buffer("WAIT");
				server.send(response, 0, response.length, remote.port, remote.address, function(err, bytes) {
				    if (err) throw err;
				});
			} else {
				response = new Buffer("CONNECT_TO " + freePlayer.remote.addresse + ':' + freePlayer.remote.port);
			
				sender.enemy = freePlayer;
				freePlayer.enemy = sender;
			
				server.send(response, 0, response.length, remote.port, remote.address);
				
				response = new Buffer("CONNECT_TO " + sender.remote.addresse + ':' + sender.remote.port);
				server.send(response, 0, response.length, sender.enemy.remote.port, sender.enemy.remote.address);
			}
		}
		
		if (message == "QUIT") {
			if (sender.enemy != null) {
				sender.enemy.free = true;
				sender.enemy.enemy = null;
				response = new Buffer("WAIT");
				server.send(response, 0, response.length, sender.enemy.remote.port, sender.enemy.remote.address, function(err, bytes) {
				    if (err) throw err;
				});
			}
			removeClient(sender);
			return;
		}
		
		if (new RegExp("WORLD").test(message)) {
			if (sender.enemy != null) {
				var response = new Buffer(message);
				
				server.send(response, 0, response.length, sender.enemy.remote.port, sender.enemy.remote.address, function(err, bytes) {
				    if (err) throw err;
				});
			} else {
				response = new Buffer("WAIT");
				server.send(response, 0, response.length, remote.port, remote.address, function(err, bytes) {
				    if (err) throw err;
				    console.log('Sent disconnect (WAIT) to ' + remote.address +':'+ remote.port);
				});
			}
		}
	}
	getTimedOutPlayers();
});

server.bind(PORT, HOST);