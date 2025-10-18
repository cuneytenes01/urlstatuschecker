import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, AlertTriangle, Clock, Globe, Zap, Shield, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUrls: 0,
    activeUrls: 0,
    totalAlerts: 0,
    recentAlerts: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [urlsResult, alertsResult, recentAlertsResult] = await Promise.all([
      supabase.from('monitored_urls').select('id, is_active', { count: 'exact' }),
      supabase.from('url_alerts').select('id', { count: 'exact' }),
      supabase
        .from('url_alerts')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const activeUrls = urlsResult.data?.filter(u => u.is_active).length || 0;

    setStats({
      totalUrls: urlsResult.count || 0,
      activeUrls,
      totalAlerts: alertsResult.count || 0,
      recentAlerts: recentAlertsResult.count || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -m-6 lg:-m-8 p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                Control Center
              </h1>
              <p className="text-slate-400">Real-time monitoring dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                  Total
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.totalUrls}</h3>
              <p className="text-slate-400 text-sm font-medium">Monitored URLs</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.activeUrls}</h3>
              <p className="text-slate-400 text-sm font-medium">Active Monitoring</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                  24h
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.recentAlerts}</h3>
              <p className="text-slate-400 text-sm font-medium">Recent Alerts</p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                  All Time
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{stats.totalAlerts}</h3>
              <p className="text-slate-400 text-sm font-medium">Total Alerts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => navigate('/url-monitoring')}
            className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 border border-blue-500/50 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-white mb-2">URL Monitoring</h3>
                <p className="text-blue-100">Manage and monitor your URLs in real-time</p>
              </div>
              <div className="text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600 transition-all duration-300">
            <div className="relative flex items-center gap-6">
              <div className="p-4 bg-slate-700/50 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-10 h-10 text-slate-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Analytics</h3>
                <p className="text-slate-400">Advanced insights and reports</p>
                <span className="inline-block mt-2 text-xs font-semibold text-slate-500 bg-slate-700/50 px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">24/7 Automated Monitoring</h3>
              <p className="text-slate-400 leading-relaxed">
                Your URLs are continuously monitored around the clock. Our system automatically checks each URL
                at configured intervals and instantly alerts you of any issues, even when your computer is off.
                All monitoring happens in the cloud with full reliability and uptime.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-300">System Status</span>
            </div>
            <p className="text-2xl font-bold text-white">Operational</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-300">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-white">99.9%</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-slate-300">Response Time</span>
            </div>
            <p className="text-2xl font-bold text-white">&lt;2s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
