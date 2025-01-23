const response = require('../../services/response')
const queries = require('../../model/walletDetails/index');

module.exports = {


    //Adding Wallet Details
    addwalletDetails : async ( req , res ) => {
        let { transactionType , amount } = req.body;
        
        if(!transactionType || !amount ) 
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "Invalid Parameters"
                )
            )
        console.log(transactionType)
        type = [ 'Deposit', 'Withdraw', 'Bonus']
        if (!type.includes(transactionType))
            return (
                await response.errorResponse(
                    res ,
                    401,
                    "transactionType should be deposit, withdraw or bonus"
                )
            )

        try{
            let savingTransaction = await queries.saveWalletDetails(
                { 
                    user: req.auth._id , 
                    transaction_type : transactionType,
                    amount :  amount,
                    status:'completed'
                });
            
            return (
                await response.successResponse(
                    res,
                    200,
                    "Transaction has been added",
                    {
                        _id : savingTransaction?._id,
                        user:savingTransaction?.user,
                        transaction_type : savingTransaction?.transaction_type,
                        amount : savingTransaction?.amount,
                        status : savingTransaction?.status,
                        created_at: savingTransaction?.createdAt,
                    }
                )
            )
        }catch(err){
            console.log(`Add Transaction error occured : ${err}`);
            return res.status(200).send({code:400 , status:'failure',message:err?.message});
        }
    },
    //Fetch All Wallet Details
    fetchwalletDetails : async (req , res ) => {
        try{
            let walletDetails = await queries.getAllWalletDetails({user:req.auth._id});
            if(walletDetails?.length === 0) 
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );

            walletDetails.map((e , index) =>{
                e['serialNo'] = index + 1;
            })

            return await response.listSuccessResponse(
                res,
                200 , 
                'Wallet Details List' , 
                walletDetails ,
                walletDetails?.length 
            );

        }catch(err){
            console.log(`Fetch walletDetails error occured : ${err}`);
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