
import * as document from "document";
import { HeartRateSensor } from "heart-rate";
import { me } from "appbit";
import { charger } from "power";
import { battery } from "power";
import * as messaging from "messaging";
import { peerSocket } from "messaging";
import { vibration } from "haptics";
import clock from "clock";
import { readFileSync } from "fs";
import * as fs from "fs";
import { preferences } from "user-settings";
import { Accelerometer } from "accelerometer";

const BATbutton = document.getElementById("BATbutton");
const BATtxt = document.getElementById("BATtxt");
const SYNCbutton = document.getElementById("SYNCbutton"); // Repurposed as pairing status
const SYNCTxt = document.getElementById("SYNCTxt"); // Legacy UI; no longer updated
const MIDbutton = document.getElementById("MIDbutton");
const TIMEcontainer = document.getElementById("TIMEcontainer");
const INFOcontainer = document.getElementById("INFOcontainer");
const INFOTxt1 = document.getElementById("INFOTxt1");
const INFOTxt2 = document.getElementById("INFOTxt2");
const INFOTxt3 = document.getElementById("INFOTxt3");
const HRbutton = document.getElementById("HRbutton");
const CONNbutton = document.getElementById("CONNbutton");
const cloud_syncRect = document.getElementById("cloud_syncRect"); // Legacy UI; no longer updated
const HRrect = document.getElementById("HRrect");
const BATrect = document.getElementById("BATrect");

const HRPngOpen = document.getElementById("HRPngOpen");
const HRPngclosed = document.getElementById("HRPngclosed");

const CONNX = document.getElementById("CONNX");
const CONNcheck = document.getElementById("CONNcheck");
const CONNrect = document.getElementById("CONNrect");

const EnergyOpen = document.getElementById("EnergyOpen");
const EnergyClosed = document.getElementById("EnergyClosed");
const HRnum = document.getElementById("HRnum");
const TIMEDATE = document.getElementById("TIMEDATE");
const TIMETxt = document.getElementById("TIMETxt");
const TIMEMONTH = document.getElementById("TIMEMONTH");
const TIMEDAY = document.getElementById("TIMEDAY");
const TIMEORDINAL = document.getElementById("TIMEORDINAL");

// Hide stale Fitbit-cloud-sync status; cloud API is no longer used.
if (SYNCTxt) SYNCTxt.text = "--";
if (cloud_syncRect) cloud_syncRect.style.fill = "grey";

let infoState = false;
let settingsOBJ={}
if (fs.existsSync("/private/data/settings.txt")) {
  settingsOBJ = readFileSync("settings.txt", "json");
}else{
  settingsOBJ={
    displayId: "NO ID",
    connBuzzDelay: "4",
    HRtoggle: false
  }
  fs.writeFileSync("settings.txt", settingsOBJ, "json");
}
// An old saved Fitbit ID must never count as a new device pairing.
// Companion will send the new displayId after successful server pairing.
if (!/^[A-Z0-9]{6}$/.test(settingsOBJ.displayId || "")) {
  settingsOBJ.displayId = "NO ID";
}
delete settingsOBJ.encodedId;
delete settingsOBJ.syncBuzzDelay;
settingsOBJ.HRtoggle = settingsOBJ.HRtoggle === true;

