var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}


var app = express();

var global_param = {};
global_param.p = 3;


function getBtcCost(rmb,perPGhs,perDay)
{
  var work_days = 400;
  var earned_btc = 0;
  var perday_earned = perDay;
  var device_cost = rmb;
  var adjust_days = 12;
  var real_p = 1.0 - global_param.p*0.01;
  for (var i = 0; i <  work_days ; ) {
      earned_btc += perday_earned*adjust_days;
      perday_earned *= real_p;
      i += adjust_days;
  };
  var perbtc_device_cost = rmb / earned_btc;
  var perbtc_power_cost = perPGhs*work_days/earned_btc;
  var totol_cost =  perbtc_device_cost + perbtc_power_cost;
  return totol_cost.toFixed(3);
}


app.set('view engine', 'jade');

app.get('/set', function (req, res, next) {
  param = req.query.p;
  if (!isNaN(param)) {
    res.send(req.query.p);
    global_param.p = Number(req.query.p);
  }
  else{
    res.send('error parameter!');
  };
  
});

app.get('/', function (req, res, next) {
  superagent.get('http://mining.btcfans.com/reverse.php')
    .end(function (err, sres) {
      if (err) {
        return next(err);
      }
      var $ = cheerio.load(sres.text);
      var result = {};


      result.cur_price = $('span[id=0lastPrice]').text();
      result.cur_hashRate = $('span[id=hashRate]').text();
      result.cur_p = global_param.p;
      result.devices = [];

      search_content = $('table').toArray()[1];
      var devcie_name = $('td a[rel=nofollow]',search_content).toArray();
      
      for (var i = 0; i < 4; i++) {

        device = {};

        device.name = $(devcie_name[i]).text();

        device.rmb = $('td span[id={0}rmb]'.format(i),search_content).text();
        device.speed = $('td span[id={0}speed]'.format(i),search_content).text();
        device.speed = device.speed.replace(' ','');
        device.perGhs = $('td span[id={0}perGhs]'.format(i),search_content).text();
        device.watt = $('td span[id={0}watt]'.format(i),search_content).text();
        device.watt = device.watt.replace(' ','');
        device.perPGhs = $('td span[id={0}perPGhs]'.format(i),search_content).text();
        device.perDay = $('td span[id={0}perDay]'.format(i),search_content).text();
        device.perDayCNY = $('td span[id={0}perDayCNY]'.format(i),search_content).text();
        device.costRecovery = $('td span[id={0}costRecovery]'.format(i),search_content).text();
        device.perBtcCost = getBtcCost(device.rmb,device.perPGhs,device.perDay);

        result.devices.push(device);

      };

      //res.send(result);
      res.render('index', { title: 'Bitcoin Costing', message: result });
    });
});


app.listen(8888, function () {
  console.log('app is listening at port 8888');
});
