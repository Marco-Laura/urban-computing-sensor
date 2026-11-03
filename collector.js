const enableButton = document.getElementById("enable");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const exportButton = document.getElementById("export");
const status = document.getElementById("status");
const count = document.getElementById("count");
const tokenInput = document.getElementById("upload-token");
const uploadStatus = document.getElementById("upload-status");

const uploadUrl = "https://lcljwqsq6ej6gyt6nwu4ahbq7m0cgbbm.lambda-url.eu-north-1.on.aws/";

let recording = false;
let readings = [];
let startTime = 0;
let sensorReady = false;

let recordingId = "";
let batchNumber = 0;
let uploadedCount = 0;
let uploadTimer;
let uploading = false;
let currentUpload = null;

async function uploadReadings() {
  const batch = readings.slice(uploadedCount);
  if (batch.length === 0) return;

  uploading = true;
  uploadStatus.textContent = "Uploading...";

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-upload-token": tokenInput.value
      },
      body: JSON.stringify({
        recording_id: recordingId,
        batch_number: batchNumber,
        readings: batch
      })
    });

    if (!response.ok) throw new Error("HTTP " + response.status);

    uploadedCount += batch.length;
    batchNumber += 1;
    uploadStatus.textContent = "Uploaded readings: " + uploadedCount;
  } catch (error) {
    uploadStatus.textContent = "Upload failed: " + error.message;
  } finally {
    uploading = false;
  }
}

function measurement(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function collectReading(event) {
  const acceleration = event.acceleration;
  const gravity = event.accelerationIncludingGravity;

  const values = [
    measurement(acceleration?.x),
    measurement(acceleration?.y),
    measurement(acceleration?.z),
    measurement(gravity?.x),
    measurement(gravity?.y),
    measurement(gravity?.z)
  ];

  if (!sensorReady && values.some(value => value !== "")) {
    sensorReady = true;
    startButton.disabled = false;
    status.textContent = "Sensor readings available. Ready to start.";
  }

  if (recording) {
    readings.push([
      new Date().toISOString(),
      performance.now() - startTime,
      ...values
    ]);
  }
}

enableButton.addEventListener("click", async () => {
  if (!window.isSecureContext || typeof DeviceMotionEvent === "undefined") {
    status.textContent = "Open the hosted HTTPS page directly in Safari on your iPhone.";
    return;
  }

  try {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();

      if (permission !== "granted") {
        status.textContent = "Motion permission was denied.";
        return;
      }
    }

    window.addEventListener("devicemotion", collectReading);
    enableButton.disabled = true;
    status.textContent = "Waiting for sensor readings. If none arrive, check permissions and reload.";
  } catch (error) {
    status.textContent = "Could not enable sensors: " + error.message;
  }
});

startButton.addEventListener("click", () => {
  if (readings.length > 0 &&
      !confirm("Starting again replaces the previous recording.")) {
    return;
  }

  readings = [];
  recordingId = crypto.randomUUID();
  batchNumber = 0;
  uploadedCount = 0;
  currentUpload = null;

  startTime = performance.now();
  recording = true;

  startButton.disabled = true;
  stopButton.disabled = false;
  exportButton.disabled = true;
  tokenInput.disabled = true;

  count.textContent = "0";
  uploadStatus.textContent = "Uploaded readings: 0";
  status.textContent = "Recording. Keep Safari visible and your phone awake.";

  uploadTimer = setInterval(() => {
    if (!uploading) {
      currentUpload = uploadReadings();
    }
  }, 5000);
});

async function stopRecording() {
  recording = false;
  clearInterval(uploadTimer);

  stopButton.disabled = true;
  exportButton.disabled = readings.length === 0;
  count.textContent = readings.length;
  status.textContent = "Recording stopped";

  await currentUpload;
  await uploadReadings();

  tokenInput.disabled = false;
  startButton.disabled = false;
}

stopButton.addEventListener("click", stopRecording);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && recording) {
    stopRecording();
    status.textContent = "Page hidden: recording stopped. Export the partial recording.";
  }
});

exportButton.addEventListener("click", () => {
  const header = "timestamp_utc,elapsed_ms,ax_ms2,ay_ms2,az_ms2,ax_including_gravity_ms2,ay_including_gravity_ms2,az_including_gravity_ms2";
  const csv = header + "\r\n" + readings.map(row => row.join(",")).join("\r\n");

  const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "cycling-data.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
  status.textContent = "Export available to download";
});

setInterval(() => {
  if (recording) count.textContent = readings.length;
}, 250);