const gameResultModule = require('./gameResult');

module.exports ={
   
    //Fetch Particular Data 
    getGameResult : async(data) => {
        return await gameResultModule.findOne(data).lean();
    },
    //Saving Document
    saveGameResult : async ( data ) => {
        return await gameResultModule(data).save();
    },
    //Table-listing
    gameResultListing : async ( query  , limit , skip) => {
        return await gameResultModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({createdAt : -1}).populate("opponent","name profilepic")
    },
    //Fetch all Tables
    getAllGameResult : async (data ) => {
        return await gameResultModule.find(data).lean().sort({createdAt : -1})
    },
    //Updating Document
    updateGameResult : async (id , data) => {
        return await gameResultModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropGameResult : async ( data ) => {
        return await gameResultModule.deleteOne(data);
    },
    //Counting Document
    gameResultCountDocument: async ( option ) => {
        return await gameResultModule.countDocuments(option)
    },

}