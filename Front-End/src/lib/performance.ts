'use client';

// Performance monitoring and Web Vitals tracking
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface WebVitalsMetrics {
  CLS?: PerformanceMetric;
  FID?: PerformanceMetric;
  FCP?: PerformanceMetric;
  LCP?: PerformanceMetric;
  TTFB?: PerformanceMetric;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private vitalsCallback?: (metrics: WebVitalsMetrics) => void;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.processNavigationEntry(entry as PerformanceNavigationTiming);
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation timing observer not supported');
      }

      // Observe paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPaintEntry(entry);
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint timing observer not supported');
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.processLCPEntry(lastEntry);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe layout shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.processCLSEntry(clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processFIDEntry(entry);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    // Time to First Byte
    const ttfb = entry.responseStart - entry.requestStart;
    this.addMetric('TTFB', ttfb, this.getTTFBRating(ttfb));

    // DOM Content Loaded
    const dcl = entry.domContentLoadedEventEnd - entry.navigationStart;
    this.addMetric('DCL', dcl, this.getLoadRating(dcl));

    // Load Complete
    const loadComplete = entry.loadEventEnd - entry.navigationStart;
    this.addMetric('Load', loadComplete, this.getLoadRating(loadComplete));
  }

  private processPaintEntry(entry: PerformanceEntry) {
    if (entry.name === 'first-contentful-paint') {
      this.addMetric('FCP', entry.startTime, this.getFCPRating(entry.startTime));
    }
  }

  private processLCPEntry(entry: PerformanceEntry) {
    this.addMetric('LCP', entry.startTime, this.getLCPRating(entry.startTime));
  }

  private processCLSEntry(value: number) {
    this.addMetric('CLS', value, this.getCLSRating(value));
  }

  private processFIDEntry(entry: PerformanceEntry) {
    const fid = (entry as any).processingStart - entry.startTime;
    this.addMetric('FID', fid, this.getFIDRating(fid));
  }

  private addMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now()
    };
    
    this.metrics.set(name, metric);
    
    // Trigger callback for Web Vitals
    if (['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].includes(name) && this.vitalsCallback) {
      const vitals: WebVitalsMetrics = {};
      for (const vitalName of ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']) {
        const vitalMetric = this.metrics.get(vitalName);
        if (vitalMetric) {
          vitals[vitalName as keyof WebVitalsMetrics] = vitalMetric;
        }
      }
      this.vitalsCallback(vitals);
    }
  }

  // Rating functions based on Web Vitals thresholds
  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  }

  private getLoadRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 3000 ? 'good' : value <= 5000 ? 'needs-improvement' : 'poor';
  }

  // Public methods
  public getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  public getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  public getWebVitals(): WebVitalsMetrics {
    const vitals: WebVitalsMetrics = {};
    for (const vitalName of ['CLS', 'FID', 'FCP', 'LCP', 'TTFB']) {
      const metric = this.metrics.get(vitalName);
      if (metric) {
        vitals[vitalName as keyof WebVitalsMetrics] = metric;
      }
    }
    return vitals;
  }

  public onWebVitals(callback: (metrics: WebVitalsMetrics) => void) {
    this.vitalsCallback = callback;
  }

  public measureUserTiming(name: string, fn: () => void | Promise<void>) {
    const startTime = performance.now();
    
    const finish = () => {
      const duration = performance.now() - startTime;
      this.addMetric(`custom-${name}`, duration, duration <= 100 ? 'good' : duration <= 300 ? 'needs-improvement' : 'poor');
    };

    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(finish);
      } else {
        finish();
        return result;
      }
    } catch (error) {
      finish();
      throw error;
    }
  }

  public markFeatureUsage(feature: string) {
    const timestamp = Date.now();
    const existingUsage = localStorage.getItem('feature-usage');
    const usage = existingUsage ? JSON.parse(existingUsage) : {};
    
    if (!usage[feature]) {
      usage[feature] = { count: 0, firstUsed: timestamp, lastUsed: timestamp };
    }
    
    usage[feature].count++;
    usage[feature].lastUsed = timestamp;
    
    localStorage.setItem('feature-usage', JSON.stringify(usage));
  }

  public getFeatureUsage(): Record<string, { count: number; firstUsed: number; lastUsed: number }> {
    const usage = localStorage.getItem('feature-usage');
    return usage ? JSON.parse(usage) : {};
  }

  public reportError(error: Error, context?: string) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getAllMetrics()
    };

    // Store error locally for debugging
    const existingErrors = localStorage.getItem('error-reports');
    const errors = existingErrors ? JSON.parse(existingErrors) : [];
    errors.push(errorReport);
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    localStorage.setItem('error-reports', JSON.stringify(errors));

    // In production, you would send this to your error tracking service
    console.error('Performance Monitor Error Report:', errorReport);
  }

  public getPerformanceScore(): number {
    const vitals = this.getWebVitals();
    let score = 100;
    let count = 0;

    for (const [name, metric] of Object.entries(vitals)) {
      if (metric) {
        count++;
        switch (metric.rating) {
          case 'good':
            // No penalty
            break;
          case 'needs-improvement':
            score -= 15;
            break;
          case 'poor':
            score -= 30;
            break;
        }
      }
    }

    return count > 0 ? Math.max(0, score) : 0;
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.vitalsCallback = undefined;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// React hook for using performance monitoring
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();
  
  return {
    measureUserTiming: monitor.measureUserTiming.bind(monitor),
    markFeatureUsage: monitor.markFeatureUsage.bind(monitor),
    getMetric: monitor.getMetric.bind(monitor),
    getAllMetrics: monitor.getAllMetrics.bind(monitor),
    getWebVitals: monitor.getWebVitals.bind(monitor),
    getPerformanceScore: monitor.getPerformanceScore.bind(monitor),
    reportError: monitor.reportError.bind(monitor)
  };
}

// Utility function to send performance data to analytics
export function sendPerformanceData(metrics: WebVitalsMetrics) {
  // In production, send to your analytics service
  console.log('Performance metrics:', metrics);
  
  // Example: Send to Google Analytics 4
  if (typeof gtag !== 'undefined') {
    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric) {
        gtag('event', 'web_vital', {
          name,
          value: Math.round(metric.value),
          rating: metric.rating
        });
      }
    });
  }
}