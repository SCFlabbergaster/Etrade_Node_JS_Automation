/**
 * Module dependencies.
 */
var marketModel = require('./lib/model/market');
var marketError = require('./lib/error/marketError');
require('mysql');

var stocks = ['SCMP', 'BOOT', 'NRP', 'ADPT', 'ORN', 'CELP', 'UCP', 'CZZ', 'CMRE', 'SJT', 'KVHI', 'BGFV', 'NWHM', 'KRG', 'MPW', 'CXP', 'PBPB', 'SCVL', 'ALRM', 'SFS', 'ANW', 'SBS', 'TIS', 'MTSI', 'EXPR', 'CXW', 'CTRN', 'CIVI', 'CCP', 'PGTI', 'BKS', 'PDM', 'TCP', 'HEP', 'MMS', 'GLOP', 'ELP', 'WLFC', 'INOV', 'CODI', 'PFNX', 'MOV', 'GNC', 'AWRE', 'QLYS', 'FOSL', 'CCU', 'NEWS', 'PAYC', 'MTRX'];
var stocksSell = ['BREW', 'GV', 'EHIC', 'NL', 'LMAT', 'SUPN', 'TLYS', 'JKS', 'CYBE', 'VDSI', 'FPRX', 'ANFI', 'XNCR', 'VSI', 'ATHM', 'UCP', 'PRLB', 'FNV', 'DM', 'ASC', 'AMKR', 'FSLR', 'HXL', 'ORN', 'FIZZ', 'FLWS', 'BMA', 'TGS', 'OEC', 'SRDX', 'TBK', 'ENBL', 'CCMP', 'TPC', 'INOV', 'USAK', 'ITUB', 'PFNX', 'CVTI', 'GHM', 'ALG', 'LWAY', 'FFNW', 'PGNX', 'SPOK', 'NWHM', 'LITE', 'SYNA', 'BSBR', 'NOVT'];
var stockimminentBuys = [];
var stockPreviousDayBuys = [];

var objArray = [];

var credential = require('./config/credential')
	, siteUrl = require('./config/url')
	, express = require('express')
	, app = express()
	, path = require('path')
	, http = require('http')
	, accountWeb = require('./routes/accountWeb')
	, marketWeb =  require('./routes/marketWeb')
    , login = require('./routes/login')
    , chooseStock = require('./routes/chooseStock');

global.debug = true;
global.credential = credential;
global.url = siteUrl;
global.server = "prod"; // VALID values are "sandbox" or "prod"

var randomLetters = (Math.random() + 1).toString(36).substring(2,30); // generates random letters necessary for session and cookies

app.enable("jsonp callback"); // doesn't seem to work

app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon("views/favicon.ico"));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser('RandomStuffGoesHere'+randomLetters)); // parameter contains a random value  
  app.use(express.session({secret: 'MoreRandomStuff'+randomLetters}));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

var todoItems = [
    { id: 1, desc: 'foo' },
    { id: 2, desc: 'bar' },
    { id: 3, desc: 'baz' }
];

app.get('/', function (req, res) {
    //load data from DB here
    //var dbData = app.getLastDaySummary();
    var tmp = app.testObjCreation(req, res);
    res.render('index', {
        title: 'Etrade App',
        form: '<input type="submit" value="Enter Auth Cd">',
        items: todoItems
    });
});

app.post('/', function (req, res) {
    var authVerifCd = req.body.Login;
    req.session.authVerifCd = authVerifCd;
    //req.param['oauth_verifier'] = authVerifCd;
    login.etradeCallback(req, res);
});

