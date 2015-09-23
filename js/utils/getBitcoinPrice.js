var _ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery');
Backbone.$ = $;

/*eslint no-use-before-define:0*/
module.exports = function (currency, callback) {

    //some APIs require currency to be upper case
    //if currency is Bitcoin, don't bother with finding the Bitcoin value

    var btcPrices = [];
    var btcAverages = {};
    var currency = 'USD';


    var callBlockchain = function () {
        $.ajax({
            method: "GET",
            url: "https://blockchain.info/ticker"
        })
            .done(function (response) {
                //console.log("blockChain: " + response[currency]['15m']);
                var obj = {};
                for (var currency in response) {
                    obj[currency] = {price: response[currency]['15m']};
                }
                btcPrices.push(obj);
                /*if ($.isNumeric(response[currency]['15m'])) {
                    btPrices.push(response[currency]['15m']);
                }*/
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("blockChain request failed: ");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            })
            .always(function () {
                callCoinKite();
            });
    };

    var callCoinKite = function () {
        $.ajax({
            method: "GET",
            url: "https://api.coinkite.com/public/rates"
        })
            .done(function (response) {
                var obj = {};
                for (var currency in response.rates.BTC) {
                    obj[currency] = {price: response.rates.BTC[currency]['rate']};
                }
                btcPrices.push(obj);
                //console.log("coinKite: " + response.rates.BTC[currency]['rate']);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("coinKite request failed: ");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            })
            .always(function () {
                callBitCoinAvg();
            });
    };

    var callBitCoinAvg = function () {
        $.ajax({
            method: "GET",
            url: "https://api.bitcoinaverage.com/all"
        })
            .done(function (response) {
                var obj = {};
                for (var currency in response) {
                    if(response[currency]['averages'])
                        obj[currency] = {price: response[currency]['averages']['24h_avg']};
                }
                btcPrices.push(obj);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("Bit coin average request failed: ");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            })
            .always(function () {
                makeAveragePrice();
            });
    };

    if(window.btcTimeStamp && Math.floor((new Date() - window.btcTimeStamp)/60000) < 15){
        typeof callback === 'function' && callback(window.btcAverages[currency]['price']);
    } else {
        callBlockchain();
    }

    var makeAveragePrice = function () {
        var time = new Date();
        var keys = {};
        for (var d in btcPrices) {
            keys = $.extend(keys, btcPrices[d]);
        }
        var currencies = Object.keys(keys);
        for (var i in currencies) {
            var c = currencies[i];
            var avg = [];
            for (var d in btcPrices) {
                if (btcPrices[d][c]) {
                    avg.push(btcPrices[d][c].price);
                }

            }
            var sum = 0;
            for (var s in avg) {
                var price = avg[s];
                sum += parseInt(price, 10);
            }
            var avg = sum / avg.length;
            btcAverages[c] = {price: avg};
        }
        window.btcTimeStamp = time;
        window.btcAverages = btcAverages;

        var sum = 0,
            btAve = 0;
        /*for (var i = 0; i < btPrices.length; i++) {
            sum = sum + Number(btPrices[i]);
        }
        btAve = sum / btPrices.length;*/
        btAve = btcAverages[currency][price];
        //console.log("Average is " + btAve);

        typeof callback === 'function' && callback(btAve);
    };
};
