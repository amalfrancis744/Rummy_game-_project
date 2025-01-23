const notificationModule = require('./notifications')

module.exports = {
    
    //Fetch Particular Data 
    getNotification : async(data) => {
        return await notificationModule.findOne(data).lean();
    },
    //Saving Document
    saveNotification : async ( data ) => {
        return await notificationModule(data).save();
    },
    //Table-listing
    notificationListing : async ( query  ,  limit , skip, orderBy , order) => {
        return await notificationModule.find(query).lean().skip(parseInt(skip)).limit(parseInt(limit)).sort({[orderBy]:order})
    },
    // notification populate user
    loadNotification : async (data) =>{
        return await notificationModule.findOne(data).lean().populate('users.userId');
    },
    //Fetch all Tables
    getAllNotification : async (data ) => {
        return await notificationModule.find(data).lean()
    },
    //Updating Document
    updateNotification : async (id , data) => {
        return await notificationModule.updateOne({_id : id },{$set : data })
    },
    //Dropping Document
    dropNotification : async ( data ) => {
        return await notificationModule.deleteOne(data);
    },
    //Counting Document
    notificationCountDocument: async ( option ) => {
        return await notificationModule.countDocuments(option)
    },
}