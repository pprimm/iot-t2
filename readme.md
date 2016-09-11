Set of source code for NodeBots Day IoT Talk

node_sensor.js
---
The NodeBots Day demonstration that will adjust the LED intensity based on the potentiometer setting.  You can use this program to test the wiring of your T2.

demo-1.js
---
Demonstrates a simple connection to an MQTT broker using the mqttURL setting in settings.js and publishes the potentiometer reading to an MQTT topic base on the botName in settings.js.  Set the string to whatever you want using printable ascii characters

demo-2.js
---
Adds a “settable” filter constant so our potentiometer value doesn’t bounce around.  We’ll demonstrate how to use an MQTT subscribe(...) to expose this value in our service to the outside world.

demo-3.js
---
Exposes setting the LED value to our service.  Now our LED intensity can be set by the outside world.

demo-4.js
---
Fixes our bad startup behavior for the bargraph display and LED assignment service.
