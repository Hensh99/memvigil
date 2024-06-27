# memvigil

A lightweight Node.js library for real-time memory monitoring and leak detection, with automatic heap snapshots and event-driven alerts.

## Installation

```sh
npm install memvigil
```

## Usage

```js
const MemoryMonitor = require("memvigil");

// Create a new memory monitor with a 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

monitor.on("thresholdExceeded", (memoryUsage) => {
  console.log("Memory threshold exceeded:", memoryUsage);
});

monitor.on("memoryStats", (memoryUsage) => {
  console.log("Memory stats:", memoryUsage);
});

monitor.on("heapSnapshot", (filePath) => {
  console.log(`Heap snapshot saved to ${filePath}`);
});

monitor.on("error", (error) => {
  console.error("Error:", error);
});

// Start monitoring with a custom interval of 10 seconds
monitor.startMonitoring(10000);

// Take a heap snapshot manually
monitor.takeHeapSnapshot();

// Get a report of historical memory usage
const report = monitor.getMemoryUsageReport();
console.log("Memory Usage Report:", report);

// Clear historical memory usage data
monitor.clearHistory();

// Set up a custom notification method for threshold exceeded
monitor.notifyOnThresholdExceeded((message) => {
  console.log("Custom Notification:", message);
});
```

## API

1. new MemoryMonitor(threshold)

- threshold: Memory usage threshold in bytes (default: 100MB).

2. monitor.startMonitoring(interval)

- interval: Interval in milliseconds to check memory usage (default: 5000ms).

3. monitor.stopMonitoring()

- Stop monitoring memory usage.

4. monitor.takeHeapSnapshot()

- Take a heap snapshot and save it to a file.

5. monitor.getMemoryUsageReport()

- Get a report of the historical memory usage data.

6. monitor.clearHistory()

- Clear the historical memory usage data.

7. monitor.notifyOnThresholdExceeded(notificationMethod)

- Notify users when memory threshold is exceeded using the provided method.

8. monitor.detectLeaks()

- Detect potential memory leaks and emit an event with the details.

<hr>

## Events

1. thresholdExceeded

- Emitted when memory usage exceeds the threshold.

- memoryUsage: The memory usage statistics.

2. memoryStats

- Emitted at each interval with current memory usage statistics.

- memoryUsage: The memory usage statistics.

3. heapSnapshot

- Emitted when a heap snapshot is saved.

- filePath: The file path of the saved snapshot.

4. leakDetected

- Emitted when a potential memory leak is detected.

- details: The details of the detected leak.

5. error

- Emitted when an error occurs within the MemoryMonitor.

- error: The error object.

---

<b> This file provides a comprehensive guide on how to install, use, and contribute to the `memvigil` library. Save this content as `README.md` in your project directory.</b>
