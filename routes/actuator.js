const express = require('express');
const asyncHandler = require('../util/async-handler');
const router = express.Router();

const actuatorService = require('../services/actuator-service');

router.get('/', asyncHandler(async () => {
  return actuatorService.getStatus();
}));

module.exports = router;
