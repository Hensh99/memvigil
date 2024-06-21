# MemoryMonitor.js

A Node.js library for monitoring memory usage and detecting memory leaks.

## Installation

```sh
npm install mem-monitor
```

# Usage

```js
const MemoryMonitor = require("mem-monitor");

const monitor = new MemoryMonitor(200 * 1024 * 1024); // Set threshold to 200MB

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

// Start monitoring
monitor.startMonitoring();
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

# Events

## thresholdExceeded

Emitted when memory usage exceeds the threshold.

- memoryUsage: The memory usage statistics.

## memoryStats

Emitted at each interval with current memory usage statistics.

- memoryUsage: The memory usage statistics.

## heapSnapshot

Emitted when a heap snapshot is saved.

-filePath: The file path of the saved snapshot.

## leakDetected

Emitted when a potential memory leak is detected.

- info: Information about the detected leak.

## error

Emitted when an error occurs within the MemoryMonitor.

- error: The error object.

### License

MIT

This file provides a comprehensive guide on how to install, use, and contribute to the `MemoryMonitor` library. Save this content as `README.md` in your project directory.
