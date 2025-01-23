const queries = require("../../../model/table/index");
const response = require("../../../services/response");
const commonService = require("../../../services/common");
const constants = require("../../../util/constants");

module.exports = {
    
    //*********************************PAGES*************************************** */

    //Load Edit Table Page
    loadEditTable : async ( req,res) => {
        
        const id = req.params.id
        console.log("id-----",id)
        const tableData = await queries.getTable({_id:id})
        let admin ={
            url : process.env.URL,
            adminProfile : '',
            token: req.cookies.token,
            
        }
        const data = { tableData, admin };
        commonService.redirecting( req, res , 'pages/tableManagement/editTable' , data)
    },


    //***************Admin-side Table Management functions *******************************/

    //Creating a new table
    addTable: async (req, res) => {
        console.log(req.body)
        let { gameplayType, gameMode, entryFee, totalPlayer, adminCommission , pointValue , rummyPoints,hiddenWinningAmount} = req.body;

        console.log("Request-->" ,req.body)
        if (!entryFee ||!totalPlayer || !adminCommission || !pointValue || !gameMode || !gameplayType)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
        try{
            let winAmount = hiddenWinningAmount ; 
            
            gameplayType === constants?.RUMMY_TYPE?.POINT ? rummyPoints = "" : rummyPoints = rummyPoints
         
            if(gameplayType !== constants?.RUMMY_TYPE?.POINT && gameplayType !== constants?.RUMMY_TYPE?.POOL)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Game play type"
                    )
                )

            let tableExists = await queries.getTable({
                $and : [
                    {game_mode : gameMode },
                    {no_of_players : totalPlayer },
                    {entry_fee : entryFee },
                    {rummy_type : gameplayType },
                    {rummy_points : rummyPoints },

                ] 
            });
            // {game_mode: game_mode,entry_fee: entryFee}
            console.log("table--->" , tableExists);
            
            if (tableExists)
                return (
                    await response.errorResponse(
                        res, 
                        400, 
                        "Table already Exists"
                    )
                );

            let savingTable = await queries.saveTable({
                rummy_type: gameplayType,
                rummy_points : rummyPoints,
                game_mode: gameMode,
                no_of_players: totalPlayer,
                entry_fee: entryFee,
                win_amount: winAmount,
                admin_commission:adminCommission,
                point_value : pointValue
            });

            return await response.successResponse(
                res,
                200,
                "A New Table has been created successfully.",
                {
                _id: savingTable?._id,
                rummy_type: savingTable?.rummy_type,
                rummy_points : savingTable?.rummy_points,
                game_mode: savingTable?.game_mode,
                no_of_players: savingTable?.no_of_players,
                entry_fee: savingTable?.entry_fee,
                win_amount: savingTable?.win_amount,
                admin_commission: savingTable?.admin_commission,
                created_at: savingTable?.created_at,
                point_value : savingTable?.point_value
                }
            );
        } catch (err) {
            console.log("Error occured while Creating table", err);
        return await response.errorResponse(res, 400, err?.message);
        }
    },
    //Listing via Data-table
    fetchTable : async ( req , res ) => {
        try{ 

            const columnIndex = req.query.order ? req.query.order[0].column : undefined;
            let columnName = columnIndex ? req.query.columns[columnIndex].data : "";
            const columnSortOrder = req.query.order ? req.query.order[0].dir : "";
            const value = req.query.search.value ? req.query.search.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : undefined;
            const regex = value ? new RegExp(value, "i") : undefined;
            
            columnName = columnSortOrder == "asc" ? columnName : "-" + columnName
            const stringQuery = {
                $or: [
                    { game_mode: regex }
                ]
            };
            let numericQuery = {};
            if (!isNaN(parseFloat(value))) {
                const numericValue = parseFloat(value);
                numericQuery = {
                    $or: [
                        { rummy_points: numericValue },
                        { entry_fee: numericValue },
                        { win_amount: numericValue },
                        { admin_commission: numericValue },
                        { no_of_players : numericValue}
                    ]
                };
            }

            const searchOptions = value?{$or: [stringQuery, numericQuery]}:{};
            console.log("--------",searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder)
            
            let tableList = await queries.tableListing(searchOptions  ,  req.query.length , req.query.start , columnName , columnSortOrder);
            
            let indexes = (req.query.start * 1) + 1;
            tableList.map((el) => {
                el['serialNo'] = indexes;
                el['admin_commission'] = el['admin_commission'] + "%";
                el['action'] = `<a href="/mgp-rummy/api/edit-table/${el._id}"><button  type="button" class="btn btn-info">
                <i class="fa fa-pencil"></i>
                    </button>
                    </a>`;
                el['rummy_type'] === constants?.RUMMY_TYPE?.POINT ? el['rummy_type'] = constants?.RUMMY_TYPE_MAPPING.POINT : el['rummy_type'] = constants?.RUMMY_TYPE_MAPPING.POOL
                el['rummy_points'] === ''?el['rummy_points'] = '-':el['rummy_points'] = el['rummy_points'];
                indexes++;
            });
            
            const recordsTotal = await queries.tableCountDocument(searchOptions);
            
            const data = {
                draw: req.query.draw,
                recordsFiltered: recordsTotal,
                recordsTotal: recordsTotal,
                data: tableList,
            };
            
            res.json(data);
        }
        catch(err){
            console.log("something went wrong : ", err)
        }

    },
    // Updating table
    updateTable: async (req, res) => {
        console.log(req.body)
        let { tableId,gameplayType, gameMode, entryFee, totalPlayer, adminCommission , pointValue , rummyPoints, hiddenWinningAmount} = req.body;
        if (!entryFee ||!totalPlayer || !adminCommission || !pointValue || !gameMode || !gameplayType)
            return await response.errorResponse(
                res,
                401,
                "Please enter mandatory fields"
            );
        try{
            let winAmount = hiddenWinningAmount ; 

            gameplayType === constants?.RUMMY_TYPE?.POINT ? rummyPoints = "" : rummyPoints = rummyPoints
            
            if(gameplayType !== constants?.RUMMY_TYPE?.POINT && gameplayType !== constants?.RUMMY_TYPE?.POOL)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "Invalid Game play type"
                    )
                )

            let tableExists = await queries.getTable({_id:tableId});

            if (!tableExists)
                return await response.errorResponse(res, 400, "Table Not Exists");
            
            let data = {
                rummy_type: gameplayType,
                rummy_points : rummyPoints,
                game_mode: gameMode,
                no_of_players : totalPlayer,
                entry_fee : entryFee,
                win_amount : winAmount,
                admin_commission : adminCommission,
                point_value : pointValue,

            }
            let savingTable = await queries.updateTable(tableExists._id,data);
            return res.status(200).send({
                code:200 , 
                status :'success' , 
                message:"Table has been updated successfully.",
                data : savingTable
        
            });
        } catch (err) {
            console.log("Error occured while Creating table", err);
        return await response.errorResponse(res, 400, err?.message);
        }
    },


    //***************User-side Table management functions *******************************/

    fetchEntryFee : async ( req , res ) =>{

        let { noOfPlayers , gamePlayType , rummyPoints , gameMode } = req.body ;   //Game play type would be point or pool, gameMode will be Online rummy, best of 2,3


        if(!noOfPlayers || !gamePlayType ||!gameMode) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            );

        try{

            if(gamePlayType === "pool") { 
                
                if( rummyPoints !== constants?.RUMMY_POINTS?.MAX_101 && rummyPoints !== constants?.RUMMY_POINTS?.MAX_201)
                    return (
                        await response.errorResponse(
                            res,
                            400,
                            "Invalid Rummy Points"
                        )
                    );
                    
                rummyPoints = rummyPoints
            }else{
                rummyPoints = "" ;

            }

            let tables = await queries.getAllTables({ 
                no_of_players : noOfPlayers , 
                rummy_type : gamePlayType,
                game_mode : gameMode,
                rummy_points : rummyPoints   //Rummy points will be 101 or 201 for pool gameplay mode.
            });

            if(tables.length ===  0)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Table found"
                    )
                );

            // let arr = [];

            // for ( let element of tables ){

            //     arr.push({
            //         _id : element?._id,
            //         entry_fee : element?.entry_fee,
            //         point_value : element?.point_value
            //     })
            // }
            let arr = [];

            for ( let element of tables ){

                arr.push({
                    _id : element?._id,
                    entry_fee : element?.entry_fee,
                    point_value : element?.point_value,
                    win_amount:element?.win_amount
                })
            }
            
            return (
                await response.successResponse(
                    res,
                    200,
                    "Fetching tables",
                    arr
                )
            );

        }catch(err){

            console.log("Error occured while fetching table " , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                ) 
            );
        }
    },
    fetchEntryFeeList : async ( req , res ) =>{

        let {gameMode } = req.body ;   //Game play type would be point or pool, gameMode will be Online rummy, best of 2,3

        if(!gameMode) 
            return (
                await response.errorResponse(
                    res,
                    401,
                    "Invalid Parameters"
                )
            );

        try{

            let tables = await queries.getAllTables({ 
                game_mode : gameMode,
            });
            if(tables.length ===  0)
                return (
                    await response.errorResponse(
                        res,
                        400,
                        "No Table found"
                    )
                );

            let arr = [];
            for ( let element of tables ){
                arr.push({
                    _id : element?._id,
                    entry_fee : element?.entry_fee,
                    point_value : element?.point_value
                })
            }
            return (
                await response.successResponse(
                    res,
                    200,
                    "Fetching tables",
                    arr
                )
            );

        }catch(err){

            console.log("Error occured while fetching table " , err);

            return (
                await response.errorResponse(
                    res,
                    400,
                    err?.message
                ) 
            );
        }
    }
    

};
