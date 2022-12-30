const dbOperations = require('./db/db-operations');
const mongoose = require('mongoose');

function initialize(server) {
	const io = require('socket.io')(server);

	io.on('connection', (socket) => { 
		console.log('A user has connected');

		socket.on('join', (data) => { 
			socket.join(data.userId); 
			console.log(`User joined room: ${data.userId}`);
		});

		socket.on('request-for-help', async (eventData) => {
            // Save request details in the collection requestsData
			const requestTime = new Date();
			const requestId = mongoose.Types.ObjectId(); 
			const location = { // Convert latitude and longitude to [longitude, latitude]
				coordinates: [
					eventData.location.longitude,
					eventData.location.latitude
				],
				address: eventData.location.address
			};

			await dbOperations.saveRequest(requestId, requestTime, location, eventData.civilianId, 'waiting');

			// Fetch nearby cops from civilian’s location
			const nearestCops = await dbOperations.fetchNearestCops(location.coordinates, 2000);
			eventData.requestId = requestId;

			// Fire 'request-for-help' event to each of them
			for (let i = 0; i < nearestCops.length; i++) {
				io.sockets.in(nearestCops[i].userId).emit('request-for-help', eventData);
			}

		});

		socket.on('request-accepted', async (eventData) => { 
			console.log('eventData contains: ', eventData);

			const requestId = mongoose.Types.ObjectId(eventData.requestDetails.requestId);

			// Update request in the database with cop details for given requestId
			await dbOperations.updateRequest(requestId, eventData.copDetails.copId, 'engaged');

			// Send 'request-accepted' event to civilian with cop details
			io.sockets.in(eventData.requestDetails.civilianId).emit('request-accepted', eventData.copDetails);
		});

	});
}

exports.initialize = initialize;