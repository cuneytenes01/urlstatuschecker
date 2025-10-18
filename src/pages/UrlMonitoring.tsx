import { useState, useEffect, useRef } from 'react';
import { Alert } from '../types/monitoring';
import { AddUrlForm } from '../components/AddUrlForm';
import { UrlList } from '../components/UrlList';
import { AlertsPanel } from '../components/AlertsPanel';
import { StatsCard, FilterType } from '../components/StatsCard';
import { Bell, Plus, Upload } from 'lucide-react';
import { supabase, MonitoredUrlDB } from '../lib/supabase';

export function UrlMonitoring() {
  const [urls, setUrls] = useState<MonitoredUrlDB[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();

    const urlsChannel = supabase
      .channel('monitored_urls_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monitored_urls' },
        () => {
          loadUrls();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('url_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'url_alerts' },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    const refreshInterval = setInterval(() => {
      loadUrls();
      loadAlerts();
    }, 30000);

    return () => {
      urlsChannel.unsubscribe();
      alertsChannel.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  async function loadData() {
    await Promise.all([loadUrls(), loadAlerts()]);
    setLoading(false);
  }

  async function loadUrls() {
    const { data, error } = await supabase
      .from('monitored_urls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading URLs:', error);
      setUrls([]);
      return;
    }

    setUrls(data || []);
  }

  async function loadAlerts() {
    const { data: alertsData, error } = await supabase
      .from('url_alerts')
      .select('*, monitored_urls(url, name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
      return;
    }

    const transformedAlerts: Alert[] = (alertsData || []).map((alert: any) => ({
      id: alert.id,
      urlId: alert.monitored_url_id,
      url: alert.monitored_urls?.url || '',
      name: alert.monitored_urls?.name || '',
      statusCode: alert.status_code,
      message: alert.message,
      isRead: alert.is_read,
      createdAt: new Date(alert.created_at),
      screenshotUrl: alert.screenshot_url,
      screenshotData: alert.screenshot_data,
    }));

    setAlerts(transformedAlerts);
  }

  const extractUrl = (line: string): string[] => {
    const trimmed = line.trim();
    if (!trimmed) return [];

    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = trimmed.match(urlRegex);

    return matches || [];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');

      for (const line of lines) {
        const urls = extractUrl(line);
        for (const url of urls) {
          await handleAddUrl(url, '');
        }
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkAdd = () => {
    fileInputRef.current?.click();
  };

  const handleAddUrl = async (url: string, name: string) => {
    const { data, error } = await supabase.from('monitored_urls').insert({
      url,
      name: name || null,
      check_interval_minutes: 2,
      is_active: true,
    }).select().single();

    if (error) {
      console.error('Error adding URL:', error);
      alert('Failed to add URL');
      return;
    }

    await loadUrls();

    if (data) {
      try {
        const checkResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const checkResult = await checkResponse.json();

        await supabase
          .from('monitored_urls')
          .update({
            last_status_code: checkResult.statusCode,
            last_check_at: new Date().toISOString(),
            last_response_time_ms: checkResult.responseTimeMs,
          })
          .eq('id', data.id);

        await supabase.from('url_check_history').insert({
          monitored_url_id: data.id,
          status_code: checkResult.statusCode,
          response_time_ms: checkResult.responseTimeMs,
        });

        if (checkResult.statusCode < 200 || checkResult.statusCode >= 300) {
          await supabase.from('url_alerts').insert({
            monitored_url_id: data.id,
            status_code: checkResult.statusCode,
            message: `URL returned status code ${checkResult.statusCode}`,
            screenshot_url: checkResult.screenshotUrl || null,
            response_time_ms: checkResult.responseTimeMs,
            is_read: false,
          });
        }

        await loadUrls();
        await loadAlerts();
      } catch (checkError) {
        console.error('Error checking URL immediately:', checkError);
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const url = urls.find((u) => u.id === id);
    if (!url) return;

    const { error } = await supabase
      .from('monitored_urls')
      .update({ is_active: !url.is_active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling URL:', error);
      return;
    }

    await loadUrls();
  };

  const handleRemoveUrl = async (id: string) => {
    const { error } = await supabase.from('monitored_urls').delete().eq('id', id);

    if (error) {
      console.error('Error removing URL:', error);
      return;
    }

    await loadUrls();
  };

  const handleDeleteAllUrls = async () => {
    if (!confirm('Are you sure you want to delete ALL URLs? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('monitored_urls')
      .delete()
      .gte('created_at', '1970-01-01');

    if (error) {
      console.error('Error deleting all URLs:', error);
      alert('Failed to delete all URLs');
      return;
    }

    await loadUrls();
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('url_alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking alert as read:', error);
      return;
    }

    await loadAlerts();
  };

  const handleClearAllAlerts = async () => {
    if (!confirm('Are you sure you want to clear all alerts?')) {
      return;
    }

    const { error } = await supabase
      .from('url_alerts')
      .delete()
      .gte('created_at', '1970-01-01');

    if (error) {
      console.error('Error clearing alerts:', error);
      alert('Failed to clear alerts');
      return;
    }

    await loadAlerts();
  };

  const handleDeleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('url_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting alert:', error);
      return;
    }

    await loadAlerts();
  };

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  const filteredUrls = urls.filter((url) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'healthy') {
      return url.last_status_code && url.last_status_code >= 200 && url.last_status_code < 300;
    }
    if (activeFilter === 'unhealthy') {
      return url.last_status_code && (url.last_status_code < 200 || url.last_status_code >= 300);
    }
    if (activeFilter === 'checking') {
      return !url.last_status_code;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">URL Monitoring System</h1>
          <p className="text-gray-600 mt-1">24/7 automated monitoring - works even when your computer is off</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add URL
          </button>
          <button
            onClick={handleBulkAdd}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Bulk Add
          </button>
          {urls.length > 0 && (
            <button
              onClick={handleDeleteAllUrls}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              Delete All
            </button>
          )}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <StatsCard
        urls={urls.map(u => ({
          id: u.id,
          url: u.url,
          name: u.name || '',
          checkInterval: u.check_interval_minutes,
          isActive: u.is_active,
          lastStatusCode: u.last_status_code || 0,
          lastCheckAt: u.last_check_at ? new Date(u.last_check_at) : null,
          lastResponseTime: u.last_response_time_ms || 0,
          createdAt: new Date(u.created_at),
        }))}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {showAlerts && (
        <AlertsPanel
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          onDeleteAlert={handleDeleteAlert}
          onClearAll={handleClearAllAlerts}
        />
      )}

      {showForm && (
        <AddUrlForm
          onAdd={handleAddUrl}
          showForm={showForm}
          onShowFormChange={setShowForm}
          onBulkAdd={handleBulkAdd}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
        />
      )}

      {activeFilter !== 'all' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-medium">
              Showing {activeFilter === 'healthy' ? 'Healthy' : activeFilter === 'unhealthy' ? 'Unhealthy' : 'Checking'} URLs only
            </span>
            <span className="text-blue-600 font-bold">({filteredUrls.length})</span>
          </div>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-sm text-blue-700 hover:text-blue-900 font-medium underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      <UrlList
        urls={filteredUrls}
        onToggleActive={handleToggleActive}
        onRemoveUrl={handleRemoveUrl}
      />
    </div>
  );
}
