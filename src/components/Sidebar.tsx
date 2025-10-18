import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Activity,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Search,
  BarChart3,
  TrendingUp,
  Globe,
  FileText,
  Link2,
  Target,
  Users,
  Zap,
  Shield,
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    title: 'URL Monitoring System',
    icon: <Activity className="w-5 h-5" />,
    path: '/url-monitoring',
  },
  {
    title: 'SEO Intelligence Suite',
    icon: <Search className="w-5 h-5" />,
    children: [
      {
        title: 'Keyword Research Hub',
        icon: <Target className="w-4 h-4" />,
        path: '/seo/keyword-research',
      },
      {
        title: 'Competitor Analysis',
        icon: <Users className="w-4 h-4" />,
        path: '/seo/competitor-analysis',
      },
      {
        title: 'Backlink Monitor',
        icon: <Link2 className="w-4 h-4" />,
        path: '/seo/backlink-monitor',
      },
      {
        title: 'SERP Tracker Pro',
        icon: <TrendingUp className="w-4 h-4" />,
        path: '/seo/serp-tracker',
      },
      {
        title: 'Technical SEO Audit',
        icon: <Shield className="w-4 h-4" />,
        path: '/seo/technical-audit',
      },
      {
        title: 'Content Optimizer',
        icon: <FileText className="w-4 h-4" />,
        path: '/seo/content-optimizer',
      },
      {
        title: 'Site Performance Analytics',
        icon: <Zap className="w-4 h-4" />,
        path: '/seo/performance-analytics',
      },
      {
        title: 'Local SEO Manager',
        icon: <Globe className="w-4 h-4" />,
        path: '/seo/local-seo',
      },
      {
        title: 'SEO Reports Dashboard',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/seo/reports',
      },
    ],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, username } = useAuth();

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string | undefined) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.path);

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpand(item.title)}
            className={`w-full flex items-center justify-between px-4 py-3 text-white hover:bg-slate-500/50 transition-colors ${
              level > 0 ? 'pl-8' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="bg-slate-700/50">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        to={item.path || '#'}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          level > 0 ? 'pl-8' : ''
        } ${
          active
            ? 'bg-blue-600 text-white border-r-4 border-blue-400'
            : 'text-white hover:bg-slate-500/50'
        }`}
      >
        {item.icon}
        <span className="font-medium">{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-br from-slate-600 to-slate-700 border-r border-slate-500 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-400 bg-gradient-to-br from-slate-500 to-slate-600">
            <h1 className="text-xl font-bold text-white uppercase mb-1 tracking-wide">DİGİTAL YAYINLAR</h1>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">ADMIN PANEL</h2>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="mb-4">
              <div className="px-4 mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Menu
                </h3>
                <span className="text-xs font-bold text-slate-400">YÜCETÜRK</span>
              </div>
              {menuItems.map((item) => renderMenuItem(item))}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-500 space-y-3 bg-slate-700/50">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {username || 'Admin User'}
                </p>
                <p className="text-xs text-slate-200 truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-300 hover:bg-red-600/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}
    </>
  );
}