let disconn = "NoConn:"   + Date.now();
if (fs.existsSync("/private/data/Disconn.txt")) {
  disconn = readFileSync("Disconn.txt", "utf-8");
}else{
  fs.writeFileSync("Disconn.txt", disconn, "utf-8");
}
let lastReading = 0;
let alertSent = true;
let alertSentTimeStamp=0;
if (fs.existsSync("/private/data/lastReading.txt")) {
  lastReading = Number(readFileSync("lastReading.txt", "utf-8")) || 0;
  alertSent = false;
}else{
  fs.writeFileSync("lastReading.txt", '0', "utf-8");
}
async function buttonPush(buttonName){
  if(infoState == true){
         vibration.start("bump");
         INFOcontainer.style.display = "none";
         TIMEcontainer.style.display = "inline";
         INFOTxt1.text = "--"
         INFOTxt2.text = "--"
         INFOTxt3.text = "--"
         infoState = false;
     }else{
       if(buttonName == "MIDbutton"){
        }else{
        vibration.start("bump");
        infoState = true;
        TIMEcontainer.style.display = "none" ;
        INFOcontainer.style.display = "inline";
      switch (buttonName) {
          case 'BATbutton':
            if (charger.connected) {
             INFOTxt1.text = "charger connected"
             INFOTxt2.text = "HR monitor paused"
             INFOTxt3.text = "Pairing via phone settings"
            }else{
             INFOTxt1.text = "charger not connected"
             INFOTxt2.text = "HR monitor available"
             INFOTxt3.text = "Pairing via phone settings"
            }
           break;

          case 'SYNCbutton':
            INFOTxt1.text = "Device ID: " + settingsOBJ.displayId;
            INFOTxt2.text = peerSocket.readyState === peerSocket.OPEN
              ? "Phone connected" : "Phone disconnected";
            INFOTxt3.text = "Server status unknown";
            break;

          case 'HRbutton':
            if (lastReading === 0) {
             INFOTxt1.text = "HR monitor not active"
             INFOTxt2.text = "HR monitoring will start"
             INFOTxt3.text = "when HR is detected"
             }else if (timeDiff >= 14000 && timeDiff <= 28000 && lastReading !== 0){
             INFOTxt1.text = "HR monitoring active"
             INFOTxt2.text = "No recent HR detected"
             INFOTxt3.text = "Checking for motion"
            }else if (timeDiff < 14000 && lastReading !== 0){
             INFOTxt1.text = "HR monitoring active"
             INFOTxt2.text = "HR monitoring will "
             INFOTxt3.text = "pause when charging"
            }else if(alertSent === true){
              if(alertSentTimeStamp != 0){
                 let datedotnow = Date.now()
                 let timeDiffer = datedotnow - alertSentTimeStamp
                 INFOTxt1.text = "HR Alert sent."
                 INFOTxt2.text = (Math.floor(timeDiffer / 1000)) + "seconds ago"
                 INFOTxt3.text = "--"
               }else{
                     INFOTxt1.text = "HR Alert sent."
                     INFOTxt2.text = "error reading"
                     INFOTxt3.text = "timestamp"
               }
            }  else {
             INFOTxt1.text = "Loading..."
             INFOTxt2.text = "--"
             INFOTxt3.text = "--"
            }
           break;

          case 'CONNbutton':
            if (peerSocket.readyState !== peerSocket.OPEN) {
              INFOTxt1.text = "Phone disconnected";
              INFOTxt2.text = "Check Fitbit phone app";
              INFOTxt3.text = "Alert delivery unavailable";
            } else if (/^[A-Z0-9]{6}$/.test(settingsOBJ.displayId)) {
              INFOTxt1.text = "Phone connected";
              INFOTxt2.text = "Device ID: " + settingsOBJ.displayId;
              INFOTxt3.text = "Server status unknown";
            } else {
              INFOTxt1.text = "Device not paired";
              INFOTxt2.text = "Open watch settings";
              INFOTxt3.text = "Enter pairing code";
            }
            break;

          default:
            INFOTxt1.text = "error"
          }
       }
     }
}
BATbutton.addEventListener("click", (evt) => {  buttonPush("BATbutton")})
SYNCbutton.addEventListener("click", (evt) => {  buttonPush("SYNCbutton")})
MIDbutton.addEventListener("click", (evt) => {  buttonPush("MIDbutton")})
HRbutton.addEventListener("click", (evt) => {  buttonPush("HRbutton")})
CONNbutton.addEventListener("click", (evt) => {  buttonPush("CONNbutton")})

const sensors = [];
var restartTimeoutID;
var restartAlertBuzzWaitTimeID;

me.appTimeoutEnabled = false; // Disable timeout

peerSocket.addEventListener("message", function (event) {
  const incoming = event.data;
  if (!incoming || typeof incoming !== "object" ||
      !Object.prototype.hasOwnProperty.call(incoming, "displayId")) {
    return;
  }
  settingsOBJ = {
    displayId: /^[A-Z0-9]{6}$/.test(incoming.displayId)
      ? incoming.displayId : "NO ID",
    connBuzzDelay: /^(0|1|2|3|4|5|6)$/.test(String(incoming.connBuzzDelay))
      ? String(incoming.connBuzzDelay) : "4",
    HRtoggle: incoming.HRtoggle === true
  };
  fs.writeFileSync("settings.txt", settingsOBJ, "json");
  updateConnectionIndicator();
});

function updateConnectionIndicator() {
  const connected = peerSocket.readyState === peerSocket.OPEN;
  CONNX.style.display = connected ? "none" : "inline";
  CONNcheck.style.display = connected ? "inline" : "none";
  CONNrect.style.fill = !connected ? "red" :
    (/^[A-Z0-9]{6}$/.test(settingsOBJ.displayId) ? "green" : "orange");
}