app.post('/chooseStock', function (req, res) {
    console.log(req);
    req.query.symbol = req.body.Symbol;
    req.query.detailFlag = 'ALL';
    // get stock list from input file
    // set up timer to run insert every minute
    // alter stock list at pre-determined times
    // determine if stock is at or below targeted low
    //TODO: determine if "ready" stock is actually at low point
    //TODO: buy if stock at low point and funds are available (up to 10K shares)
    //TODO: use same scenario to determine if held stock is at high point & sell if it is
    //TODO: move all this over into another route js file

    var checkPreds = objArray;
    stocks = [];
    for (i = 0; i < checkPreds.length; i++) {
        stocks.push(checkPreds[i].Symbol);
    }

    var CronJob = require('cron').CronJob;

    var getStocksjob = new CronJob('45 * 9-16 * * 1-5', function () {
        var dt = new Date();
        var hr = dt.getHours();
        var min = dt.getMinutes();
        var tm = (hr * 100) + min;

        if (tm <= 1030) {
           // var sl = app.getStockList("SELECT * FROM etrade.predictionsnextday_all  order by ProfitPct desc LIMIT 10", ret);
        }
        else if (tm <= 1200) {
            var ret = "";
            //var sl = app.getStockList("SELECT * FROM etrade.predictionsnextday_all  order by ProfitPct desc LIMIT 10", res);
            var rs = res;
        } else  {
            var ret = "";
           // var sl = app.getStockList("SELECT * FROM etrade.predictionsnextday_all  order by ProfitPct desc LIMIT 10", res);
            var rs = res;
        }

    }, function () {

    },
        true, /* Start the job right now */
        timeZone /* Time zone of this job. */ = 'America/New_York'
    );    
    var symList = "";
    var ctr = 0;
    var savejob = new CronJob('00 * 9-16 * * 1-5', function () {
        symList = "";
        stocks.forEach(function (value) {
            if (symList.length == 0) {
                symList = value;
                ctr++;
            } else {
                symList += "," + value;
                ctr++;
            }
            if (ctr == 25) {
                req.query.symbol = symList;
                app.getQuote(req, res);
                ctr = 0;
                symList = "";
            }
        });
        req.query.symbol = symList;
        app.getQuote(req, res);
    }, function () {
        /* Start the job right now */
    },
        true, /* Start the job right now */
        timeZone /* Time zone of this job. */= 'America/New_York'
    );   

    var immientBuyJob = new CronJob('00,10,20,30,40,50 * 9-16 * * 1-5', function () {
        symList = "";
        stockimminentBuys.forEach(function (value) {
            if (symList.length == 0) {
                symList = value;
                ctr++;
            } else {
                symList += "," + value;
                ctr++;
            }
            if (ctr == 25) {
                req.query.symbol = symList;
                app.getImminentQuote(req, res);
                ctr = 0;
                symList = "";
            }
        });
        req.query.symbol = symList;
        app.getImminentQuote(req, res);
    }, function () {
        /* Start the job right now */
    },
        true, /* Start the job right now */
        timeZone /* Time zone of this job. */ = 'America/New_York'
    );    

    var saveSelljob = new CronJob('10 * 9-16 * * 1-5', function () {
        symList = "";
        stocksSell.forEach(function (value) {
            if (symList.length == 0) {
                symList = value;
                ctr++;
            } else {
                symList += "," + value;
                ctr++;
            }
            if (ctr == 25) {
                req.query.symbol = symList;
                app.getSellQuote(req, res);
                ctr = 0;
                symList = "";
            }
        });
        req.query.symbol = symList;
        app.getSellQuote(req, res);
    }, function () {
        /* Start the job right now */
    },
        true, /* Start the job right now */
        timeZone /* Time zone of this job. */ = 'America/New_York'
    );   

    var tbl1 = app.getLastDaySummary(req, res);

});

app.testObjCreation = function (req, res) {

    var sql = "SELECT `Symbol`, `Predicted_Low` PredLow, `Predicted_High` PredHigh, `Predicted_Profit` PredProfit, `Predicted_Pct_Profit` PredPctProfit, `LastVolume` LastVol FROM etrade.daily_buy_list  order by 'Predicted_Pct_Profit' desc LIMIT 50;";
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();
    objArray = [];
    connection.query(sql, function (err, result) {
        if (err) throw err;
        var arr = result;

        for (i = 0; i < arr.length; i++) {
            var o = Object.create({}, {
                Symbol: {
                    value: 'SCMP',
                    writable: true,
                    enumerable: true,
                    configurable: true
                },
                PredictedLow: {
                    value: 10.52,
                    writable: true,
                    enumerable: true,
                    configurable: true
                },
                PredicteHigh: {
                    value: 11.32,
                    writable: true,
                    enumerable: true,
                    configurable: true
                },
                PredictedProfit: {
                    value: 0.80,
                    writable: true,
                    enumerable: true,
                    configurable: true
                },
                PredictedPctProfit: {
                    value: .0854,
                    writable: true,
                    enumerable: true,
                    configurable: true
                },
                LastVol: {
                    value: 10000000,
                    writable: true,
                    enumerable: true,
                    configurable: true
                }
            });
            o.Symbol = arr[i].Symbol;
            o.PredictedLow = arr[i].PredLow;
            o.PredictedHigh = arr[i].PredHigh;
            o.PredictedProfit = arr[i].PredProfit;
            o.PredictedPctProfit = arr[i].PredPctProfit;
            o.LastVol = arr[i].LastVol;

            objArray.push(o)
        }
    } );

    connection.end();

    
};

