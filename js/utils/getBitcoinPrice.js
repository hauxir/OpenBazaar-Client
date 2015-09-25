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

    var callBlockchain = function () {
        $.ajax({
            method: "GET",
            url: "https://blockchain.info/ticker"
        })
            .done(function (response) {
                var blockChainCurrencies = {};
                for (var currency in response) {
                    blockChainCurrencies[currency] = response[currency]['15m'];
                }
                btcPrices.push(blockChainCurrencies);
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
                var coinKiteCurrencies = {};
                for (var currency in response.rates.BTC) {
                    coinKiteCurrencies[currency] = response.rates.BTC[currency].rate;
                }
                btcPrices.push(coinKiteCurrencies);
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
                var bitCoinAvgCurrencies = {};
                for (var currency in response) {
                    if(response[currency].averages)
                        bitCoinAvgCurrencies[currency] = response[currency].averages['24h_avg'];
                }
                btcPrices.push(bitCoinAvgCurrencies);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("Bit coin average request failed: ");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            })
            .always(function () {
                callBitCoinCharts();
            });
    };

    var callBitCoinCharts = function () {
        $.ajax({
            method: "GET",
            url: "http://api.bitcoincharts.com/v1/weighted_prices.json"
        })
            .done(function (response) {
                var bitCoinChartsCurrencies = {};
                for (var currency in response) {
                    bitCoinChartsCurrencies[currency] = response[currency]['24h'];
                }
                btcPrices.push(bitCoinChartsCurrencies);
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

    if(window.btcAverages.timeStamp && Math.floor((new Date() - window.btcAverages.timeStamp)/60000) < 15){
        typeof callback === 'function' && callback(window.btcAverages[currency]);
    } else {
        callBlockchain();
    }

    var makeAveragePrice = function () {
        btcAverages.timeStamp = new Date();
        var keys = {};
        for (var i in btcPrices) {
            keys = $.extend(keys, btcPrices[i]);
        }
        var currencyKeys = Object.keys(keys);
        for (var index in currencyKeys) {
            var currencyCode = currencyKeys[index];
            var currencyPrices = [];
            for (var j in btcPrices) {
                if (btcPrices[j][currencyCode]) {
                    currencyPrices.push(btcPrices[j][currencyCode]);
                }

            }
            var sum = 0;
            for (var jIndex in currencyPrices) {
                sum += Number(currencyPrices[jIndex]);
            }
            var averagePrice = sum / currencyPrices.length;
            btcAverages[currencyPrices] = averagePrice;
        }
        window.btcAverages = btcAverages;

        var btAve;
        btAve = btcAverages[currency];

        typeof callback === 'function' && callback(btAve);
    };
};
