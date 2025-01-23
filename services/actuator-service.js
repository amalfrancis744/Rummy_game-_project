const Actuator = require("../model/actuator");

async function getStatus() {
  return {
    database: (await checkDatabase()) ? "up" : "down",
  };
}

async function checkDatabase() {
  try {
    await Actuator.create({});
    await Actuator.deleteMany({});
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getStatus,
};
