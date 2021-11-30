# Fitbit Clockface HeartRate Alert
This clockface app will install on a fitbit watch and automatically send alerts to another server. That server will then text/call numbers listed under the users profile. The first number should be the users number, and that will serve as a health check. after a time, the next texts/calls go out and those people will make the decision to call 911 or take other appropriate action. 
# Screenshot
Clockface screenshots generated by the fitbit studio. 
<br></br>
<p float="left">
  <img src="/resources/CryonicsMonitor-screenshot(4).png" width="300" />
  <img src="/resources/CryonicsMonitor-screenshot(5).png" width="300" /> 
</p>

# Description
This is the code for a clockface app for fitbit Sense.
Time with proper timezone. Fitbit ID is sent to the watch from the phone after logging in via the FB mobile app.
This ID is what is sent to the website so that the website can figure out which user is in alert state. 
Heart rate shows the current heartrate, FB has really good hardware and will generally pick up each heartbeat without missing any. 
if no heart beat is detected for 14-29 seconds, an alert is sent to FB companion on phone. for 15 seconds the companion will try to get GPS info, and then send the alert to the other website with the ID attached. 
Monitoring status will show if the watch is monitoring the HR and if the watch has a working socket connection to the phone.
if bluetooth connection is lost, the watch will try to reconnect and will vibrate to let you know. Make sure the phone is ON, and bluetooth enabled.
Sometimes bluetooth socket connections will never reestablish, so after 30 seconds the clockface will automatically restart. This will most likely result in a new connection. 
the watch will automatically pause monitoring while charging. If you need to take it off for any reason, put it on the charger... otherwise an alert will be generated
# link to deployed app
The clockface is deployed, but currently only via a private link as the software is undergoing trials within the group. 
# License
All rights reserved. Contact me for usage. 
# Questions
 Questions may be forwarded to me at my Github profile
<a href='https://github.com/gshaver82'>gshaver82 Github</a>
<img src='https://avatars.githubusercontent.com/u/52022933?v=4' alt=Github profile picture width=100>
<a href='https://www.linkedin.com/in/gene-shaver-7b574b1a4/'>linkedin</a>