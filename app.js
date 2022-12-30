const http = require('http');
const express = require('express');
const consolidate = require('consolidate');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const routes = require('./routes'); 
const socketEvents = require('./socket-events');

const app = express();

app.use(bodyParser.urlencoded({
    extended: true,
}));

app.use(bodyParser.json({
    limit: '5mb'
}));

app.set('views', 'views'); 
app.use(express.static('./public')); 

app.set('view engine', 'html');
app.engine('html', consolidate.handlebars); 

const db = 'mongodb://0.0.0.0:27017/campusSafety';
mongoose.connect(db, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true }).then(value => {
    console.log(value.models);
}).catch(error => {
    console.log(error);
});

app.use('/', routes);

const server = http.Server(app);
const portNumber = 8000; 

server.listen(portNumber, () => { 
    console.log(`Server listening at port ${portNumber}`);
    socketEvents.initialize(server);
});