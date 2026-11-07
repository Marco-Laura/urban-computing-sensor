# Cycling Acceleration Data Collector

A browser based collector that records acceleration data from a bicycle mounted iPhone for exploring vibration during cycling.
It is implemented in HTML + JavaScript and was tested using Safari on an iPhone.


## Setup

1. Open the link on an iPhone in Safari: https://marco-laura.github.io/urban-computing-sensor/
2. Tap Enable sensors and allow motion access
3. Enter your upload token before starting a recording, to enable real-time data upload to cloud


## Recording

1. Tap the Start button, keeping Safari open and the phone awake for the duration of the recording
2. Readings upload automatically every five seconds.
3. When finished recording tap the Stop button, keep the page open until the final upload finishes
4. Select Export CSV to save a local copy of the recording
5. Repeat as often as required. Starting again will replace the previous recording held on the page

Refreshing or closing the page will delete the unexported dataset, while data already uploaded to the cloud remains stored.
Switching away from Safari will stop the recording.


## Open Data

Weather data is collected automatically once per hour. No manual action is required.
