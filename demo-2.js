var five        = require('johnny-five');
var Tessel      = require('tessel-io');
var mqtt        = require('mqtt');
var settings = require('./settings');

// get topics
var getPotTopic  = 'get/bots/' + settings.botName + '/pot';
var getFilterTopic  = 'get/bots/' + settings.botName + '/filterConstant';
// set topics
var setFilterTopic = 'set/bots/' + settings.botName + '/filterConstant';

function isNumber (o) {
   return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}

var board = new five.Board( { io: new Tessel() });

board.on('ready', function() {
   var mqttClient  = mqtt.connect(settings.mqttURL);
   // filter variables
   var filteredValue = 0;
   var filterConstant = 0.1;
   // display variable
   var prevDisplayValue = 0;

   mqttClient.on('connect', function () {
      console.log('connected to MQTT Broker at ' + settings.mqttURL);
      mqttClient.subscribe(setFilterTopic);
      mqttClient.publish(getFilterTopic, filterConstant.toString());
   });

   mqttClient.on('message', function (topic, message) {
      switch (topic) {
         case setFilterTopic:
            if ( isNumber(message) ) {
               var fcSet = Number(message);
               if (fcSet < 0.01) { fcSet = 0.01; } // clip @ 0
               else if (fcSet > 1.0) { fcSet = 1.0; } // clip @ 100
               filterConstant = fcSet;
               console.log('Setting filter constant to: ' + filterConstant);
               mqttClient.publish(getFilterTopic, filterConstant.toString());
            }
            break;
      }
   });

   var led = new five.Led('a5');
   var rotary = new five.Sensor('a4');

   rotary.on('change', function() {
      // Analog sensors produce a 10-bit value,
      // but led brightness is an 8-bit PWM value.
      // Convert by shifting the value's bits
      // two places to the right.
      led.brightness(this.value >> 2);
      var scaledValue = this.value / 1023 * 100; // scale from 0 - 100
      filteredValue = ((scaledValue - filteredValue) * filterConstant) + filteredValue;
      if (mqttClient.connected) {
         var displayValue = Math.round(filteredValue);
         if (displayValue != prevDisplayValue) {
            console.log('Raw value: ' + scaledValue.toString() + '  Filtered value: ' + displayValue.toString());
            mqttClient.publish(getPotTopic, displayValue.toString());
         }
         prevDisplayValue = displayValue;
      }
   });
});
