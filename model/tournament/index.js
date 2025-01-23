const tournamentModule = require('./tournament');

module.exports ={


      //Fetch Particular Data 
    getTournament : async(data) => {
        return await tournamentModule.findOne(data).lean();
    },
    //Saving Document
    saveTournament : async ( data ) => {
        return await tournamentModule(data).save();
    },
    //Table-listing
    tournamentListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await tournamentModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },
    //Fetch all Tables
    getAllTournament : async (data ) => {
        return await tournamentModule.find(data).lean().sort({entry_fee : 1})
    },
    //Updating Document
    updateTournament : async (id , data) => {
        return await tournamentModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropTournament : async ( data ) => {
        return await tournamentModule.deleteOne(data);
    },
    //Counting Document
    tournamentCountDocument: async ( option ) => {
        return await tournamentModule.countDocuments(option)
    },
}