const mongoose = require("mongoose");

global.disconnectDatabase = () => {};
console.log(process.env.MONGO_DB_CONNECTION_URL);
mongoose
  .connect(process.env.MONGO_DB_CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((databaseConnection) => {
    console.log(` CONNECTING TO DB ${process.env.MONGO_DB_CONNECTION_URL}`);
    global.databaseConnection = databaseConnection;

    global.disconnectDatabase = () => {
      global.databaseConnection.disconnect();
    };
  });

module.exports = {
  mongoose,
};
