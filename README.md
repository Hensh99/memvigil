# memvigil

A Node.js library for monitoring memory usage and detecting memory leaks.

## Installation

```sh
npm install memvigil
```

# Usage

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

monitor.on("leakDetected", (info) => {
  console.log("Leak detected:", info);
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

# API

## new MemoryMonitor(threshold)

- threshold: Memory usage threshold in bytes (default: 100MB).

## monitor.startMonitoring(interval)

- interval: Interval in milliseconds to check memory usage (default: 5000ms).

## monitor.stopMonitoring()

Stop monitoring memory usage.

## monitor.takeHeapSnapshot()

Take a heap snapshot and save it to a file.

## monitor.detectLeaks()

Detect potential memory leaks (placeholder for actual detection logic).

## monitor.getMemoryUsageReport()

Get a report of the historical memory usage data.

## monitor.clearHistory()

Clear the historical memory usage data.

## monitor.notifyOnThresholdExceeded(notificationMethod)

Notify users when memory threshold is exceeded using the provided method.

# Events

## thresholdExceeded

Emitted when memory usage exceeds the threshold.

- memoryUsage: The memory usage statistics.

## memoryStats

Emitted at each interval with current memory usage statistics.

- memoryUsage: The memory usage statistics.

## heapSnapshot

Emitted when a heap snapshot is saved.

- filePath: The file path of the saved snapshot.

## leakDetected

Emitted when a potential memory leak is detected.

- info: Information about the detected leak.

## error

Emitted when an error occurs within the MemoryMonitor.

- error: The error object.

---

This file provides a comprehensive guide on how to install, use, and contribute to the `MemoryMonitor` library. Save this content as `README.md` in your project directory.
