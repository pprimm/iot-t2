var five        = require('johnny-five');
var Tessel      = require('tessel-io');
var mqtt        = require('mqtt');
var settings = require('./settings');

// get topics
var getPotTopic  = 'get/bots/' + settings.botName + '/pot';
var getFilterTopic  = 'get/bots/' + settings.botName + '/filterConstant';
var getLedTopic = 'get/bots/' + settings.botName + '/led';
// set topics
var setTopicWC = 'set/bots/' + settings.botName + '/#';
var setFilterTopic = 'set/bots/' + settings.botName + '/filterConstant';
var setLedTopic = 'set/bots/' + settings.botName + '/led';

function isNumber (o) {
   return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}

var board = new five.Board( { io: new Tessel() });

board.on('ready', function() {
   var led = new five.Led('a5');
   var rotary = new five.Sensor('a4');

   var mqttClient  = mqtt.connect(settings.mqttURL);
   // filter variables
   var filteredValue = 0;
   var filterConstant = 0.1;
   // display variables
   var prevDisplayValue = 0;
   var ledValue = 0;

   mqttClient.on('connect', function () {
      console.log('connected to MQTT Broker at ' + settings.mqttURL);
      mqttClient.subscribe(setTopicWC);
      mqttClient.publish(getFilterTopic, filterConstant.toString(), settings.mqttPubOptions);
      mqttClient.publish(getLedTopic, ledValue.toString(), settings.mqttPubOptions);
   });

   mqttClient.on('message', function (topic, message) {
      switch (topic) {
         case setFilterTopic:
            if ( isNumber(message) ) {
               var fcSet = Number(message);
               if (fcSet < 0.01) { fcSet = 0.01; } // clip @ 0.01
               else if (fcSet > 1.0) { fcSet = 1.0; } // clip @ 1.0
               filterConstant = fcSet;
               console.log('Setting filter constant to: ' + filterConstant);
               mqttClient.publish(getFilterTopic, filterConstant.toString(), settings.mqttPubOptions);
            }
            break;
         case setLedTopic:
            if ( isNumber(message) ) {
               ledValue = Number(message);
               // LED brightess must be between 0 - 100
               if (ledValue < 0) { ledValue = 0; } // clip @ 0
               else if (ledValue > 100) { ledValue = 100; } // clip @ 100
               var ledCounts = Math.round(255 * ledValue * 0.01);
               console.log('Setting LED value to: ' + ledCounts);
               led.brightness(ledCounts);
               mqttClient.publish(getLedTopic, ledValue.toString(), settings.mqttPubOptions);
            }
            break;
      }

   });

   rotary.on('change', function() {
      var scaledValue = this.value / 1023 * 100; // scale from 0 - 100
      filteredValue = ((scaledValue - filteredValue) * filterConstant) + filteredValue;
      if (mqttClient.connected) {
         var displayValue = Math.round(filteredValue);
         if (displayValue != prevDisplayValue) {
            console.log('Raw value: ' + scaledValue.toString() + '  Filtered value: ' + displayValue.toString());
            mqttClient.publish(getPotTopic, displayValue.toString(), settings.mqttPubOptions);
         }
         prevDisplayValue = displayValue;
      }
   });
});
