const queries = require('../../model/referral/index');
const response = require('../../services/response');


module.exports = {

    //*********************************User-side **************************************** */

    //Referral list 
    listing : async ( req , res ) => {

        const id = req.params.id;

        if(!id) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            )

        try{

            let referrals = await queries.getAllReferrals({referredFrom : id});

            if(referrals.length == 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No referrals"
                    )
                )

            for(let element of referrals){
                let referralFromDetails = await queries.getUser({_id : element.referredFrom}); 
                let referralToDetails = await queries.getUser({_id : element.referredTo}); 

                element.referredFrom = {
                    name : referralFromDetails?.name,
                    referredFromId : referralFromDetails?._id
                }
                element.referredTo ={
                    name : referralToDetails?.name,
                    referredToId : referralToDetails?._id
                }
            }

            return (
                await response.listSuccessResponse(
                    res,
                    200,
                    "Fetching Referral List",
                    referrals,
                    referrals?.length
                )
            )
            
        }catch(err){
          
            console.log("Error occured while fetching referrals" , err);
          
            return (
                await response.errorResponse(
                    res, 
                    400,
                    err?.message
                )
            )
        }
    },
}