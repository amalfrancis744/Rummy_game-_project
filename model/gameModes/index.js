const gameModesModule = require('./gameModes');


module.exports = {

    //Fetch Particular cms
    getGameMode : async ( data ) => {
        return await gameModesModule.findOne(data);
    },

    //Saving Document
    saveGameMode : async ( data ) => {
        return await gameModesModule(data).save();
    },

    //Updating Document
    updateGameMode: async ( id , data ) => {
        return await gameModesModule.updateOne(id,{$set:data})
    },

    //Fetch all Document
    getAllGameMode: async () => {
        return await gameModesModule.find().lean();
    },

    //Deleting a document
    removeGameMode : async ( data ) =>{
        return await gameModesModule.deleteOne(data);
    },

    
}