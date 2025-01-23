const tableModule = require('./table');


module.exports ={


      //Fetch Particular Data 
    getTable : async(data) => {
        return await tableModule.findOne(data).lean();
    },
    //Saving Document
    saveTable : async ( data ) => {
        return await tableModule(data).save();
    },
    //Table-listing
    tableListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await tableModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },
    //Fetch all Tables
    getAllTables : async (data ) => {
        return await tableModule.find(data).lean().sort({entry_fee : 1})
    },
    //Updating Document
    updateTable : async (id , data) => {
        return await tableModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropTable : async ( data ) => {
        return await tableModule.deleteOne(data);
    },
    //Counting Document
    tableCountDocument: async ( option ) => {
        return await tableModule.countDocuments(option)
    },
}