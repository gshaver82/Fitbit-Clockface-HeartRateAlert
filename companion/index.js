// console.log("companion loaded")

import { geolocation } from "geolocation";
import * as messaging from "messaging";
import { peerSocket } from "messaging";
import { settingsStorage } from "settings";
// logStorage()
// function logStorage(){
//   console.log("looping through local storage")
//   for (let index = 0; index < settingsStorage.length; index++) {
//        console.log(" index----" + index + " key---" + settingsStorage.key(index) + " data---" + settingsStorage.getItem(settingsStorage.key(index)))
//     // if(settingsStorage.key(index) == "syncBuzzDelay"){
//     //   let temp = JSON.parse(settingsStorage.getItem("syncBuzzDelay"))
//     //   console.log("temp", JSON.stringify(temp.values[0].value)) 
//     // }
//   }
// }
messaging.peerSocket.onopen = () => { storeData();};
settingsStorage.onchange = evt => {
  // console.log("inside settingsStorage.onchange")
    storeData()
};
function storeData(){  
  if(settingsStorage.getItem("oauth")){
    const data = JSON.parse(settingsStorage.getItem("oauth"))
    settingsStorage.setItem("encodedId", data.user_id);
  } 
  sendSettingsData()  
  // logStorage()
}
function sendSettingsData(){ 
   let settingsOBJ={}
  settingsOBJ.encodedId =  settingsStorage.getItem("encodedId") ? settingsStorage.getItem("encodedId") : "NOID"
  let temp = JSON.parse(settingsStorage.getItem("connBuzzDelay"))
  settingsOBJ.connBuzzDelay = temp?.values[0].value ? temp?.values[0].value : 4
  temp = JSON.parse(settingsStorage.getItem("syncBuzzDelay"))
  settingsOBJ.syncBuzzDelay =  temp?.values[0].value ? temp?.values[0].value : 0  
  settingsOBJ.HRtoggle = JSON.parse(settingsStorage.getItem("HRtoggle")) ? JSON.parse(settingsStorage.getItem("HRtoggle")) : false
  
  
 console.log("APP settingsOBJ", JSON.stringify(settingsOBJ))
  if (peerSocket.readyState === peerSocket.OPEN) {
    peerSocket.send(settingsOBJ); 
  } else{
    console.log("settingsOBJ not sent?") 
    setTimeout(() => {
      console.log("re attempting to send settingsOBJ")
      if (peerSocket.readyState === peerSocket.OPEN) {
          peerSocket.send(settingsOBJ); 
       }
    }, 1000);
  }
}


const getCoords = async () => {
  // console.log("starting to get geolocation")
  try{
    const pos = await new Promise((resolve, reject) => {
          geolocation.getCurrentPosition(resolve, reject, {timeout: 15000});
        });    
        return {
          long: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
  }catch (error) {
  console.log(error);
  }
};

 
peerSocket.addEventListener('message', async function (event) {
  console.log('Message from watch --- ', event.data);
  alertToServer(event.data)
});


async function alertToServer(alertDateCode){
    // logStorage()
  const coords = await getCoords();
  // console.log("coords", JSON.stringify(coords));
  var myHeaders = new Headers();
  myHeaders.append("semisecret", "XXXXXXXXXXXXXXXXXXXXXXX");
  myHeaders.append("Content-Type", 'application/json');
  if(settingsStorage.getItem("encodedId")){
      // sendIDtoWatch(settingsStorage.getItem("encodedId"))   
      let fBwatchObject = {
                      user_id: settingsStorage.getItem("encodedId"),
                      newArrayEntry:{
                       date: alertDateCode,
                    activeState: true,
                   }
                  }
     if(coords && coords.lat && coords.long){
        fBwatchObject.newArrayEntry.lat = coords.lat
       fBwatchObject.newArrayEntry.long = coords.long
        }
    console.log ("JSON.stringify(fBwatchObject)", JSON.stringify(fBwatchObject))
  var requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: JSON.stringify(fBwatchObject),
    redirect: 'follow'
  };
fetch("https://cryonics-member-response-info.herokuapp.com/cApi/device", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
     }else {
       console.log("ERROR No ID, cant send alert to server") 
     } 
}

import { me as companion } from "companion";
if (!companion.permissions.granted("run_background")) {
  console.warn("We're not allowed to access to run in the background!");
}
companion.wakeInterval = 301000;
// Listen for the event
companion.addEventListener("wakeinterval", doThis);
function doThis() {
  console.log("COMP Wake interval happened!");
}
// Event happens if the companion is launched and has been asleep
if (companion.launchReasons.wokenUp) {
  console.log("COMP woken up");
}
