/**
 * services
 */
const actuatorServiceTest = require('./services/actuator-service-test');
const gameServiceTest = require('./services/game-service-test');
const rummyServiceTest = require('./services/rummy-service-test');
/**
 * sqs
 */
const adminUserUpdateProcessorTest = require('./sqs/receiver/admin-user-update-test');
/**
 * util 
 */
const mongoQueryUtilTest = require('./util/mongo-query-util-test');
function main() {
    actuatorServiceTest.run();
    gameServiceTest.run();
    mongoQueryUtilTest.run();
    adminUserUpdateProcessorTest.run();
    rummyServiceTest.run();
}

main();

