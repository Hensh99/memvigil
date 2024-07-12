# memvigil

A comprehensive Node.js library for advanced memory management and performance monitoring. memvigil offers real-time memory and CPU usage tracking, automatic leak detection, and heap analysis tools to help developers optimize application performance and prevent memory-related issues.

![npm](https://img.shields.io/npm/dt/memvigil)

## Key Features:

- Real-time memory and CPU usage monitoring
- Automatic and manual heap snapshot generation
- Memory leak detection with actionable insights
- Garbage collection tracking and analysis
- Performance impact assessment
- Detailed memory breakdown and historical data
- Node.js version compatibility checks
- Customizable alerts and notifications

Whether you're developing a small application or managing large-scale Node.js systems, memvigil provides the tools you need to ensure efficient memory utilization and optimal performance.

## Installation

```sh
npm install memvigil
```

## Quick Start

```js
const MemoryMonitor = require("memvigil");

const monitor = new MemoryMonitor(200 * 1024 * 1024); // 200MB threshold

monitor.on("thresholdExceeded", (memoryUsage) => {
  console.log("Memory threshold exceeded:", memoryUsage);
});

monitor.startMonitoring(10000); // Check every 10 seconds
```

### Detailed Usage

```js
const MemoryMonitor = require("memvigil");

// Create a new memory monitor with a 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

// Event listeners
monitor.on("thresholdExceeded", (memoryUsage) => {
  console.log("Memory threshold exceeded:", memoryUsage);
});

monitor.on("memoryStats", (memoryUsage) => {
  console.log("Memory stats:", memoryUsage);
});

monitor.on("cpuStats", (cpuUsage) => {
  console.log("CPU stats:", cpuUsage);
});

monitor.on("heapSnapshot", (filePath, automatic) => {
  console.log(`Heap snapshot ${automatic ? 'automatically ' : ''}saved to ${filePath}`);
});

monitor.on("leakDetected", (details) => {
  console.log("Potential memory leak detected:", details);
});

monitor.on("error", (error) => {
  console.error("Error:", error);
});

monitor.on("warning", (message) => {
  console.warn("Warning:", message);
});

monitor.on("info", (message) => {
  console.info("Info:", message);
});

// Start monitoring with a custom interval of 10 seconds
monitor.startMonitoring(10000);

// Take a manual heap snapshot
monitor.takeHeapSnapshot();

// Set up automatic heap dumps when heap usage exceeds 80%
monitor.automaticHeapDump(0.8);

// Detect memory leaks over a 60-second period
monitor.detectLeaks(60000);

// Check Node.js compatibility
monitor.checkNodeCompatibility();

// Set up a custom notification method for threshold exceeded
monitor.notifyOnThresholdExceeded((message) => {
  console.log("Custom Notification:", message);
});

// After some time...
setTimeout(() => {
  // Get various reports
  const memoryReport = monitor.getMemoryUsageReport();
  console.log("Memory Usage Report:", memoryReport);

  const cpuReport = monitor.getCpuUsageReport();
  console.log("CPU Usage Report:", cpuReport);

  const gcReport = monitor.getGCReport();
  console.log("Garbage Collection Report:", gcReport);

  // Get detailed memory breakdown
  const memoryBreakdown = monitor.getMemoryBreakdown();
  console.log("Memory Breakdown:", memoryBreakdown);

  // Check the performance impact of monitoring
  const performanceImpact = monitor.getPerformanceImpact();
  console.log("Monitoring Performance Impact:", performanceImpact, "ms");

  // Clear historical data
  monitor.clearHistory();

  // Stop monitoring
  monitor.stopMonitoring();
}, 120000); // After 2 minutes
```

# API Reference

## <b>MemoryMonitor Class</b>

### Constructor

- new MemoryMonitor(threshold)
- threshold: Memory usage threshold in bytes (default: 100MB)

<hr>

### Methods

- startMonitoring(interval): Start monitoring at specified interval (ms)
- stopMonitoring(): Stop monitoring
- takeHeapSnapshot(): Take a manual heap snapshot
- getMemoryUsageReport(): Get historical memory usage data
- getCpuUsageReport(): Get historical CPU usage data
- getGCReport(): Get garbage collection history
- clearHistory(): Clear all historical data
- notifyOnThresholdExceeded(callback): Set custom threshold notification
- detectLeaks(duration): Detect potential memory leaks
- getMemoryBreakdown(): Get detailed memory usage breakdown
- automaticHeapDump(threshold): Configure automatic heap dumps
- getPerformanceImpact(): Get monitoring performance impact
- checkNodeCompatibility(): Check Node.js version compatibility

<hr>

### Events

- thresholdExceeded: Emitted when memory usage exceeds threshold
- memoryStats: Emitted with current memory usage statistics
- cpuStats: Emitted with current CPU usage statistics
- heapSnapshot: Emitted when a heap snapshot is saved
- leakDetected: Emitted when a potential memory leak is detected
- error: Emitted when an error occurs
- warning: Emitted for non-critical issues
- info: Emitted for informational messages

---

### Best Practices

- Set appropriate thresholds based on your application's expected memory usage
- Use automaticHeapDump for critical production environments
- Regularly analyze the memory and CPU usage reports
- Investigate any detected memory leaks promptly

<hr>

### Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

<hr>

### License
This project is licensed under the MIT License - see the LICENSE file for details.

<hr>

### Support
If you encounter any problems or have any questions, please open an issue on the GitHub repository.

<hr>

<b> This file provides a comprehensive guide on how to install, use, and contribute to the `memvigil` library. Save this content as `README.md` in your project directory.</b>
