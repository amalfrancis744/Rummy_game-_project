const response = require('../../services/response')
const queries = require('../../model/bankDetails/index');

module.exports = {


    //Adding Bank Details
    addBankDetails: async (req, res) => {
        let { type, upiId, accountNumber, confirmAccountNumber, ifscCode, accountHolderName } = req.body;
        console.log(req.body)
        if (!type)
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            )
        const bank_type = ['upi', 'bank']
        if (!bank_type.includes(type))
            return (
                await response.errorResponse(
                    res,
                    401,
                    "type should be upi or bank"
                )
            )
        try {
            if (type == "upi") {

                if (!upiId)
                    return (
                        await response.errorResponse(
                            res,
                            401,
                            "Invalid Parameters"
                        )
                    )
                const bankDetailsExist = await queries.getBankDetails({upi_id : upiId})
                if (bankDetailsExist)
                    return (
                        await response.errorResponse(
                            res,
                            401,
                            "UPI Id already exist"
                        )
                    )
                let savingUpiBankDetails = await queries.saveBankDetails(
                    {
                        userId: req.auth._id,
                        type: type,
                        upi_id: upiId,
                    });

                return (
                    await response.successResponse(
                        res,
                        200,
                        "Bank Details has been added",
                        {
                            _id: savingUpiBankDetails?._id,
                            user: savingUpiBankDetails?.userId,
                            type: savingUpiBankDetails?.type,
                            upi_id: savingUpiBankDetails?.upi_id,
                            added_at: savingUpiBankDetails?.createdAt,
                        }
                    )
                )
            }
            else if (type == "bank") {
                if (!accountNumber || !confirmAccountNumber || !ifscCode || !accountHolderName)
                    return (
                        await response.errorResponse(
                            res,
                            401,
                            "Invalid Parameters"
                        )
                    )
                if (accountNumber != confirmAccountNumber)
                    return (
                        await response.errorResponse(
                            res,
                            401,
                            "Confirm Account Number does not match Account Number"
                        )
                    )
                const bankDetailsExist = await queries.getBankDetails({account_number : confirmAccountNumber})
                if (bankDetailsExist)
                    return (
                        await response.errorResponse(
                            res,
                            401,
                            "Bank Details already exist"
                        )
                    )
                let savingUpiBankDetails = await queries.saveBankDetails(
                    {
                        userId: req.auth._id,
                        type: type,
                        account_number: confirmAccountNumber,
                        ifsc_code: ifscCode,
                        account_holder_name: accountHolderName,
                    });

                return (
                    await response.successResponse(
                        res,
                        200,
                        "Bank Details has been added",
                        {
                            _id: savingUpiBankDetails?._id,
                            userId: savingUpiBankDetails?.userId,
                            type: savingUpiBankDetails?.type,
                            account_number: savingUpiBankDetails?.account_number,
                            ifsc_code: savingUpiBankDetails?.ifsc_code,
                            account_holder_name: savingUpiBankDetails?.account_holder_name,
                            addedAt: savingUpiBankDetails?.createdAt,
                        }
                    )
                )
            }

        } catch (err) {
            console.log(`Add Bank Details error occured : ${err}`);
            return res.status(200).send({ code: 400, status: 'failure', message: err?.message });
        }

        // type = [ 'Deposit', 'Withdraw', 'Bonus']
        // if (!type.includes(transactionType))
        //     return (
        //         await response.errorResponse(
        //             res ,
        //             401,
        //             "transactionType should be deposit, withdraw and bonus"
        //         )
        //     )

        // try{
        //     let savingTransaction = await queries.saveWalletDetails(
        //         { 
        //             user: req.auth._id , 
        //             transaction_type : transactionType,
        //             amount :  amount,
        //             status:'completed'
        //         });

        //     return (
        //         await response.successResponse(
        //             res,
        //             200,
        //             "Transaction has been added",
        //             {
        //                 _id : savingTransaction?._id,
        //                 user:savingTransaction?.user,
        //                 transaction_type : savingTransaction?.transaction_type,
        //                 amount : savingTransaction?.amount,
        //                 status : savingTransaction?.status,
        //                 created_at: savingTransaction?.createdAt,
        //             }
        //         )
        //     )
        // }catch(err){
        //     console.log(`Add Transaction error occured : ${err}`);
        //     return res.status(200).send({code:400 , status:'failure',message:err?.message});
        // }
    },
    //Fetch All Bank Details
    fetchBankDetails: async (req, res) => {
        try {
            let bankDetails = await queries.getAllBankDetails({ userId: req.auth._id });
            if (bankDetails?.length === 0)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Data found"
                    )
                );

            bankDetails.map((e, index) => {
                e['serialNo'] = index + 1;
            })

            return await response.listSuccessResponse(
                res,
                200,
                'bank Details',
                bankDetails,
                bankDetails?.length
            );

        } catch (err) {
            console.log(`Fetch bankDetails error occured : ${err}`);
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