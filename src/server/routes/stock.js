const express = require('express');
const router = express.Router();
const googleTrends = require('google-trends-api');
const moment = require('moment');
const Stock = require('../../../models/stock');
const axios = require('axios');
const yFinance = require('yahoo-finance');

//REGISTER ROUTER
//Get google trend data
router.get('/googleTrends', async (req, res) => {
    const getTrend = (dateNum, dateType) => {
        googleTrends.interestOverTime({
            keyword: req.query.symbol,
            startTime: moment().subtract(dateNum, dateType).toDate()    
        }).then(function(results){
            var resultData = JSON.parse(results);
            if(!resultData.default.timelineData){
               res.send('Error with data: ', resultData);
            }

            res.send({resultData});
        }).catch(function(error){
            console.log(error.message);
            res.send({error: 'Unable to get data from Google Trends.'});
        });
    }

    getTrend(1, 'y');
});


const getData = async (req) => {
    const data = req.query;

    let today = new Date();
    let day = today.getDate();
    let month = today.getMonth()+1; 
    const year = today.getFullYear();
    const lastYear = year-1;
    if(day<10){
        day=`0${day}`;
    } 

    if(month<10){
        month=`0${month}`;
    } 

    to = `${year}-${month}-${day}`;
    from = `${lastYear}-${month}-${day}`;
    const stockData = await yFinance.historical({
        symbol: data.symbol,
        from: from,
        to: to,
        period: 'd'
    }).then(function (quotes) {
        return quotes;
    });
    
    return await stockData;
}

getGoogleData = async (req) => {
    const trendData = await googleTrends.interestOverTime({
        keyword: req.query.symbol,
        startTime: moment().subtract(1, 'y').toDate(),
    }).then(function(results){
        var resultData = JSON.parse(results);
        if(!resultData.default.timelineData){
            return ('Error with data: ', resultData);
        }
        return resultData;
    }).catch(function(error){
        return ({error: 'Unable to get data from Google Trends.'});
    });

    return await trendData;
}

router.get('/getBothData', async (req, res) => {
    //check cache for symbol, if not cached: cache! also check cache date - once per month lets say?
    let update = false;

    const stock = await Stock.findOne({  symbol: req.query.symbol });

    if (stock){
        let sevenDaysAgo = Date.now()-7;
        sevenDaysAgo = new Date(sevenDaysAgo).toISOString();
        if(stock.date.toDateString() < sevenDaysAgo){
            update = true;
        }else{
            return res.send(stock);
        }
    };
    
    const stockResult = await getData(req);
     //Fix invalid calls
     if(stockResult.length <= 0){
         return res.status(404).send('Stock Item Not Found.');
     }
    var googleResult = await getGoogleData(req);
    googleResult = googleResult.default.timelineData;
    
    //Create new User
    const mongoStock = await new Stock({
        symbol: req.query.symbol,
        historicalStock: stockResult,
        historicalGoogle: googleResult,
    });

    if(update){
        try{
            await Stock.updateOne({symbol: req.query.symbol}, {$set: {date: Date.now(), historicalStock: stockResult, historicalGoogle: googleResult}});
        }catch(e){
            console.log(e);
        }
    }else{
        const savedStocks = await mongoStock.save();
    }
    await res.send(mongoStock);
});

router.get('/stock_quote', async (req, res) => {
    const data = req.query;
    if(data.symbol){
        const stockData = await yFinance.quote(data.symbol
        ).then(function (quotes) {
            return res.send(quotes);
        });
    }

    res.status(401).send('No Symbol Defined.');
});



module.exports = router;


// router.get('/stocks', (req, res) => {

//     const data = req.query;

//     // Get Stock API key from Heroku or include it from or local json file.
//     const STOCK_API_KEY = process.env.STOCK_API_KEY;
    
//     // Note: I need to get this moved over to the new API :)
//     const getStock = (formatedTimeFrame) => {
//         axios.get(`https://cloud.iexapis.com/v1/stock/${data.tickerSymbol}/chart/${formatedTimeFrame}?token=${STOCK_API_KEY}`)
//         .then((response) => {
//             res.send(response.data);
//         }).catch((error) => {
//             if (error.response.status === 404) {
//                 res.send([]);
//             } else if(error.response.status === 402) {
//                 res.send({error: "We've ran out of API requests for the month 😭"});
//             }
//             else {
//                 res.send({error: 'Unable to get data from Stocks API.'});
//             }
//         });
//     }

//     getStock('1y');
// });