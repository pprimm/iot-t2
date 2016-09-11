var five = require("johnny-five");
var Tessel = require("tessel-io");

var board = new five.Board( { io: new Tessel() });

board.on("ready", function() {
  var led = new five.Led("a5");
  var rotary = new five.Sensor("a4");

  rotary.on("change", function() {
    led.brightness(this.value >> 2);
  });
});
