module.exports = logger;

// Logger configuration
const logConfiguration = {
    "transports":[
        new winston.transports.File({
            filename:"./views/bakery.log"
        })
        ]
};
// create logger
const logger = winston.createLogger(logConfiguration);