import { useState } from 'react';
import { Alert } from '../types/monitoring';
import { AlertCircle, X, CheckCheck, Image as ImageIcon } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkAsRead: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onClearAll: () => void;
}

interface GroupedAlert {
  urlId: string;
  url: string;
  name: string;
  statusCode: number;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  isRead: boolean;
  alerts: Alert[];
}

interface ImageModalProps {
  imageUrl: string;
  url: string;
  onClose: () => void;
}

function ImageModal({ imageUrl, url, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] overflow-auto bg-white rounded-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-gray-900 text-sm">Screenshot</h3>
            <p className="text-xs text-gray-600 truncate">{url}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-800" />
          </button>
        </div>
        <div className="p-4">
          <img
            src={imageUrl}
            alt="Screenshot"
            className="max-w-full h-auto rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts, onMarkAsRead, onDeleteAlert, onClearAll }: AlertsPanelProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; imageUrl: string } | null>(null);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const groupedAlerts: GroupedAlert[] = [];
  alerts.forEach((alert) => {
    const existing = groupedAlerts.find((g) => g.urlId === alert.urlId);
    if (existing) {
      existing.count++;
      existing.lastOccurrence = alert.createdAt;
      existing.isRead = existing.isRead && alert.isRead;
      existing.alerts.push(alert);
    } else {
      groupedAlerts.push({
        urlId: alert.urlId,
        url: alert.url,
        name: alert.name,
        statusCode: alert.statusCode,
        count: 1,
        firstOccurrence: alert.createdAt,
        lastOccurrence: alert.createdAt,
        isRead: alert.isRead,
        alerts: [alert],
      });
    }
  });

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm text-center text-gray-500">
        <CheckCheck className="w-12 h-12 mx-auto mb-2 text-green-500" />
        <p>No alerts. All URLs are healthy!</p>
      </div>
    );
  }

  return (
    <>
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.imageUrl}
          url={selectedImage.url}
          onClose={() => setSelectedImage(null)}
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Alerts
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          {alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {groupedAlerts.map((group) => {
            const latestAlert = group.alerts[0];
            return (
              <div
                key={group.urlId}
                className={`p-4 ${group.isRead ? 'bg-gray-50' : 'bg-red-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900">
                        {group.name || group.url}
                      </h4>
                      {group.count > 1 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {group.count}x
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {group.count === 1
                        ? `URL returned status code ${group.statusCode}`
                        : `URL failed ${group.count} times with status code ${group.statusCode}`}
                    </p>
                    <div className="mb-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-700 break-all">
                      {group.url}
                    </div>
                    {latestAlert.screenshotData && latestAlert.screenshotData.length > 100 && (
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            const imageData = latestAlert.screenshotData
                              ? `data:image/png;base64,${latestAlert.screenshotData}`
                              : latestAlert.screenshotUrl;

                            if (!imageData) {
                              alert('Screenshot verisi bulunamadı');
                              return;
                            }

                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Screenshot - ${group.url}</title>
                                  <meta charset="utf-8">
                                  <style>
                                    body {
                                      margin: 0;
                                      padding: 20px;
                                      background: #1f2937;
                                      display: flex;
                                      flex-direction: column;
                                      justify-content: center;
                                      align-items: center;
                                      min-height: 100vh;
                                    }
                                    img {
                                      max-width: 100%;
                                      height: auto;
                                      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                                      border-radius: 8px;
                                    }
                                    .error {
                                      color: white;
                                      font-family: sans-serif;
                                      text-align: center;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <img
                                    src="${imageData}"
                                    alt="Screenshot"
                                    onerror="this.style.display='none'; document.querySelector('.error').style.display='block';"
                                  />
                                  <div class="error" style="display: none;">
                                    <p>Screenshot yüklenemedi</p>
                                    <p style="font-size: 12px; color: #9ca3af;">Görüntü verisi bozuk olabilir</p>
                                  </div>
                                </body>
                                </html>
                              `);
                              win.document.close();
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                          <ImageIcon className="w-4 h-4" />
                          View Screenshot
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="font-medium text-red-600">
                        Status: {group.statusCode}
                      </span>
                      {group.count === 1 ? (
                        <span>{new Date(group.firstOccurrence).toLocaleString('tr-TR')}</span>
                      ) : (
                        <>
                          <span>First: {new Date(group.firstOccurrence).toLocaleString('tr-TR')}</span>
                          <span>Last: {new Date(group.lastOccurrence).toLocaleString('tr-TR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      group.alerts.forEach((alert) => onDeleteAlert(alert.id));
                    }}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Delete Alert"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
