import { localStorage } from "local-storage";
import { geolocation } from "geolocation";
import { peerSocket } from "messaging";
import { settingsStorage } from "settings";
import { me as companion } from "companion";


const SERVER_URL = "https://cryonics-member-response-info.herokuapp.com";

const PAIR_URL = SERVER_URL + "/cApi/device/pair";
const ALERT_URL = SERVER_URL + "/cApi/device";

const TOKEN_KEY = "cmr_device_token";
const DISPLAY_ID_KEY = "cmr_display_id";



function getDeviceToken() { return localStorage.getItem(TOKEN_KEY); }

function getDisplayId() { return localStorage.getItem(DISPLAY_ID_KEY); }

function saveDeviceCredentials(token, displayId) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(DISPLAY_ID_KEY, displayId);
}

function clearDeviceCredentials() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DISPLAY_ID_KEY);
}


function getSetting(key) {
  const raw = settingsStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
}
function getPairingCode() {
  const setting = getSetting("pairingCode");
  if (!setting) return "";
  if (typeof setting === "object") { return String(setting.name || "").trim(); }
  return String(setting).trim();
}

let pairingInProgress = false;

async function pairDevice() {
  if (pairingInProgress) return;
  const pairingCode = getPairingCode();

  if (!pairingCode) return;
  if (!/^[0-9]{6}$/.test(pairingCode)) {
    console.log("Pairing code must contain 6 digits.");
    return;
  }
  pairingInProgress = true;
  try {
    const response = await fetch(PAIR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pairingCode: pairingCode
      })
    });

    if (!response.ok) {
      console.log(
        "Pairing failed. HTTP status:",
        response.status
      );
      return;
    }

    const data = await response.json();

    // Expected server response:
    // {
    //   "deviceToken": "...",
    //   "displayId": "..."
    // }

    if (
      typeof data.deviceToken !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(data.deviceToken) ||
      typeof data.displayId !== "string" ||
      !/^[A-Z0-9]{6}$/.test(data.displayId)
    ) {
      console.log("Invalid pairing response.");
      return;
    }

    // Persist the newly issued credentials.
    saveDeviceCredentials(
      data.deviceToken,
      data.displayId
    );

    console.log("Device paired successfully.");
    settingsStorage.removeItem("pairingCode");
    sendSettingsData();
  } catch (error) {
    console.log("Pairing request failed.");
  } finally { pairingInProgress = false; }
}
function sendSettingsData() {
  const settingsOBJ = {};

  settingsOBJ.displayId = getDisplayId() || "NO ID";

  const connBuzz = getSetting("connBuzzDelay");

  settingsOBJ.connBuzzDelay =
    connBuzz && connBuzz.values && connBuzz.values[0]
      ? connBuzz.values[0].value
      : "4";
  settingsOBJ.HRtoggle = getSetting("HRtoggle") === true;


  if (peerSocket.readyState === peerSocket.OPEN) {
    try {
      peerSocket.send(settingsOBJ);
    } catch (error) {
      console.log("Unable to send watch settings.");
    }
  } else {
    console.log("Watch not connected. Settings pending.");
  }
}

peerSocket.onopen = () => {
  console.log("Watch connected.");
  sendSettingsData();
};

settingsStorage.onchange = (event) => {
  if (event.key === "pairingCode") {
    if (getPairingCode()) {
      pairDevice();
    }
    return;
  }

  if (
    event.key === "connBuzzDelay" ||
    event.key === "HRtoggle"
  ) {
    sendSettingsData();
  }
};
async function getCoords() {
  try {
    const pos = await new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(
        resolve,
        reject,
        { timeout: 15000 }
      );
    });

    return {
      lat: pos.coords.latitude,
      long: pos.coords.longitude
    };

  } catch (error) {
    console.log("GPS location unavailable.");
    return null;
  }
}

peerSocket.addEventListener("message", (event) => {
  console.log("Message received from watch.");

  alertToServer(event.data);
});

async function alertToServer(alertDateCode) {
  const deviceToken = getDeviceToken();

  if (!deviceToken) {
    console.log(
      "CRITICAL: No device token. Alert cannot be authenticated."
    );
    return;
  }

  const coords = await getCoords();

  const alertObject = {
    newArrayEntry: {
      date: alertDateCode,
      activeState: true
    }
  };

  // Coordinates are only included when available.
  if (
    coords &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.long)
  ) {
    alertObject.newArrayEntry.lat = coords.lat;
    alertObject.newArrayEntry.long = coords.long;
  }

  // The server identifies the user from the token.
  // No user_id is required in the alert body.

  try {
    const response = await fetch(ALERT_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + deviceToken
      },
      body: JSON.stringify(alertObject)
    });

    if (response.status === 401 ||
      response.status === 403) {
      console.log(
        "CRITICAL: Device authorization rejected."
      );

      return;
    }

    if (!response.ok) {
      console.log(
        "Emergency alert failed. HTTP status:",
        response.status
      );
      return;
    }

    console.log(
      "Emergency alert acknowledged by server."
    );

  } catch (error) {
    console.log(
      "CRITICAL: Emergency alert network failure."
    );
  }
}

if (!companion.permissions.granted("run_background")) {
  console.warn("Background permission not granted!");
}

companion.wakeInterval = 301000;

companion.addEventListener("wakeinterval", () => {
  console.log("Companion wake interval happened.");
});

if (companion.launchReasons.wokenUp) {
  console.log("Companion woken from background.");
}

function initializeCompanion() {

  if (getDeviceToken()) {
    console.log("Existing device token found.");
  } else {
    console.log("Device not paired.");
  }

  if (getPairingCode()) {
    pairDevice();
  }

  sendSettingsData();
}

initializeCompanion();

