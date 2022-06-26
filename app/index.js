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
import { me as device } from "device";
import { Accelerometer } from "accelerometer";
const BATbutton = document.getElementById("BATbutton");
const BATtxt = document.getElementById("BATtxt");
const SYNCbutton = document.getElementById("SYNCbutton");
const SYNCTxt = document.getElementById("SYNCTxt");
const MIDbutton = document.getElementById("MIDbutton");
const TIMEcontainer = document.getElementById("TIMEcontainer");
const INFOcontainer = document.getElementById("INFOcontainer");
const INFOTxt1 = document.getElementById("INFOTxt1");
const INFOTxt2 = document.getElementById("INFOTxt2");
const INFOTxt3 = document.getElementById("INFOTxt3");
const HRbutton = document.getElementById("HRbutton");
const CONNbutton = document.getElementById("CONNbutton");
const cloud_syncRect = document.getElementById("cloud_syncRect");
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

let infoState = false;
let settingsOBJ={}
if (fs.existsSync("/private/data/settings.txt")) {
  settingsOBJ = readFileSync("settings.txt", "json");
  // console.log("settings file found, it is:" + JSON.stringify(readFileSync("settings.txt", "json")));
}else{
  settingsOBJ={
    encodedId: "NOID",
    connBuzzDelay: "3",
    syncBuzzDelay: "36",
    HRtoggle: "false"
  }
  fs.writeFileSync("settings.txt", settingsOBJ, "json");
  // console.log("settings file created, it is:" + JSON.stringify(readFileSync("settings.txt", "json")));
}

let disconn = "NoConn:"   + Date.now();
if (fs.existsSync("/private/data/Disconn.txt")) {
  disconn = readFileSync("Disconn.txt", "utf-8");
}else{
  fs.writeFileSync("Disconn.txt", disconn, "utf-8");
  // console.log("Disconn file created, it is:" + readFileSync("Disconn.txt", "utf-8"));
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
          // console.log("mid clicked, doing nothing");        
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
             INFOTxt3.text = "SYNC alert available"         
            }else{
             INFOTxt1.text = "charger not connected"
             INFOTxt2.text = "HR monitor available"   
             INFOTxt3.text = "SYNC alert available"        
            }
           break;
          
          case 'SYNCbutton':
            if(device.lastSyncTime){
             INFOTxt1.text = "synced with FB "+ Math.floor((Date.now() - device.lastSyncTime)/1000/60) + "min ago"
             INFOTxt2.text = "If > 39 min, Sync now"   
             INFOTxt3.text = "on mobile app" 

            }else{
             INFOTxt1.text = "sync info not found"   
             INFOTxt2.text = "--"   
             INFOTxt3.text = "-"          
            }
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
            if (fs.existsSync("/private/data/Disconn.txt")) {
              let datenow = Date.now()
              let slicetemp= readFileSync("Disconn.txt", "utf-8").slice(7)
              // console.log("slicetemp >>"+ slicetemp +"<<" )
              if(slicetemp){
                let ConnLossElapsed = Math.floor((datenow - slicetemp)/1000)
                // console.log("slicetemp exists, time since disconn is:" + ConnLossElapsed);              
                INFOTxt1.text = "disconn " + (ConnLossElapsed >300 ? "long time" : ConnLossElapsed + " seconds") 
                INFOTxt2.text = "Restart phone, if apple, "
                INFOTxt3.text = "reload FB in background" 
              }else if (settingsOBJ.encodedId != "NOID"){
                INFOTxt1.text = "Good connection"
                INFOTxt2.text = "to phone"
                INFOTxt3.text = settingsOBJ.encodedId + " ID loaded"
              }else if (settingsOBJ.encodedId === "NOID") {
                INFOTxt1.text = "FB ID not loaded"
                INFOTxt2.text = "go to FB mobile app"
                INFOTxt3.text = "clockface settings login"
              }else {
                INFOTxt1.text = "bad error!"
                INFOTxt2.text = ""
                INFOTxt3.text = ""
              }
            }else{
              INFOTxt1.text = "Error reading file"
              INFOTxt2.text = "--"
              INFOTxt3.text = "--" 
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

let alertSent = true;
let alertSentTimeStamp=0;
me.appTimeoutEnabled = false; // Disable timeout

peerSocket.addEventListener('message', async function (event) {
  event.data ? settingsOBJ = event.data : console.log("error getting data from message");
  // console.log("settingsOBJ",JSON.stringify(settingsOBJ))
  let json_data = event.data;
  fs.writeFileSync("settings.txt", json_data, "json");
  // console.log("settings file written to with data: ", JSON.stringify(json_data))
});

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
    settingsOBJ.encodedId === "NOID" ? CONNrect.style.fill = "orange": CONNrect.style.fill = "green"
};

