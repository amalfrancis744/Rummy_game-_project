const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const app = express();
const router = express.Router();
const http = require('http');
const https = require('https');
const config = require('./config/index');
const session = require('cookie-session');
const mongoose = require('mongoose');

require('./cron/index.js');

app.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true
    })
);

//require('./routes/game-api')(router);
const server = http.createServer(app);
const socket = require('socket.io')(server);
require('./socket')(socket);

require('./routes/admin-panel')(router, socket);
require('./routes/index')(router);

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

app.use(
    bodyParser.urlencoded({
        extended: true,
        type: 'application/x-www-form-urlencoded'
    })
);

app.use(fileUpload());
app.use(bodyParser.json());
app.use('/', router);

/**
 *	Server bootup section
 **/
try {
    // DB Connect
    mongoose.set('useCreateIndex', true);
    mongoose.connect(
        `${config.dbConnectionUrl}`,
        { useNewUrlParser: true, useUnifiedTopology: true },
        d => {
            if (d) return console.log(`ERROR CONNECTING TO DB ${config.dbConnectionUrl}`, d);
            console.log(`Connected to ${process.env.NODE_ENV} database: `, `${config.dbConnectionUrl}`);
            server.listen(config.port, function () {
                console.log('Admin Server listening at PORT:' + config.port);
            });
        }
    );
} catch (err) {
    console.log('DBCONNECT ERROR', err);
}

module.exports = app;
