import { useEffect, useState } from 'react';

// Debug component untuk tracking console logs di PWA
// Gunakan untuk debug issue di mobile tanpa devtools

interface LogEntry {
  id: number;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export const DebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const addLog = (type: 'log' | 'warn' | 'error' | 'info', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev.slice(-99), {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    };

    console.log = (...args) => {
      addLog('log', args);
      originalLog(...args);
    };

    console.warn = (...args) => {
      addLog('warn', args);
      originalWarn(...args);
    };

    console.error = (...args) => {
      addLog('error', args);
      originalError(...args);
    };

    console.info = (...args) => {
      addLog('info', args);
      originalInfo(...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  const clearLogs = () => setLogs([]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-300 bg-gray-900/20';
    }
  };

  return (
    <>
      {/* Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-primary/80 backdrop-blur rounded-full text-white shadow-lg touch-manipulation"
        aria-label="Toggle debug console"
      >
        {isOpen ? '✕' : '🐛'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[9998] bg-black/95 backdrop-blur-lg border-t border-border max-h-[60vh] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-semibold text-white">Debug Console</span>
            <div className="flex gap-2">
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded text-white touch-manipulation"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-xs bg-primary hover:bg-primary/80 rounded text-white touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-4">No logs yet</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded ${getLogColor(log.type)}`}
                >
                  <span className="text-muted-foreground mr-2">[{log.timestamp}]</span>
                  <span className="font-semibold mr-2">[{log.type.toUpperCase()}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
