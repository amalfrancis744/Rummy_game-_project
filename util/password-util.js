const bcrypt = require('bcrypt');

function cryptPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

function comparePassword(plainPass, hashword) {
    return bcrypt.compareSync(plainPass, hashword);
}

module.exports = {
    cryptPassword,
    comparePassword,
};
