const mongoose = require('mongoose');
const mongoQueryUtil = require('../util/mongo-query-util');
const GameSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  url: {
    type: String,
  },
  orientation: {
    type: String,
  },
  instruction: {
    type: String,
  },
  image:{
    type: String,
  },
  banner:{
    type: String,
  },
  featuredGame: {
      type: Boolean
  },
  status: {
      type: Boolean
  },
  totalPlayersToAllow: {
    type: Number
  }
}, {
  timestamps: true
});

const model = mongoose.model('mgp_rummy_game', GameSchema);
model.getPage = query => mongoQueryUtil.getPage(model, query);
module.exports = model;