app.getQuote = function (req, res) {
    if (req.query && req.query.symbol) {
        marketModel.getQuote(function (result) {
            if (global.debug) { result.query = req.query; }
            if (result.success == true) {
                res.json(result);
                var arr = result.quotes;

                for (i = 0; i < arr.length; i++) {
                    //if low is at or below predicted low,
                    var sym = arr[i].product.symbol
                    var low = arr[i].all.lastTrade
                    var predArray = objArray.find(o => o.Symbol === sym)
                    if (predArray.PredictedLow >= low & low > 0) {
                       //remove from normal stock list & put in imminent buy list
                        stockimminentBuys.push(sym);
                        stocks.splice(stocks.indexOf(sym), 1);
                    }
                    app.InsertQuote(arr[i]);
                }
            }

        }, req.query.symbol, req.query.detailFlag);
    }
    else {
        res.json({ success: false, error: marketError.paramsmissing });
    }
}

app.getImminentQuote = function (req, res) {
    if (req.query && req.query.symbol) {
        marketModel.getQuote(function (result) {
            if (global.debug) { result.query = req.query; }
            if (result.success == true) {
                res.json(result);
                var arr = result.quotes;

                for (i = 0; i < arr.length; i++) {
                    app.InsertImminentBuyQuote(arr[i]);
                }
            }

        }, req.query.symbol, req.query.detailFlag);
    }
    else {
        res.json({ success: false, error: marketError.paramsmissing });
    }
}

app.getSellQuote = function (req, res) {
    if (req.query && req.query.symbol) {
        marketModel.getQuote(function (result) {
            if (global.debug) { result.query = req.query; }
            if (result.success == true) {
                res.json(result);
                var arr = result.quotes;

                for (i = 0; i < arr.length; i++) {
                    app.InsertSellQuote(arr[i]);
                }
            }

        }, req.query.symbol, req.query.detailFlag);
    }
    else {
        res.json({ success: false, error: marketError.paramsmissing });
    }
}

var formattedTime = function (etradeDt) {
    var tmHr = etradeDt.substring(0, 2);
    var tmMin = etradeDt.substring(3, 5);
    var tmSec = etradeDt.substring(6, 8);
    var tmMo = etradeDt.substring(etradeDt.length - 10, etradeDt.length - 8);
    var tmDay = etradeDt.substring(etradeDt.length - 7, etradeDt.length - 5);
    var tmYr = etradeDt.substring(etradeDt.length - 4);
    return tmYr + '-' + tmMo + '-' + tmDay + ' ' + tmHr + ':' + tmMin + ':' + tmSec;
};

app.getStockList = function (sql, res) {
    var mysql = require('mysql');

    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();

    connection.query(sql, function (err, result) {
        if (err) throw err;
        var rslt = res.json(result);
        stocks = [''];
        for (i = 0; i < result.length; i++) {
            var curStock = result[i].Symbol;
            stocks.push(result[i].Symbol);
        }
        res.QuoteList = result;
    });

    connection.end();
}

app.getLastDaySummary = function (ret, res) {
    var sql = "Call usp_Get_last_day_summary()";
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();

    connection.query(sql, function (err, result) {
        if (err) throw err;
        res.dataTable = result;
        
        res.render('DailySummary', {
            title: 'Daily Summary'

            ,
            testret1: result[0]
        });
    });

    connection.end();
};

