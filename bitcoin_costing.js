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

var local_device_lists = [];
var l_device = {
  name : '蚂蚁S7矿机',
  rmb : 2900,
  speed : 4730,
  watt : 1293,
};
local_device_lists.push(l_device);

var l_device = {
  name : '蚂蚁U3矿机',
  rmb : 99,
  speed : 63,
  watt : 72,
};
local_device_lists.push(l_device);

var l_device = {
  name : '蚂蚁S3++矿机',
  rmb : 750,
  speed : 450,
  watt : 310,
};
local_device_lists.push(l_device);

var l_device = {
  name : '阿瓦隆A6矿机',
  rmb : 2450,
  speed : 3500,
  watt : 1050,
};
local_device_lists.push(l_device);

var l_device = {
  name : '烤猫棱镜1.4T矿机',
  rmb : 1750,
  speed : 1400,
  watt : 1200,
};
local_device_lists.push(l_device);

var l_device = {
  name : '蚂蚁S5矿机',
  rmb : 2600,
  speed : 1150,
  watt : 590,
};
local_device_lists.push(l_device);


function getBtcCost(rmb,perPGhs,perDay,price)
{
  var work_days = 400;
  var earned_btc = 0;
  var perday_earned = perDay;
  var device_cost = rmb;
  var device_cost_by_btc = rmb/price;
  var dpcbb_per_day = perPGhs/price;
  var dpcbb = 0;
  var adjust_days = 12;

  var recovery_day = 999;
  var already_recovery = false;

  var real_p = 1.0 - global_param.p*0.01;
  for (var i = 0; i <  work_days ; ) {
      earned_btc += perday_earned*adjust_days;
      dpcbb += dpcbb_per_day*adjust_days;
      perday_earned *= real_p;
      if (earned_btc >= (device_cost_by_btc + dpcbb) && !already_recovery) { 
        recovery_day = i;
        already_recovery = true;
      };
      i += adjust_days;
  };
  var perbtc_device_cost = rmb / earned_btc;
  var perbtc_power_cost = perPGhs*work_days/earned_btc;
  var totol_cost =  perbtc_device_cost + perbtc_power_cost;
  return [totol_cost.toFixed(3),recovery_day];
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

var result = {};


function buy_some(amout,list) {
  acc_p = 0
  amout_left = amout
  for (i in list){
    cur_p = list[i][0]
    cur_n = list[i][1]
    if (cur_n > amout_left) {
      acc_p += cur_p*amout_left
      return acc_p/amout
    }
    acc_p += cur_n*cur_p
    amout_left -= cur_n
  }
  return 0
}

function sell_some(amout,list) {
acc_p = 0
amout_left = amout
for (i in list){
  cur_p = list[i][0]
  cur_n = list[i][1]
  if (cur_n > amout_left) {
    acc_p += cur_p*amout_left
    return acc_p/amout
  }
  acc_p += cur_n*cur_p
  amout_left -= cur_n
}
return 0
}



app.get('/', function (req, res, next) {

  //compute mining cost
  superagent.get('http://mining.btcfans.com/reverse.php')
    .end(function (err, sres) {
      if (err) {
        return next(err);
      }
      var $ = cheerio.load(sres.text);
      


      result.cur_price = $('span[id=0lastPrice]').text();
      result.cur_price = result.cur_price.replace(',','');
      result.cur_hashRate = $('span[id=hashRate]').text();
      result.cur_hashRate = result.cur_hashRate.replace(',','');
      result.cur_p = global_param.p;
      result.btcs24h = $('span[id=btcs24h]').text();
      result.btcs24h = result.btcs24h.replace(',','');
      result.devices = [];

      search_content = $('table').toArray()[1];


      /*
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
        device.perBtcCost = getBtcCost(device.rmb,device.perPGhs,device.perDay,result.cur_price)[0];

        result.devices.push(device);

      };
      */


      
      for (var i = local_device_lists.length - 1; i >= 0; i--) {
        device = {};

        device.name = local_device_lists[i].name;

        device.rmb = local_device_lists[i].rmb;
        device.speed = local_device_lists[i].speed + 'G';
        device.perGhs = (device.rmb/local_device_lists[i].speed).toFixed(3);
        device.watt = local_device_lists[i].watt + '瓦';
        device.perPGhs = (local_device_lists[i].watt * 0.001 * 24 * 0.6).toFixed(3);
        
        var bili = local_device_lists[i].speed/(result.cur_hashRate * 1000000);
        device.perDay = (bili*result.btcs24h).toFixed(5);
        device.perDayCNY = (device.perDay*result.cur_price).toFixed(3);
        var com_res = getBtcCost(device.rmb,device.perPGhs,device.perDay,result.cur_price);
        device.costRecovery = com_res[1];
        device.perBtcCost = com_res[0];

        result.devices.push(device);   
            
      };

      //compute transfer cost
      superagent.get('http://data.bank.hexun.com/other/cms/foreignexchangejson.ashx?callback=comex')
        .buffer(true)
        .end(function (err, sres) {
          if (err) {
            return next(err);
          }

          function ComputeTransRate() {
            //get cny asks depth
            
            superagent.get('https://www.okcoin.cn/api/v1/depth.do?symbol=btc_cny&merge=1')
              .buffer(true)
              .end(function (err, sres) {
                if (err) {
                  return next(err);
                }

                json_data = JSON.parse(sres.text)
                asks_list_cny = json_data['asks']
                asks_list_cny.reverse()
                bids_list_cny = json_data['bids']


                buy_10_cny = buy_some(10,asks_list_cny)
                buy_20_cny = buy_some(20,asks_list_cny)
                buy_50_cny = buy_some(50,asks_list_cny)
                buy_100_cny = buy_some(100,asks_list_cny)



                sell_10_cny = sell_some(10,bids_list_cny)
                sell_20_cny = sell_some(20,bids_list_cny)
                sell_50_cny = sell_some(50,bids_list_cny)
                sell_100_cny = sell_some(100,bids_list_cny)



                //get usd bids depth
                superagent.get('https://www.okcoin.com/api/v1/depth.do?symbol=btc_usd&merge=1')
                  .buffer(true)
                  .end(function (err, sres) {
                    if (err) {
                      return next(err);
                    }

                  json_data = JSON.parse(sres.text)
                  bids_list_usd = json_data['bids']
                  asks_list_usd = json_data['asks']
                  asks_list_usd.reverse()

                  sell_10_usd = sell_some(10,bids_list_usd)*0.998
                  sell_20_usd = sell_some(20,bids_list_usd)*0.998
                  sell_50_usd = sell_some(50,bids_list_usd)*0.998
                  sell_100_usd = sell_some(100,bids_list_usd)*0.998



                  buy_10_usd = buy_some(10,asks_list_usd)*0.998
                  buy_20_usd = buy_some(20,asks_list_usd)*0.998
                  buy_50_usd = buy_some(50,asks_list_usd)*0.998
                  buy_100_usd = buy_some(100,asks_list_usd)*0.998



                  erate_10_out = (buy_10_cny/sell_10_usd).toFixed(4)
                  erate_20_out = (buy_20_cny/sell_20_usd).toFixed(4)
                  erate_50_out = (buy_50_cny/sell_50_usd).toFixed(4)
                  erate_100_out = (buy_100_cny/sell_100_usd).toFixed(4)

                  erate_10_in = (sell_10_cny/buy_10_usd).toFixed(4)
                  erate_20_in = (sell_20_cny/buy_20_usd).toFixed(4)
                  erate_50_in = (sell_50_cny/buy_50_usd).toFixed(4)
                  erate_100_in = (sell_100_cny/buy_100_usd).toFixed(4)


                  result.erate_10_out = erate_10_out
                  result.erate_20_out = erate_20_out
                  result.erate_50_out = erate_50_out
                  result.erate_100_out = erate_100_out


                  result.erate_10_in = erate_10_in
                  result.erate_20_in = erate_20_in
                  result.erate_50_in = erate_50_in
                  result.erate_100_in = erate_100_in


                  res.render('index', { title: 'Bitcoin Costing', message: result });

                });

           

            });
          }
          function comex(data_list)
          {
            var acc_num_usd = 0
            var acc_value_usd = 0
            for (i in data_list)
            {
                data = data_list[i]
                if (data.code == 'USD' ) {
                  acc_num_usd += 1.0
                  acc_value_usd += parseFloat(data.sellPrice2)
                }
            }
            result.usd2cny = (acc_value_usd/acc_num_usd/100).toFixed(4)

            var acc_num_eur = 0
            var acc_value_eur = 0
            for (i in data_list)
            {
                data = data_list[i]
                if (data.code == 'EUR' ) {
                  acc_num_eur += 1.0
                  acc_value_eur += parseFloat(data.sellPrice2)
                }
            }
            result.eur2cny = (acc_value_eur/acc_num_eur/100).toFixed(4)            


            ComputeTransRate();


          }


          try {
            eval(sres.text)

          } catch(e) {
            console.error('Error caught by catch block:', e);
            ComputeTransRate();
          }
          
      });

    });
});


app.listen(8888, function () {
  console.log('app is listening at port 8888');
});
