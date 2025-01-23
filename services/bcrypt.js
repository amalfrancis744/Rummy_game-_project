const bcrypt = require('bcrypt');

module.exports = {

    //Encrypting password
    hashPass : async (value , salt ) => {
        return bcrypt.hashSync( value ,salt );
    },

    //Comparing Password
    comparePass : async ( value , realValue ) => {
        return bcrypt.compareSync( value , realValue );
    }
}