app.InsertQuote = function (quote, ret) {
    var sym = quote.product.symbol;
    var dateTimeWhole = formattedTime(quote.dateTime.replace('EST ', '').replace('EDT ', ''))
    var askTimeWhole = formattedTime(quote.all.askTime.replace('EST ', '').replace('EDT ', ''));
    var bidTimeWhole = formattedTime(quote.all.bidTime.replace('EST ', '').replace('EDT ', ''));
    var exDivDate = formattedTime(quote.all.exDivDate.replace('EST ', '').replace('EDT ', ''));

    var sql = "INSERT INTO `etrade`.`intradayquote`(`dateTime`, `symbol`, `ask`, `askSize`, `askTime`, `bid`, `bidSize`, `bidTime`, `chgClose`, `chgClosePrcn`, `daysToExpiration`, " +
        "`dirLast`, `dividend`, `eps`, `estEarnings`, `exDivDate`, `high`, `high52`, `highAsk`, `highBid`, `lastTrade`, `low`, `low52`, `lowAsk`, `lowBid`, `numTrades`, `open`, " +
        "`openInterest`, `optionStyle`, `optionUnderlier`, `prevClose`, `prevDayVolume`, `totalVolume`, `volume10Day`)" +
        " VALUES ('" + dateTimeWhole + "', '" + quote.product.symbol + "', " + quote.all.ask + ", " +
        quote.all.askSize + ", '" + askTimeWhole + "', " + quote.all.bid + ", " + quote.all.bidSize + ", '" +
        bidTimeWhole + "', " + quote.all.chgClose + ", " + quote.all.chgClosePrcn + ", " +
        quote.all.daysToExpiration + ", '" + quote.all.dirLast + "', " + quote.all.dividend + ", " + quote.all.eps + ", " + quote.all.estEarnings + ", '" +
        exDivDate + "', " + quote.all.high + ", " + quote.all.high52 + ", " + quote.all.highAsk + ", " + quote.all.highBid + ", " + quote.all.lastTrade + ", " +
        quote.all.low + ", " + quote.all.low52 + ", " + quote.all.lowAsk + ", " + quote.all.lowBid + ", " + quote.all.numTrades + ", " + quote.all.open + ", " +
        quote.all.openInterest + ", '" + quote.all.optionStyle + "', '" + quote.all.optionUnderlier + "', " + quote.all.prevClose + ", " + quote.all.prevDayVolume +
        ", " + quote.all.totalVolume + ", " + quote.all.volume10Day + ")";
    var sql2 = sql;

    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();

    connection.query(sql, function (err, result) {
        if (err) throw err;
        ret = result.insertId;
        console.log(result.insertId);
    });

    connection.end();
}

app.InsertImminentBuyQuote =  function (quote, ret) {
    var sym = quote.product.symbol;
    var dateTimeWhole = formattedTime(quote.dateTime.replace('EST ', '').replace('EDT ', ''))
    var askTimeWhole = formattedTime(quote.all.askTime.replace('EST ', '').replace('EDT ', ''));
    var bidTimeWhole = formattedTime(quote.all.bidTime.replace('EST ', '').replace('EDT ', ''));
    var exDivDate = formattedTime(quote.all.exDivDate.replace('EST ', '').replace('EDT ', ''));

    var sql = "INSERT INTO `etrade`.`imminentBuyQuote`(`dateTime`, `symbol`, `ask`, `askSize`, `askTime`, `bid`, `bidSize`, `bidTime`, `chgClose`, `chgClosePrcn`, `daysToExpiration`, " +
        "`dirLast`, `dividend`, `eps`, `estEarnings`, `exDivDate`, `high`, `high52`, `highAsk`, `highBid`, `lastTrade`, `low`, `low52`, `lowAsk`, `lowBid`, `numTrades`, `open`, " +
        "`openInterest`, `optionStyle`, `optionUnderlier`, `prevClose`, `prevDayVolume`, `totalVolume`, `volume10Day`)" +
        " VALUES ('" + dateTimeWhole + "', '" + quote.product.symbol + "', " + quote.all.ask + ", " +
        quote.all.askSize + ", '" + askTimeWhole + "', " + quote.all.bid + ", " + quote.all.bidSize + ", '" +
        bidTimeWhole + "', " + quote.all.chgClose + ", " + quote.all.chgClosePrcn + ", " +
        quote.all.daysToExpiration + ", '" + quote.all.dirLast + "', " + quote.all.dividend + ", " + quote.all.eps + ", " + quote.all.estEarnings + ", '" +
        exDivDate + "', " + quote.all.high + ", " + quote.all.high52 + ", " + quote.all.highAsk + ", " + quote.all.highBid + ", " + quote.all.lastTrade + ", " +
        quote.all.low + ", " + quote.all.low52 + ", " + quote.all.lowAsk + ", " + quote.all.lowBid + ", " + quote.all.numTrades + ", " + quote.all.open + ", " +
        quote.all.openInterest + ", '" + quote.all.optionStyle + "', '" + quote.all.optionUnderlier + "', " + quote.all.prevClose + ", " + quote.all.prevDayVolume +
        ", " + quote.all.totalVolume + ", " + quote.all.volume10Day + ")";
    var sql2 = sql;

    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();

    connection.query(sql, function (err, result) {
        if (err) throw err;
        ret = result.insertId;
        console.log(result.insertId);
    });

    connection.end();
}