let lastReading = 0;
if (HeartRateSensor) {
    const hrm = new HeartRateSensor({ frequency: 1 });
    hrm.onreading = function () {
        HRnum.text = hrm.heartRate ? hrm.heartRate : "XX"
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
         if(settingsOBJ.HRtoggle == "true" ){  
            vibration.start("alert");
            setTimeout(() => {vibration.stop()}, 20000);
         }    
         if (peerSocket.readyState === peerSocket.OPEN) {
            peerSocket.send(datenow);
           // console.log("peerSocket.send(datenow);")
           alertSentTimeStamp = Date.now()
            alertSent = true;  
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
function updateChargeState() {
      // console.log("charge state changed")
    if (charger.connected) { 
        EnergyClosed.style.display = "inline" ;  
        lastReading = 0;
        clock.granularity = "minutes";
        vibration.stop();
        sensors.map(sensor => sensor.stop())
        if(HRinterval){clearInterval(HRinterval)}
        alertSent = true;
        alertSentTimeStamp = 0
        BATrect.style.fill = "orange"   
        HRrect.style.fill == "black"
    } else if (!charger.connected) {
        BATrect.style.fill = "black"  
        disconn = "NoConn:"   + Date.now();
        // console.log("writing file with info " + disconn)
        if (peerSocket.readyState === peerSocket.CLOSED) {
        fs.writeFileSync("Disconn.txt", disconn, "utf-8");           
        // console.log("disconn file written to with data:" + disconn )          
        }      
        EnergyClosed.style.display = "none" ; 
        clock.granularity = "minutes";
        clock.ontick = (evt) => {
          if (settingsOBJ.encodedId === "NOID"  && peerSocket.readyState === peerSocket.OPEN){
            CONNrect.style.fill = "orange"
            vibration.start("alert");
            setTimeout(() => {vibration.stop()}, 10000);
          }else if(settingsOBJ.encodedId != "NOID" && peerSocket.readyState === peerSocket.OPEN){
            CONNrect.style.fill = "green"                   
          }
          if(settingsOBJ.syncBuzzDelay !=0 && Math.floor((Date.now() - device.lastSyncTime)/1000/60) > settingsOBJ.syncBuzzDelay){
             vibration.start("alert");
             setTimeout(() => {vibration.stop()}, 5000);
             }
            if(device.lastSyncTime){
              SYNCTxt.text = (Math.floor((Date.now() - device.lastSyncTime)/1000/60)<99) ?  
                Math.floor((Date.now() - device.lastSyncTime)/1000/60) + " min"  : "99+min" ;
              (Math.floor((Date.now() - device.lastSyncTime)/1000/60)>30) ? cloud_syncRect.style.fill = "orange" : cloud_syncRect.style.fill = "skyblue"
            }
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
        sensors.map(sensor => sensor.start())
        lastReading = 0;
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

updateChargeState()
charger.onchange = evt => {
    INFOcontainer.style.display = "none";
    TIMEcontainer.style.display = "inline";  
    INFOTxt1.text = "--"
    INFOTxt2.text = "--"
    INFOTxt3.text = "--"    
    infoState = false;
    updateChargeState()
};

let accelerometer;
function accelerationMonitor(){
  let big = []
  let small = []
  if (Accelerometer) {
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
        // console.log('inside invertal loop, evaluating for motion');
        // console.log("big" ,big[0], big[1], big[2])
        // console.log("small" ,small[0], small[1], small[2])
       // console.log("XX "  +  Math.abs(big[0] - small[0]) + " YY " + Math.abs(big[1] - small[1]) + " ZZ " +  Math.abs(big[2] - small[2]))
       if(Math.abs(big[0] - small[0]) > 1 || Math.abs(big[1] - small[1]) > 1 || Math.abs(big[2] - small[2]) > 1){   
            lastReading = Date.now();
            // console.log(" motion") 
            HRrect.style.fill == "black"
          } else{ 
            // console.log("no motion") 
          }
    
  }, 10000);
}