function restart() {
    if (lastReading === 0) {
      //if conn to phone is lost, but no initial HR reading, do nothing but console log
        // console.log("inside restart, but last reading === 0")
    } else if (lastReading !== 0) {
      //if conn to phone is lost with a HR reading
        // console.log("inside restart, lastReading !== 0")
        CONNX.style.display = "inline" ;
        CONNcheck.style.display = "none";
        CONNrect.style.fill = "red";
        restartAlertBuzzWaitTimeID = setTimeout(function () {
            if (peerSocket.readyState === peerSocket.CLOSED) {
              if (fs.existsSync("/private/data/Disconn.txt")) {
                let datenow = Date.now()
                let slicetemp= readFileSync("Disconn.txt", "utf-8").slice(7)
                if(slicetemp){
                  let timeConnLoss = Math.floor(datenow - slicetemp)
                  if(timeConnLoss + 5000 > (settingsOBJ.connBuzzDelay *60*1000)){
                      vibration.start("alert");
                  }
                }
              }
            }
        }, 20000);

        restartTimeoutID = setTimeout(function () {
            if (peerSocket.readyState === peerSocket.CLOSED) {
                vibration.stop();
              if (fs.existsSync("/private/data/lastReading.txt")) {
                fs.writeFileSync("lastReading.txt", lastReading.toString(), "utf-8");
                }else{console.log("ERROR reading last reading text file")}
              // console.log("lastReading file created, it is:" + readFileSync("lastReading.txt", "utf-8"));
              me.exit()
            } else if (peerSocket.readyState === peerSocket.OPEN) {
                // console.log("Not restarting phone Conn was reopened")
                vibration.stop();
            } else {
                vibration.stop();
            }
        }, 30000);
    }
}

messaging.peerSocket.onclose = () => {
        disconn = "NoConn:"   + Date.now();
        // console.log("writing file with info " + disconn)
        fs.writeFileSync("Disconn.txt", disconn, "utf-8");
        // console.log("disconn file written to with data:" + disconn )
        CONNX.style.display = "inline" ;
        CONNcheck.style.display = "none";
        CONNrect.style.fill = "red";
    if (charger.connected) {
        // console.log("APP !!!! messaging.peerSocket.onclose. not restarting due to charging state")
    } else {
        // console.log("APP !!!! messaging.peerSocket.onclose")
        restart()
    }
};
messaging.peerSocket.onerror = (event) => {
        console.log("APP !!!! messaging.peerSocket.onerror", JSON.stringify(event))
};
messaging.peerSocket.onopen = () => {
    disconn = "YesConn"
    vibration.stop();
    // console.log("APP messaging.peerSocket.onopen")
    // console.log("writing file with info " + disconn)
    fs.writeFileSync("Disconn.txt", disconn, "utf-8");
    // console.log("disconn file written to with data:" + disconn )
    CONNX.style.display = "none" ;
    CONNcheck.style.display = "inline";
    updateConnectionIndicator();
};


if (HeartRateSensor) {
    const hrm = new HeartRateSensor({ frequency: 1 });
    hrm.onreading = function () {
        const bpm = hrm.heartRate;
        HRnum.text = Number.isFinite(bpm) && bpm > 0 ? String(bpm) : "XX";
        // A missing/invalid sensor value is not a valid HR reading.
        if (!Number.isFinite(bpm) || bpm <= 0) return;
        lastReading = Date.now();
        alertSent = false;
        alertSentTimeStamp = 0
        HRPngclosed.style.display == "none" ? HRPngclosed.style.display = "inline" : HRPngclosed.style.display = "none"
    }
  // console.log("sensor push HRM-------------------------------------")
    sensors.push(hrm);
} else {
    HRnum.text = "XX"
}
let timeDiff = 0;


function checkHRTimes() {
    let datenow = Date.now()
    timeDiff = datenow - lastReading
  // console.log("inside HRTimes check", timeDiff)
    if(timeDiff >= 28000 && lastReading !== 0 && !charger.connected && alertSent === false){
         HRrect.style.fill = "orange"

         if (peerSocket.readyState === peerSocket.OPEN) {
            peerSocket.send(datenow);
            alertSentTimeStamp = Date.now()
            alertSent = true;
            if(settingsOBJ.HRtoggle == true ){
               vibration.start("alert");
              setTimeout(() => {vibration.stop()}, 20000);
            }
           // console.log("peerSocket.send(datenow);")

          }
       }else if (timeDiff >= 14000 && timeDiff <= 28000 && lastReading !== 0 && !charger.connected && alertSent === false) {
          HRrect.style.fill = "yellow"
          // console.log("checking acceleration monitor")
          accelerationMonitor()
    }else if(timeDiff < 14000 || lastReading === 0){
        HRrect.style.fill = "black"
    }else{
      // console.log("checkHRTimes Nothing doing")
    }
}
let HRinterval;
const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
let hours = 0;
let date = 0;
let min = 0;

