require("dotenv").config();
// process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION ||'ap-south-1';
const logger = require("./util/logger");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const uuid = require("node-uuid");
const md5 = require("md5");
const path = require("path");
const session = require("express-session");

global.APP_URL = `${process.env.URL}/`

module.exports = async () => {
  // await require("./util/parameter-store").init();
  require("./util/database-connection");

  // require("./migration")
  //   .run()
  //   .then(() => {
  //     logger.info("Database migration completed");
  //   })
  //   .catch((error) => {
  //     logger.error("Error while migrating database", error);
  //     // eslint-disable-next-line no-console
  //     console.error(error);
  //     process.exit(1);
  //   });

  const { ErrorCodes } = require("./model/base-response");
  const { SERVICE_NAME } = require("./util/constants");
  const routes = require("./routes");
  const socket = require("./socket");
  const cronjob = require("./services/cronjob");

  const app = express();
  app.use(cors());
  app.use(cookieParser());
  app.use(
    session({
      cookie: { maxAge: 2000 },
      saveUninitialized: true,
      resave: "true",
      secret: "secret",
    })
  );
  app.use(flash());
  app.use(function (req, res, next) {
    res.locals.message = req.flash();
    next();
});

  app.use(function (req, res, next) {
    req.user = null;
    next();
  });

  const http = require("http");
  const server = http.createServer(app);

  const notFoundHandler = function (req, res, next) {
    next(createError(404));
  };
  morgan.token("id", function getId(req) {
    return req.id;
  });

  morgan.token("traceId", function getId(req) {
    return req.traceId;
  });

  morgan.token("logId", function getId(req) {
    return req.logId;
  });

  morgan.token("userId", function getId(req) {
    return req.headers["user.id"];
  });

  morgan.token("timestamp", function getId() {
    return new Date().toISOString();
  });

  app.use((req, res, next) => {
    // console.trace("HERE");
    req.id = md5(uuid.v4());
    req.traceId = req.header("eg-request-id") || "-";
    req.logId = [
      SERVICE_NAME,
      `traceId[${req.traceId}]`,
      `spanId[${req.id}]`,
      `user[${req.header("user.id") || "-"}]`,
    ].join(" ");
    req.log = (...args) => {
      logger.info([new Date().toISOString(), req.logId, ...args].join(" "));
    };
    req.error = (...args) => {
      logger.error([new Date().toISOString(), req.logId, ...args].join(" "));
    };
    next();
  });

  app.use(
    morgan(
      `:timestamp ${SERVICE_NAME} traceId[:traceId] spanId[:id] user[:userId] :method :url :status :response-time ms`,
      { stream: logger.stream }
    )
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  routes.configure(app);
  
  await socket.configure(server);

  if ("production" === process.env.NODE_ENV) {
    app.use("/mgp-rummy/api/v1/api-docs", notFoundHandler);
  }
  app.use(express.static(path.join(__dirname , '/assets/')))
  app.use("/mgp-rummy/api/v1/", express.static(path.join(__dirname, "public")));

  // app.use('/', validateAuth0JWT);

  // catch 404 and forward to error handler
  // app.use(notFoundHandler);

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use(function (error, req, res, next) {
    if (req.error) {
      req.error(`error handler: :${JSON.stringify(error)}, obj: ${error}`);
    } else {
      logger.error(
        `${new Date().toISOString()} ${
          req.logId
        } error handler: :${JSON.stringify(error)}, obj: ${error}`
      );
    }
    if (error && 404 !== error.status) {
      // eslint-disable-next-line no-console
      console.error(new Date().toISOString(), req.logId, error);
    }
    if (res.headersSent) {
      return;
    }
    if (error.message && error.message.includes("invalid input syntax")) {
      error = { ...ErrorCodes.BAD_REQUEST, errorDescription: error.message };
    }
    res.status(error.status || 500);
    if (error.errorDescription) {
      error.errorDescription = error.errorDescription.trim();
    }
    res.send({
      errors: [{ code: error.code, message: error.message }],
      errorDescription: error.errorDescription,
      meta: error.meta,
    });
  });



  global.roomTimer = [] ;
  
  return { app, server };
};