app.InsertSellQuote = function (quote, ret) {
    var sym = quote.product.symbol;
    var dateTimeWhole = formattedTime(quote.dateTime.replace('EST ', '').replace('EDT ', ''))
    var askTimeWhole = formattedTime(quote.all.askTime.replace('EST ', '').replace('EDT ', ''));
    var bidTimeWhole = formattedTime(quote.all.bidTime.replace('EST ', '').replace('EDT ', ''));
    var exDivDate = formattedTime(quote.all.exDivDate.replace('EST ', '').replace('EDT ', ''));

    var sql = "INSERT INTO `etrade`.`intradaySellquote`(`dateTime`, `symbol`, `ask`, `askSize`, `askTime`, `bid`, `bidSize`, `bidTime`, `chgClose`, `chgClosePrcn`, `daysToExpiration`, " +
        "`dirLast`, `dividend`, `eps`, `estEarnings`, `exDivDate`, `high`, `high52`, `highAsk`, `highBid`, `lastTrade`, `low`, `low52`, `lowAsk`, `lowBid`, `numTrades`, `open`, " +
        "`openInterest`, `optionStyle`, `optionUnderlier`, `prevClose`, `prevDayVolume`, `totalVolume`, `volume10Day`)" +
        " VALUES ('" + dateTimeWhole + "', '" + quote.product.symbol + "', " + quote.all.ask + ", " +
        quote.all.askSize + ", '" + askTimeWhole + "', " + quote.all.bid + ", " + quote.all.bidSize + ", '" +
        bidTimeWhole + "', " + quote.all.chgClose + ", " + quote.all.chgClosePrcn + ", " +
        quote.all.daysToExpiration + ", '" + quote.all.dirLast + "', " + quote.all.dividend + ", " + quote.all.eps + ", " + quote.all.estEarnings + ", '" +
        exDivDate + "', " + quote.all.high + ", " + quote.all.high52 + ", " + quote.all.highAsk + ", " + quote.all.highBid + ", " + quote.all.lastTrade + ", " +
        quote.all.low + ", " + quote.all.low52 + ", " + quote.all.lowAsk + ", " + quote.all.lowBid + ", " + quote.all.numTrades + ", " + quote.all.open + ", " +
        quote.all.openInterest + ", '" + quote.all.optionStyle + "', '" + quote.all.optionUnderlier + "', " + quote.all.prevClose + ", " + quote.all.prevDayVolume +
        ", " + quote.all.totalVolume + ", " + quote.all.volume10Day + ")";
    var sql2 = sql;

    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        user: 'Etrade',
        password: 'klsawyer',
        database: 'etrade'
    });

    connection.connect();

    connection.query(sql, function (err, result) {
        if (err) throw err;
        ret = result.insertId;
        console.log(result.insertId);
    });

    connection.end();
}

app.all('/login', login.login);

app.all('/oauth/etrade/callback', login.etradeCallback);
app.all('/accounts/listAccounts', accountWeb.listAccounts);
app.all('/account/balance', accountWeb.accountBalance);
app.all('/account/positions', accountWeb.accountPositions);
app.all('/account/transactions/history', accountWeb.transactionsHistory);
app.all('/account/transactions/details', accountWeb.transactionsDetails);

app.all('/market/productlookup', marketWeb.productlookup);
app.all('/market/quote', marketWeb.getQuote);
app.all('/chooseStock', chooseStock.chooseStock);

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
