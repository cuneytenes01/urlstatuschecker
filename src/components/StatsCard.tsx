import { MonitoredUrl } from '../types/monitoring';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

export type FilterType = 'all' | 'healthy' | 'unhealthy' | 'checking';

interface StatsCardProps {
  urls: MonitoredUrl[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function StatsCard({ urls, activeFilter, onFilterChange }: StatsCardProps) {
  const totalUrls = urls.length;
  const activeUrls = urls.filter((u) => u.isActive).length;
  const healthyUrls = urls.filter(
    (u) => u.lastStatusCode >= 200 && u.lastStatusCode < 300
  ).length;
  const unhealthyUrls = urls.filter(
    (u) => u.lastStatusCode !== 0 && (u.lastStatusCode < 200 || u.lastStatusCode >= 300)
  ).length;
  const pendingUrls = urls.filter((u) => u.lastStatusCode === 0).length;

  const stats = [
    {
      label: 'Total URLs',
      value: totalUrls,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      filterType: 'all' as FilterType,
    },
    {
      label: 'Healthy',
      value: healthyUrls,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      filterType: 'healthy' as FilterType,
    },
    {
      label: 'Unhealthy',
      value: unhealthyUrls,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      filterType: 'unhealthy' as FilterType,
    },
    {
      label: 'Checking',
      value: pendingUrls,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      filterType: 'checking' as FilterType,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const isActive = activeFilter === stat.filterType;
        return (
          <button
            key={stat.label}
            onClick={() => onFilterChange(stat.filterType)}
            className={`bg-white rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 text-left ${
              isActive ? 'ring-2 ring-offset-2 ' + (stat.filterType === 'all' ? 'ring-blue-500' : stat.filterType === 'healthy' ? 'ring-green-500' : stat.filterType === 'unhealthy' ? 'ring-red-500' : 'ring-gray-500') : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bgColor} transition-transform ${
                isActive ? 'scale-110' : ''
              }`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            {isActive && (
              <p className="text-xs text-gray-500 mt-2 font-medium">✓ Active Filter</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
