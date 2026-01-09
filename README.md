# memvigil

A comprehensive Node.js memory management and monitoring library with real-time tracking capabilities.

![npm](https://img.shields.io/npm/dt/memvigil)
![npm version](https://img.shields.io/npm/v/memvigil)
![License](https://img.shields.io/npm/l/memvigil)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [TypeScript Support](#typescript-support)
- [API Reference](#api-reference)
- [Production Best Practices](#production-best-practices)
- [License](#license)

## Installation

```bash
npm install memvigil
```

## Features

- 🔍 Real-time memory monitoring
- 📊 CPU usage tracking
- 🚨 Automatic leak detection with severity levels
- 📸 Heap snapshot generation
- ♻️ Garbage collection analysis
- 📈 Performance metrics
- 🎯 Custom threshold alerts (warning & critical)
- 📉 Memory trend analysis with predictions
- ⚠️ Memory pressure detection
- 📄 Export reports (JSON/CSV)
- 📊 Comprehensive statistics
- 💻 Full TypeScript support

## Quick Start

```javascript
const MemoryMonitor = require("memvigil");

// Initialize with 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

// Set up basic event listeners
monitor.on("thresholdExceeded", (memoryUsage) => {
  console.log(
    "Memory threshold exceeded:",
    `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
  );
});

monitor.on("leakDetected", (details) => {
  console.log("Memory leak detected:", details.message);
  console.log("Suggestions:", details.suggestions);
});

// Start monitoring with 10-second intervals
monitor.startMonitoring(10000);
```

## Usage Examples

### Basic Monitoring

```javascript
const MemoryMonitor = require("memvigil");

// Initialize with 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

// Start monitoring with 10-second intervals
monitor.startMonitoring(10000);
```

### Advanced Configuration with Options

```javascript
const MemoryMonitor = require("memvigil");

const options = {
  enableGC: true,
  enablePredictions: true,
  alertThresholds: {
    warning: 150 * 1024 * 1024, // 150MB
    critical: 200 * 1024 * 1024, // 200MB
  },
};

const monitor = new MemoryMonitor(100 * 1024 * 1024, 1000, options);

// Listen for warning alerts
monitor.on("warningAlert", (alert) => {
  console.log("Warning:", alert.message);
});

// Listen for critical alerts
monitor.on("criticalAlert", (alert) => {
  console.log("Critical:", alert.message);
  // Take immediate action
});

monitor.startMonitoring(5000);
```

### Memory Trend Analysis

```javascript
monitor.on("memoryTrend", (trend) => {
  console.log(`Memory trend: ${trend.direction}`);
  console.log(`Rate: ${(trend.rate / 1024).toFixed(2)} KB/s`);
  console.log(
    `Predicted memory in 1 hour: ${(trend.prediction / 1024 / 1024).toFixed(
      2
    )} MB`
  );
});

// Or get trend manually
const trend = monitor.analyzeMemoryTrend();
if (trend && trend.direction === "increasing") {
  console.log("Memory is growing!");
}
```

### Memory Pressure Detection

```javascript
const pressure = monitor.detectMemoryPressure();
if (pressure.isUnderPressure) {
  console.log(`Memory pressure level: ${pressure.pressureLevel}`);
  console.log("Contributing factors:", pressure.factors);

  if (pressure.pressureLevel === "critical") {
    // Take emergency action
    monitor.takeHeapSnapshot();
  }
}
```

### Export Reports

```javascript
// Export to JSON
const jsonPath = await monitor.exportReport("json", "./memory-report.json");
console.log("Report exported to:", jsonPath);

// Export to CSV
const csvPath = await monitor.exportReport("csv", "./memory-report.csv");
console.log("CSV exported to:", csvPath);
```

### Comprehensive Statistics

```javascript
const stats = monitor.getStatistics();

console.log("Memory Statistics:");
console.log(
  `  Current: ${(stats.memory.current.heapUsed / 1024 / 1024).toFixed(2)} MB`
);
console.log(`  Average: ${(stats.memory.average / 1024 / 1024).toFixed(2)} MB`);
console.log(
  `  Peak: ${(stats.memory.peak.value / 1024 / 1024).toFixed(
    2
  )} MB at ${new Date(stats.memory.peak.timestamp)}`
);

console.log("CPU Statistics:");
console.log(`  Current user: ${stats.cpu.current.user}μs`);
console.log(`  Average user: ${stats.cpu.average.user}μs`);

console.log("Performance Impact:");
console.log(`  Average: ${stats.performance.averageTimeMs.toFixed(3)} ms`);
console.log(`  Total samples: ${stats.performance.count}`);
```

### Enhanced Leak Detection

```javascript
monitor.on("leakDetected", (result) => {
  console.log(`Leak detected with ${result.severity} severity`);
  console.log(`Trend: ${(result.trend * 100).toFixed(2)}%`);
  console.log("Suggestions:", result.suggestions);

  if (result.severity === "critical") {
    // Automatically take heap snapshot
    monitor.takeHeapSnapshot();
  }
});

// Run leak detection
await monitor.detectLeaks(60000, 0.1, 5);
```

## Production Best Practices

1. **Appropriate Monitoring Intervals**

   ```javascript
   // Use longer intervals in production
   monitor.startMonitoring(30000); // 30 seconds
   ```

2. **Resource Management**

   ```javascript
   // Clean up old snapshots
   monitor.on("heapSnapshot", (filePath) => {
     // Keep only last 5 snapshots
     cleanupOldSnapshots(5);
   });
   ```

3. **Error Handling**

   ```javascript
   monitor.on("error", (error) => {
     logger.error("Memory monitor error:", error);
   });
   ```

4. **Performance Impact Monitoring**
   ```javascript
   setInterval(() => {
     const impact = monitor.getPerformanceImpact();
     if (impact.averageTimeMs > 100) {
       // If overhead exceeds 100ms
       monitor.stopMonitoring();
     }
   }, 60000);
   ```

## TypeScript Support

memvigil includes full TypeScript definitions. Simply import and use with full type safety:

```typescript
import MemoryMonitor, { MonitorOptions, MemoryTrend } from "memvigil";

const options: MonitorOptions = {
  enableGC: true,
  enablePredictions: true,
  alertThresholds: {
    warning: 150 * 1024 * 1024,
    critical: 200 * 1024 * 1024,
  },
};

const monitor = new MemoryMonitor(100 * 1024 * 1024, 1000, options);

monitor.on("memoryTrend", (trend: MemoryTrend) => {
  console.log(`Trend: ${trend.direction}, Prediction: ${trend.prediction}`);
});

monitor.startMonitoring(5000);
```

All types are exported and available for use in your TypeScript projects.

## API Reference

### Constructor

```javascript
new MemoryMonitor(threshold?, maxHistorySize?, options?)
```

- `threshold` (number, default: 100MB): Memory threshold in bytes
- `maxHistorySize` (number, default: 1000): Maximum history entries to keep
- `options` (object, optional):
  - `enableGC` (boolean, default: true): Enable garbage collection tracking
  - `enablePredictions` (boolean, default: true): Enable memory trend predictions
  - `alertThresholds` (object, optional):
    - `warning` (number): Warning threshold in bytes
    - `critical` (number): Critical threshold in bytes

### Methods

- `startMonitoring(interval?)` - Start monitoring (default: 5000ms)
- `stopMonitoring()` - Stop monitoring
- `takeHeapSnapshot(automatic?)` - Generate heap snapshot
- `getMemoryUsageReport()` - Get memory history
- `getCpuUsageReport()` - Get CPU history
- `getGCReport()` - Get GC history
- `clearHistory()` - Clear all history
- `detectLeaks(duration?, threshold?, samples?)` - Detect memory leaks
- `analyzeMemoryTrend()` - Analyze memory trends
- `detectMemoryPressure()` - Detect memory pressure
- `getStatistics()` - Get comprehensive statistics
- `exportReport(format?, filePath?)` - Export report (json/csv)
- `getMemoryBreakdown()` - Get detailed memory breakdown
- `getPerformanceImpact()` - Get performance impact metrics
- `checkNodeCompatibility()` - Check Node.js version compatibility

### Events

- `thresholdExceeded` - Emitted when memory exceeds threshold
- `memoryStats` - Emitted on each memory measurement
- `cpuStats` - Emitted on each CPU measurement
- `leakDetected` - Emitted when a leak is detected
- `heapSnapshot` - Emitted when a heap snapshot is created
- `memoryTrend` - Emitted when memory trend is analyzed
- `warningAlert` - Emitted when warning threshold is exceeded
- `criticalAlert` - Emitted when critical threshold is exceeded
- `gcStats` - Emitted on GC statistics update
- `reportExported` - Emitted when a report is exported
- `error` - Emitted on errors
- `warning` - Emitted for warnings
- `info` - Emitted for informational messages

## License

MIT License - see LICENSE file for details
