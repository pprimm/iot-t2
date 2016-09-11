var five = require('johnny-five');
var Tessel = require('tessel-io');
var mqtt        = require('mqtt');
var settings = require('./settings');

// get topics
var getPotTopic  = 'get/bots/' + settings.botName + '/pot';

var board = new five.Board( { io: new Tessel() });

board.on('ready', function() {
   var mqttClient  = mqtt.connect(settings.mqttURL);

   mqttClient.on('connect', function () {
      console.log('connected to MQTT Broker at ' + settings.mqttURL);
   });

   mqttClient.on('error', function (error) {
      console.log(error);
   });

   var led = new five.Led('a5');
   var rotary = new five.Sensor('a4');

   rotary.on('change', function() {
      led.brightness(this.value >> 2);
      var scaledValue = Math.round(this.value / 1023 * 100); // scale from 0 - 100
      if (mqttClient.connected) {
         console.log('Raw value: ' + scaledValue.toString());
         mqttClient.publish(getPotTopic, scaledValue.toString());
      }
   });
});
