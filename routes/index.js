const express = require('express');
const asyncHandler = require('../util/async-handler');
const router = express.Router();

const redisService = require('../services/redis-service')('');

router.get('/', asyncHandler(async () => {
  return 'API';
}));

router.post('/redis', asyncHandler(async (res) => {
  return redisService[res.body.method](...res.body.args);
}));

router.get('/redis/all', asyncHandler(async () => {
  return redisService.getAll('*');
}));

router.delete('/redis/all', asyncHandler(async () => {
  const keys = await redisService.keys('*');
  return Promise.all(keys.map(async key => {
    let flag = false;
    try {
      await redisService.hDel(key);
      flag = true;
    } catch (error) {
      //
    }
    try {
      await redisService.del(key);
      flag = true;
    } catch (error) {
      //
    }
    return { [key]: flag };
  }));
}));

module.exports = router;
