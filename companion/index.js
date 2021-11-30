import { geolocation } from "geolocation";
import * as messaging from "messaging";
import { peerSocket } from "messaging";
import { settingsStorage } from "settings";

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("COMP socket open")
  restoreSettings();
};

// A user changes Settings
settingsStorage.onchange = evt => {
  console.log("inside settingsStorage.onchange")
  if (evt.key === "oauth") {
    storeUserID()
  }
};

// logStorage()

// function logStorage(){
//   console.log("looping through local storage")
//   for (let index = 0; index < settingsStorage.length; index++) {
//        console.log(" index----" + index + " key---" + settingsStorage.key(index) + " data---" + settingsStorage.getItem(settingsStorage.key(index)))
//       }
// }

function sendIDtoWatch(user_id) {
  if (peerSocket.readyState === peerSocket.OPEN && user_id) {
    console.log("sending user id to watch", user_id)
    setTimeout(function () {
      if (peerSocket.readyState === peerSocket.OPEN && user_id) {
        peerSocket.send(user_id);
      } else {
        console.log("user_id not sent socket was open 1 second ago according to comp")
      }
    }, 1000);
  } else {
    console.log("user_id not sent")
  }
}

function storeUserID() {
  const data = JSON.parse(settingsStorage.getItem("oauth"))
  settingsStorage.setItem("encodedId", data.user_id);
  sendIDtoWatch(data.user_id)
}

// Restore previously saved settings and send to the device
function restoreSettings() {
  console.log("inside restoreSettings")
  if (settingsStorage.getItem("oauth")) {
    storeUserID()
  } else {
    console.log("inside restore settings, no oath key found")
    if (peerSocket.readyState === peerSocket.OPEN) {
      console.log("sending user id error to watch")
      setTimeout(function () {
        peerSocket.send("No ID found, log in via FB mobile app");
      }, 500);
    } else {
      console.log("ERROR user_id not sent")
    }
  }
}

const getCoords = async () => {
  console.log("starting to get geolocation")
  try {
    const pos = await new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, { timeout: 15000 });
    });
    return {
      long: pos.coords.longitude,
      lat: pos.coords.latitude,
    };
  } catch (error) {
    console.log(error);
  }
};


peerSocket.addEventListener('message', async function (event) {
  console.log('Message from watch --- ', event.data);
  // logStorage()
  const coords = await getCoords();
  console.log("coords", JSON.stringify(coords));
  var myHeaders = new Headers();
  myHeaders.append("semisecret", "XXXXXXXXX");
  myHeaders.append("Content-Type", 'application/json');
  if (settingsStorage.getItem("encodedId")) {
    sendIDtoWatch(settingsStorage.getItem("encodedId"))
    let fBwatchObject = {
      user_id: settingsStorage.getItem("encodedId"),
      newArrayEntry: {
        date: event.data,
        activeState: true,
      }
    }
    if (coords && coords.lat && coords.long) {
      fBwatchObject.newArrayEntry.lat = coords.lat
      fBwatchObject.newArrayEntry.long = coords.long
    }
    console.log("JSON.stringify(fBwatchObject)", JSON.stringify(fBwatchObject))
    var requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(fBwatchObject),
      redirect: 'follow'
    };
    fetch("https://cryonics-member-response-info.herokuapp.com/cApi/device", requestOptions)
      // .then(response => response.text())
      // .then(result => console.log(result))
      .catch(error => console.log('error', error));
  } else {
    sendIDtoWatch("ERROR No ID, cant send alert to server")
  }
});

import { me as companion } from "companion";
if (!companion.permissions.granted("run_background")) {
  console.warn("We're not allowed to access to run in the background!");
}
companion.wakeInterval = 301000;
// Listen for the event
companion.addEventListener("wakeinterval", doThis);
// Event happens if the companion is launched and has been asleep
if (companion.launchReasons.wokenUp) {
  console.log("COMP woken up");
}
function doThis() {
  console.log("COMP Wake interval happened!");
}
