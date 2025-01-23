const User = require("./user");



module.exports = {
    //Fetch particular document from DB
    getUser : async (data) => {
        return await User.findOne(data);
    },

    //Saving document
    saveUser : async (data) => {
        return await User(data).save();
    },

    //Updating Document
    updateUser : async ( id , data ) => {
        return await User.findOneAndUpdate({_id : id} , {$set : data} ,{returnOriginal:false} )
    },

    //Inserting Players
    insertPlayer : async (roomId , data ) =>{
        return await User.updateOne(
            {
                _id : roomId
            } ,
            {
                $push : { players : data }
            })
    },

    //Updating Token
    updateToken : async (id , token ) => {
        console.log("Token in updateToken function-->" , token)
        return await User.findOneAndUpdate({_id : id } ,{$set : token },{returnOriginal:false} )
    },

    //User List via Data-table
    userListing : async(search  ,  limit , skip, orderBy , order) => {
        return await User.find(search).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:-order})
    },

    //Counting documents
    countingDocuments : async ( option ) => {
        return await User.countDocuments(option)
    },

    //Removing a document from DB
    dropUser : async ( data ) => {
        return User.deleteOne(data);
    },
      // Find User for notification
    findUser : async(data,field) =>{
        return await User.find(data,field)
    },
    // List All User for notification
    listAllUser : async() =>{
        return await User.find()
    },
}