'use client';

// Advanced caching system with LRU eviction and intelligent invalidation
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  tags?: string[]; // Tags for cache invalidation
  serialize?: boolean; // Whether to serialize data to localStorage
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanup();
    this.loadFromStorage();
  }

  private startCleanup() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();
  }

  private evictLRU() {
    if (this.cache.size <= this.maxSize) return;

    // Find least recently used entry
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('hexstrike-cache');
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();

        for (const [key, entry] of Object.entries(data)) {
          const cacheEntry = entry as CacheEntry;
          // Only load non-expired entries
          if (now - cacheEntry.timestamp < cacheEntry.ttl) {
            this.cache.set(key, cacheEntry);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem('hexstrike-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  public set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.defaultTTL,
      tags = [],
      serialize = true
    } = options;

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      tags
    };

    this.cache.set(key, entry);
    this.evictLRU();

    if (serialize) {
      this.saveToStorage();
    }
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public clear(): void {
    this.cache.clear();
    localStorage.removeItem('hexstrike-cache');
  }

  public invalidateByTag(tag: string): number {
    let count = 0;
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        toDelete.push(key);
        count++;
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();

    return count;
  }

  public getStats() {
    const now = Date.now();
    let expired = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalSizeBytes: totalSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    let totalAccess = 0;
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
    }
    return this.cache.size > 0 ? totalAccess / this.cache.size : 0;
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton cache manager
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}

// API response cache with intelligent invalidation
export class APICache {
  private cache: CacheManager;

  constructor() {
    this.cache = getCacheManager();
  }

  public async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetcher();
      this.cache.set(key, data, {
        ttl: 5 * 60 * 1000, // 5 minutes default
        tags: ['api'],
        ...options
      });
      return data;
    } catch (error) {
      // If fetch fails, try to return stale data
      const stale = this.cache.get<T>(key);
      if (stale !== null) {
        console.warn('Returning stale data due to fetch error:', error);
        return stale;
      }
      throw error;
    }
  }

  public invalidateAPI(): number {
    return this.cache.invalidateByTag('api');
  }

  public invalidateEndpoint(endpoint: string): number {
    return this.cache.invalidateByTag(`endpoint:${endpoint}`);
  }
}

// React hook for caching
export function useCache() {
  const cache = getCacheManager();
  const apiCache = new APICache();

  return {
    set: cache.set.bind(cache),
    get: cache.get.bind(cache),
    has: cache.has.bind(cache),
    delete: cache.delete.bind(cache),
    clear: cache.clear.bind(cache),
    invalidateByTag: cache.invalidateByTag.bind(cache),
    getStats: cache.getStats.bind(cache),
    
    // API specific methods
    fetchWithCache: apiCache.get.bind(apiCache),
    invalidateAPI: apiCache.invalidateAPI.bind(apiCache),
    invalidateEndpoint: apiCache.invalidateEndpoint.bind(apiCache)
  };
}

// Service Worker cache for offline support
export class ServiceWorkerCache {
  private swRegistration: ServiceWorkerRegistration | null = null;

  public async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  public async cacheResources(resources: string[]): Promise<void> {
    if (!this.swRegistration) return;

    const cache = await caches.open('hexstrike-v1');
    await cache.addAll(resources);
  }

  public async getCachedResponse(request: string): Promise<Response | undefined> {
    const cache = await caches.open('hexstrike-v1');
    return cache.match(request);
  }

  public async clearCache(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
}

// Image cache with lazy loading
export class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Set<string>();

  public async loadImage(src: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing promise if already loading
    if (this.loading.has(src)) {
      return new Promise((resolve, reject) => {
        const checkLoaded = () => {
          if (this.cache.has(src)) {
            resolve(this.cache.get(src)!);
          } else if (!this.loading.has(src)) {
            reject(new Error('Image loading failed'));
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    // Start loading
    this.loading.add(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loading.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.loading.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  public preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(src => this.loadImage(src)));
  }

  public clear(): void {
    this.cache.clear();
    this.loading.clear();
  }
}

// Export singleton instances
export const imageCache = new ImageCache();
export const serviceWorkerCache = new ServiceWorkerCache();