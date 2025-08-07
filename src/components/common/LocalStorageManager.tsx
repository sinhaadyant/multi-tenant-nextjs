"use client";
import React, { useEffect, useState } from 'react';
import { storage, STORAGE_KEYS, CACHE_EXPIRY } from '@/lib/localStorage';
import { Button } from '@/components/ui/button/Button';
import { Badge } from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal/index';
import toast from 'react-hot-toast';
import { Trash2, RefreshCw, Download, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

interface CacheEntry {
  key: string;
  size: number;
  expiresAt?: number;
  isExpired: boolean;
}

export const LocalStorageManager: React.FC = () => {
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const [isOpen, setIsOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageInfo = () => {
    const info = storage.getStorageInfo();
    if (info) {
      setStorageInfo({
        ...info,
        percentage: Math.round((info.used / info.total) * 100)
      });
    }
  };

  const loadCacheEntries = () => {
    const keys = storage.keys();
    const entries: CacheEntry[] = [];

    keys.forEach(key => {
      const item = storage.get(key);
      if (item) {
        const size = JSON.stringify(item).length;
        const expiresAt = item.expiresAt;
        const isExpired = expiresAt ? Date.now() > expiresAt : false;
        
        entries.push({
          key,
          size,
          expiresAt,
          isExpired
        });
      }
    });

    // Sort by size (largest first)
    entries.sort((a, b) => b.size - a.size);
    setCacheEntries(entries);
  };

  const clearExpiredCache = () => {
    confirm({
      title: 'Clear Expired Cache',
      message: 'Are you sure you want to clear all expired cache data? This will free up storage space but may temporarily impact performance.',
      confirmText: 'Clear Cache',
      variant: 'warning',
      onConfirm: () => {
        try {
          const now = Date.now();
          let clearedCount = 0;
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item.expiry && item.expiry < now) {
                  localStorage.removeItem(key);
                  clearedCount++;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
          
          toast.success(`Cleared ${clearedCount} expired cache items`);
          loadCacheEntries();
        } catch (error) {
          toast.error('Failed to clear expired cache');
        }
      },
    });
  };

  const clearAllCache = () => {
    setIsLoading(true);
    try {
      // Clear all cached data but keep user preferences
      const keys = storage.keys();
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('data') || key.includes('temp')) {
          storage.remove(key);
        }
      });
      loadCacheEntries();
      loadStorageInfo();
      toast.success('All cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = () => {
    confirm({
      title: 'Clear All Data',
      message: 'Are you sure you want to clear all localStorage data? This action cannot be undone and will remove all cached data, user preferences, and application state.',
      confirmText: 'Clear All Data',
      variant: 'danger',
      onConfirm: () => {
        try {
          localStorage.clear();
          toast.success('All localStorage data cleared successfully');
          loadCacheEntries();
          loadStorageInfo();
        } catch (error) {
          toast.error('Failed to clear localStorage data');
        }
      },
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatKey = (key: string): string => {
    // Make keys more readable
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .substring(0, 30) + (key.length > 30 ? '...' : '');
  };

  const getStorageStatusColor = (percentage: number): string => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
      loadCacheEntries();
    }
  }, [isOpen]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        Storage
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="LocalStorage Manager"
        size="lg"
      >
        <div className="space-y-6">
          {/* Storage Info */}
          {storageInfo && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Used:</span>
                  <span className="font-mono">{formatBytes(storageInfo.used)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Available:</span>
                  <span className="font-mono">{formatBytes(storageInfo.available)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total:</span>
                  <span className="font-mono">{formatBytes(storageInfo.total)}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span>Usage:</span>
                    <span>{storageInfo.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getStorageStatusColor(storageInfo.percentage) === 'success'
                          ? 'bg-green-500'
                          : getStorageStatusColor(storageInfo.percentage) === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${storageInfo.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cache Entries */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Cache Entries ({cacheEntries.length})</h3>
              <div className="flex gap-2">
                <Button
                  onClick={clearExpiredCache}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Clear Expired
                </Button>
                <Button
                  onClick={clearAllCache}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  Clear All Cache
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {cacheEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No cache entries found</p>
              ) : (
                cacheEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate">
                          {formatKey(entry.key)}
                        </span>
                        {entry.isExpired && (
                          <Badge variant="error" size="sm">
                            Expired
                          </Badge>
                        )}
                      </div>
                      {entry.expiresAt && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(entry.expiresAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-mono text-gray-600">
                      {formatBytes(entry.size)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  loadStorageInfo();
                  loadCacheEntries();
                  toast.success('Storage info refreshed');
                }}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
              <Button
                onClick={clearAllData}
                variant="error"
                size="sm"
                disabled={isLoading}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Hook for easy access to storage manager
export const useStorageManager = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openManager = () => setIsOpen(true);
  const closeManager = () => setIsOpen(false);

  return {
    isOpen,
    openManager,
    closeManager,
    LocalStorageManagerComponent: () => (
      <LocalStorageManager />
    )
  };
}; 