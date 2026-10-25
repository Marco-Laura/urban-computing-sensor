const enableButton = document.getElementById("enable");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const exportButton = document.getElementById("export");
const status = document.getElementById("status");
const count = document.getElementById("count");

let recording = false;
let readings = [];
let startTime = 0;
let sensorReady = false;

function measurement(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function collectReading(event) {
  const acceleration = event.acceleration;
  const gravity = event.accelerationIncludingGravity;
  const values = [
    measurement(acceleration?.x), measurement(acceleration?.y), measurement(acceleration?.z),
    measurement(gravity?.x), measurement(gravity?.y), measurement(gravity?.z)
  ];

  if (!sensorReady && values.some(value => value !== "")) {
    sensorReady = true;
    startButton.disabled = false;
    status.textContent = "Sensor readings available. Ready to start.";
  }

  if (recording) {
    readings.push([new Date().toISOString(), performance.now() - startTime, ...values]);
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
  if (readings.length > 0 && !confirm("Starting again replaces the previous recording. Continue?")) return;
  readings = [];
  startTime = performance.now();
  recording = true;
  startButton.disabled = true;
  stopButton.disabled = false;
  exportButton.disabled = true;
  count.textContent = "0";
  status.textContent = "Recording. Keep Safari visible and your phone awake.";
});

function stopRecording() {
  recording = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  exportButton.disabled = readings.length === 0;
  count.textContent = readings.length;
  status.textContent = "Recording stopped";
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