updateChargeState()
charger.onchange = evt => {
    INFOcontainer.style.display = "none";
    TIMEcontainer.style.display = "inline";
    INFOTxt1.text = "--"
    INFOTxt2.text = "--"
    INFOTxt3.text = "--"
    infoState = false;
    disconn = "YesConn"
    fs.writeFileSync("Disconn.txt", disconn, "utf-8");
    if (peerSocket.readyState === peerSocket.CLOSED) {
       disconn = "NoConn:"   + Date.now();
       fs.writeFileSync("Disconn.txt", disconn, "utf-8");
     }
    updateChargeState()
};

function updateChargeState() {
    if (charger.connected) {
        EnergyClosed.style.display = "inline" ;
        lastReading = 0;
        fs.writeFileSync("lastReading.txt", '0', "utf-8");
        vibration.stop();
        sensors.map(sensor => sensor.stop())
        if(HRinterval){clearInterval(HRinterval)}
        alertSent = true;
        alertSentTimeStamp = 0
        BATrect.style.fill = "orange"
        HRrect.style.fill = "black"
    } else if (!charger.connected) {
        BATrect.style.fill = "black"
        EnergyClosed.style.display = "none" ;
        sensors.map(sensor => sensor.start())
        setTimeout(function () {
            HRinterval = setInterval(checkHRTimes, 15000);
            if (peerSocket.readyState === peerSocket.CLOSED) {
                restart()
            } else if (peerSocket.readyState === peerSocket.OPEN) {
            } else {
                // console.log("peerSocket ERROR bad")
            }
        }, 20000);
    }
}

clock.granularity = "minutes";
clock.ontick = (evt) => {
  // console.log("clock on tic")
  updateConnectionIndicator();
  // No Fitbit cloud-sync polling, sync buzz, or old Fitbit ID logic.
  // Leave legacy SYNCTxt/cloud_syncRect unused until the SVG is updated.
  BATtxt.text = Math.floor(battery.chargeLevel);
  min = evt.date.getMinutes()
  if (min < 10) {
      min = "0" + min;
  }
  hours = evt.date.getHours()
  if (preferences.clockDisplay === "12h") {
    hours = hours % 12 || 12;
  } else if (hours < 10) {
      hours = "0" + hours;
  }
  date = evt.date.getDate()
  if(date === 1 || date === 21 || date === 31){
     TIMEORDINAL.text = "st"
  }else if (date === 2 || date === 22){
     TIMEORDINAL.text = "nd"
  }else if (date === 3 || date === 23){
     TIMEORDINAL.text = "rd"
  }else{
     TIMEORDINAL.text = "th"
  }
  TIMEDAY.text = DAY_NAMES[evt.date.getDay()]
  TIMEMONTH.text = MONTH_NAMES[evt.date.getMonth()]
  TIMEDATE.text = date
  TIMETxt.text = hours + ":" + min
}



let accelerometer;
let accelerationRunning = false;
function accelerationMonitor(){
  let big = []
  let small = []
  if (Accelerometer) {
      if (accelerationRunning) return;
      accelerationRunning = true;
     // console.log("Accel loaded and starting");
     accelerometer = new Accelerometer({ frequency: 4 });
        // accelerometer.addEventListener("activate", () => {console.log("onactivate");});
        // accelerometer.addEventListener("error", () => {console.log("onerror: " + error);});
     accelerometer.addEventListener("reading", () => {
       // console.log(`${accelerometer.x},${accelerometer.y},${accelerometer.z}`);
       if (big.length == 0 || small.length == 0 ){
           big = [accelerometer.x,accelerometer.y,accelerometer.z]
           small = [accelerometer.x,accelerometer.y,accelerometer.z]
           }
       if(accelerometer.x > big[0]){
         big[0] =accelerometer.x
       }else if (accelerometer.x < small[0]){
         small[0] =accelerometer.x
       }

       if(accelerometer.y > big[1]){
         big[1] =accelerometer.y
       }else if (accelerometer.y < small[1]){
         small[1] =accelerometer.y
       }

       if(accelerometer.z > big[2]){
         big[2] =accelerometer.z
       }else if (accelerometer.z < small[2]){
         small[2] =accelerometer.z
       }

     });
     accelerometer.start();
  } else {
     // console.log("This device does NOT have an Accelerometer!");
    return("no Accelerometer")
  }
  setTimeout(function() {
    accelerometer.stop()
    accelerationRunning = false;
    if(Math.abs(big[0] - small[0]) > 1 || Math.abs(big[1] - small[1]) > 1 || Math.abs(big[2] - small[2]) > 1){
         lastReading = Date.now();
         HRrect.style.fill = "black"
       } else{
         // console.log("no motion")
       }

  }, 10000);
}

