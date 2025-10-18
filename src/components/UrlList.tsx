import { MonitoredUrlDB } from '../lib/supabase';
import { CheckCircle2, XCircle, Clock, Trash2, Power, PowerOff } from 'lucide-react';

interface UrlListProps {
  urls: MonitoredUrlDB[];
  onToggleActive: (id: string) => void;
  onRemoveUrl: (id: string) => void;
}

export function UrlList({ urls, onToggleActive, onRemoveUrl }: UrlListProps) {
  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return 'text-gray-400';
    if (statusCode >= 200 && statusCode < 300) return 'text-green-700 font-bold';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600';
    return 'text-red-700 font-bold';
  };

  const getStatusIcon = (statusCode: number | null) => {
    if (!statusCode) return <Clock className="w-5 h-5" />;
    if (statusCode >= 200 && statusCode < 300) return <CheckCircle2 className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const formatTime = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('tr-TR');
  };

  if (urls.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm text-center text-gray-500">
        <p>No URLs added yet. Add your first URL to start monitoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <div
          key={url.id}
          className={`rounded-lg p-4 shadow-sm border-l-4 ${
            url.last_status_code && url.last_status_code >= 200 && url.last_status_code < 300
              ? 'bg-green-50 border-green-600 border-l-8'
              : !url.last_status_code
              ? 'bg-white border-gray-300'
              : 'bg-red-50 border-red-600 border-l-8'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={getStatusColor(url.last_status_code)}>
                  {getStatusIcon(url.last_status_code)}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {url.name || url.url}
                </h3>
                {!url.is_active && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                    Paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span>Last checked: {formatTime(url.last_check_at)}</span>
                <span className={`font-medium ${getStatusColor(url.last_status_code)}`}>
                  Status: {url.last_status_code !== null ? url.last_status_code : 'Checking...'}
                </span>
                {url.last_response_time_ms && url.last_response_time_ms > 0 && (
                  <span>Response: {url.last_response_time_ms}ms</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleActive(url.id)}
                className={`p-2 rounded-lg transition-colors ${
                  url.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={url.is_active ? 'Pause monitoring' : 'Resume monitoring'}
              >
                {url.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onRemoveUrl(url.id)}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                title="Delete URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
