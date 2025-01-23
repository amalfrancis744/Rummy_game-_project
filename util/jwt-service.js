const jwt = require('jsonwebtoken');

const GAME_TOKEN_SECRET = process.env.GAME_TOKEN_SECRET || 'GAME_TOKEN_SECRET';

function decodeGameToken(token) {
    try {
        return jwt.verify(token, GAME_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    decodeGameToken,
};
