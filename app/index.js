import * as document from "document";
import { HeartRateSensor } from "heart-rate";
import { me } from "appbit";
import { charger } from "power";
import * as messaging from "messaging";
import { peerSocket } from "messaging";
import { vibration } from "haptics";
import clock from "clock";

const clockLabel = document.getElementById("clock-label");
const clockData = document.getElementById("clock-data");
const fbidLabel = document.getElementById("fbid-label");
const fbidData = document.getElementById("fbid-data");

const hrmLabel = document.getElementById("hrm-label");
const hrmData = document.getElementById("hrm-data");

const chargeLabel = document.getElementById("charge-label");
const chargeData = document.getElementById("charge-data");

const statusLabel = document.getElementById("status-label");
const statusData = document.getElementById("status-data");
const phoneconnstatusData = document.getElementById("phoneconnstatus-data");
const restartstatusData = document.getElementById("restartstatus-data");

const sensors = [];
var restartTimeoutID;
var restartAlertBuzzWaitTimeID;

let alertSent = true;
me.appTimeoutEnabled = false; // Disable timeout

peerSocket.addEventListener('message', async function (event) {
    console.log('Message from companion --- ', event.data);
    fbidData.text = event.data
});

function restart() {
    if (lastReading === 0) {
        console.log("inside restart, but last reading === 0")
        phoneconnstatusData.text = "Phone connection closed/lost"
        restartstatusData.text = "Check if phone, BT are ON. Not Restarting"
    } else if (lastReading !== 0) {
        console.log("inside restart, lastReading !== 0")
        phoneconnstatusData.text = "Phone connection closed/lost"
        restartstatusData.text = "Check if phone, BT are ON. will restart"

        restartAlertBuzzWaitTimeID = setTimeout(function () {
            if (peerSocket.readyState === peerSocket.CLOSED) {
                vibration.start("alert");
            }
        }, 20000);


        restartTimeoutID = setTimeout(function () {
            if (peerSocket.readyState === peerSocket.CLOSED) {
                vibration.stop();
                me.exit()
            } else if (peerSocket.readyState === peerSocket.OPEN) {
                console.log("Not restarting phone Conn was reopened")
                restartstatusData.text = ""
                vibration.stop();
            } else {
                restartstatusData.text = "Error -- restart clockface manually"
                vibration.stop();
            }
        }, 30000);
    }
}

messaging.peerSocket.onclose = () => {
    if (charger.connected) {
        console.log("APP !!!! messaging.peerSocket.onclose. not restarting due to charging state")
    } else {
        console.log("APP !!!! messaging.peerSocket.onclose")
        restart()
    }
};
messaging.peerSocket.onerror = (event) => {
    if (charger.connected) {
        console.log("APP !!!! messaging.peerSocket.onerror. not restarting due to charging state", JSON.stringify(event))
    } else {
        console.log("APP !!!! messaging.peerSocket.onerror", JSON.stringify(event))
        restart()
    }
};
messaging.peerSocket.onopen = () => {
    vibration.stop();
    console.log("APP messaging.peerSocket.onopen")
    phoneconnstatusData.text = "Connection to Phone Active"
    restartstatusData.text = ""
};

let lastReading = 0;
let currentTime = 0;
currentTime = Date.now();
if (HeartRateSensor) {
    const hrm = new HeartRateSensor({ frequency: 1 });
    hrm.onreading = function () {
        hrmData.text = JSON.stringify({
            heartRate: hrm.heartRate ? hrm.heartRate : 0
        });
        lastReading = Date.now();
        alertSent = false;
    }
    sensors.push(hrm);
} else {
    hrmLabel.style.display = "none";
    hrmData.style.display = "none";
}
function checkHRTimes() {
    let datenow = Date.now()
    const timeDiff = datenow - lastReading
    if (timeDiff < 14000 && lastReading !== 0) {
        statusData.text = "HR Monitor Active"
        if (peerSocket.readyState === peerSocket.OPEN) {
            phoneconnstatusData.text = "Connection to Phone Active"
            restartstatusData.text = ""
        } else if (peerSocket.readyState === peerSocket.CLOSED) {
            restart()
        }
    } else if (timeDiff >= 14000 && lastReading !== 0) {
        if (peerSocket.readyState === peerSocket.OPEN && alertSent === false) {
            peerSocket.send(datenow);
            alertSent = true;
            statusData.text = "Alert sent"
            vibration.start("confirmation");
            vibration.stop();
        } else if (alertSent === true) {
            statusData.text = "Alert sent. Seconds since HR:" + (Math.floor(timeDiff / 1000))
            // console.log("not peer socket sending alert because alert sent is true") 
        } else {
            statusData.text = "Error communicating with phone"
            if (peerSocket.readyState === peerSocket.OPEN) {
                phoneconnstatusData.text = "socket was open"
            } else if (peerSocket.readyState === peerSocket.CLOSED) {
                phoneconnstatusData.text = "socket was closed" + (Math.floor(timeDiff / 1000))
            }
        }
    } else if (lastReading === 0) {
        statusData.text = "No HR reading yet."
    }
}
let HRinterval;

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function updateChargeState() {
    if (charger.connected) {
        chargeData.text = "Charger connected"
        lastReading = 0;
        clock.granularity = "off";
        vibration.stop();
        sensors.map(sensor => sensor.stop())
        clearInterval(HRinterval)
        hrmData.text = "---"
        alertSent = true;
        statusData.text = "Not monitoring HR, charger connected"
        phoneconnstatusData.text = "Not monitoring phone conn"
    } else if (!charger.connected) {
        chargeData.text = "Not charging"
        clock.granularity = "minutes";
        clock.ontick = (evt) => {
            let min = evt.date.getMinutes()
            if (min < 10) {
                min = "0" + min;
            }
            let hours = evt.date.getHours()
            let date = evt.date.getDate()
            if (date < 10) {
                date = "0" + date;
            }
            let month = MONTH_NAMES[evt.date.getMonth()]
            clockLabel.text = month + "-" + date
            clockData.text = hours + ":" + min
        }
        sensors.map(sensor => sensor.start())
        lastReading = 0;
        statusData.text = "Not monitoring, charger recent disconn"
        setTimeout(function () {
            statusData.text = "Will monitor after HR detected"
            HRinterval = setInterval(checkHRTimes, 15000);
            if (peerSocket.readyState === peerSocket.CLOSED) {
                restart()
            } else if (peerSocket.readyState === peerSocket.OPEN) {
                phoneconnstatusData.text = "Connection to Phone Active"
                restartstatusData.text = ""
            } else {
                console.log("ERROR bad")
            }
        }, 20000);
    }
}

updateChargeState()
charger.onchange = evt => {
    updateChargeState()
};



