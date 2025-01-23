const { createLogger, transports } = require('winston');

const logger = createLogger({
    transports: [
        new transports.File({
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
        }),
        new transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

logger.stream = {
    write: function (message) {
        logger.info(message);
    }
};

module.exports = logger;
