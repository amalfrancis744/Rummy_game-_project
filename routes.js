module.exports = {
  configure: (app) => {
    // app.use('/mgp-rummy/api/v1/events', require('./sqs/receiver/index'));

    app.use("/mgp-rummy/api/v1/actuator", require("./routes/actuator"));
    app.use("/mgp-rummy/api/v1/games", require("./routes/game-router"));
    app.use("/mgp-rummy/api/v1/", require("./routes/index"));
    app.use("/mgp-rummy/api" ,  require("./routes/admin/user"));
    app.use("/mgp-rummy/api" , require('./routes/cms'));
    app.use("/mgp-rummy/api" , require('./routes/gameModes'));
    app.use("/mgp-rummy/api/admin", require('./routes/admin'));

    app.use("/mgp-rummy/api/", require('./routes/admin/user'));
    app.use("/mgp-rummy/api/", require('./routes/admin/table'));
    app.use("/mgp-rummy/api/", require('./routes/admin/notification'));
    app.use("/mgp-rummy/api/", require('./routes/admin/tournament'));
    app.use("/mgp-rummy/api/", require('./routes/admin/kyc'));

    app.use("/mgp-rummy/api" , require('./routes/walletDetails'));
    app.use("/mgp-rummy/api" , require('./routes/gameResult'));
    app.use("/mgp-rummy/api" , require('./routes/bankDetails'));
    app.use("/mgp-rummy/api" , require('./routes/report'));
    

    // app.use("/mgp-rummy/api/v1/admin", require('./routes/admin-panel'));
    app.get('/', function(req, res) {
      return res.redirect("/mgp-rummy/api/admin");
    })
  },
};

