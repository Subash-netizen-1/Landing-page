import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { formatCurrency } from '../utils/helpers';
import { 
  FiCalendar, 
  FiUsers, 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiTrendingUp,
  FiCreditCard
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    totalAttendees: 0,
    registeredUsers: 0,
    revenue: 0,
    pendingPayments: 0
  });

  const [chartsData, setChartsData] = useState({
    monthlyEvents: [],
    monthlyRevenue: [],
    categoryDistribution: [],
    attendanceTrends: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [
          { data: events }, 
          { data: categories }, 
          { data: attendees }, 
          { data: registrations }, 
          { data: payments }
        ] = await Promise.all([
          dataService.getEvents(),
          dataService.getCategories(),
          dataService.getAttendees(),
          dataService.getRegistrations(),
          dataService.getPayments()
        ]);

        if (events && registrations && payments && attendees) {
          const nowStr = new Date().toISOString().slice(0, 10);
          
          // 1. Calculate Metrics
          const totalEv = events.length;
          const upcomingEv = events.filter(e => e.start_date > nowStr && e.status !== 'Cancelled').length;
          const completedEv = events.filter(e => e.start_date <= nowStr && e.status !== 'Cancelled').length;
          const cancelledEv = events.filter(e => e.status === 'Cancelled').length;
          
          const totalRegs = registrations.length;
          const totalAtts = attendees.length;
          
          const totalRev = payments
            .filter(p => p.payment_status === 'Paid')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);
          
          const pendingRev = payments
            .filter(p => p.payment_status === 'Pending')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

          setMetrics({
            totalEvents: totalEv,
            upcomingEvents: upcomingEv,
            completedEvents: completedEv,
            cancelledEvents: cancelledEv,
            totalAttendees: totalRegs, // registrations represent total event attendees
            registeredUsers: totalAtts, // unique attendees
            revenue: totalRev,
            pendingPayments: pendingRev
          });

          // 2. Generate Chart Data
          // Monthly Events & Revenue
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyEvMap = {};
          const monthlyRevMap = {};
          
          // Seed maps
          months.forEach(m => {
            monthlyEvMap[m] = 0;
            monthlyRevMap[m] = 0;
          });

          events.forEach(e => {
            if (e.start_date) {
              const monthIndex = new Date(e.start_date).getMonth();
              const m = months[monthIndex];
              monthlyEvMap[m] = (monthlyEvMap[m] || 0) + 1;
            }
          });

          payments.forEach(p => {
            if (p.payment_status === 'Paid' && p.created_at) {
              const monthIndex = new Date(p.created_at).getMonth();
              const m = months[monthIndex];
              monthlyRevMap[m] = (monthlyRevMap[m] || 0) + parseFloat(p.amount);
            }
          });

          const monthlyEventsChart = months.map(m => ({ name: m, Events: monthlyEvMap[m] }));
          const monthlyRevenueChart = months.map(m => ({ name: m, Revenue: monthlyRevMap[m] }));

          // Category distribution
          const catMap = {};
          events.forEach(e => {
            const catName = e.category?.name || 'Other';
            catMap[catName] = (catMap[catName] || 0) + 1;
          });
          const categoryDistributionChart = Object.keys(catMap).map(key => ({
            name: key,
            value: catMap[key]
          }));

          // Attendance trends (registrations over time by registration date)
          const trendMap = {};
          registrations.forEach(r => {
            const date = new Date(r.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            trendMap[date] = (trendMap[date] || 0) + 1;
          });
          const attendanceTrendsChart = Object.keys(trendMap)
            .map(key => ({ date: key, Registrations: trendMap[key] }))
            // Simple sorting by date string parsing if needed
            .slice(-10); // Take last 10 active dates

          setChartsData({
            monthlyEvents: monthlyEventsChart,
            monthlyRevenue: monthlyRevenueChart,
            categoryDistribution: categoryDistributionChart.length ? categoryDistributionChart : [{ name: 'None', value: 1 }],
            attendanceTrends: attendanceTrendsChart
          });
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

  const metricCards = [
    { title: 'Total Events', value: metrics.totalEvents, icon: FiCalendar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { title: 'Upcoming Events', value: metrics.upcomingEvents, icon: FiClock, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400' },
    { title: 'Completed Events', value: metrics.completedEvents, icon: FiCheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-950/40 dark:text-green-400' },
    { title: 'Cancelled Events', value: metrics.cancelledEvents, icon: FiAlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400' },
    { title: 'Total Attendees', value: metrics.totalAttendees, icon: FiUsers, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
    { title: 'Registered Users', value: metrics.registeredUsers, icon: FiTrendingUp, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400' },
    { title: 'Total Revenue', value: formatCurrency(metrics.revenue), icon: FiDollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { title: 'Pending Payments', value: formatCurrency(metrics.pendingPayments), icon: FiCreditCard, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-850 animate-pulse"></div>
          <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-850 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display text-left">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-left">
          Quick metrics summary and platform event trends.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200"
            >
              <div className={`p-3.5 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {card.title}
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white mt-1 leading-none">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-left font-display">
            Monthly Revenue Trend (USD)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Events Created */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-left font-display">
            Monthly Events Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.monthlyEvents} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" className="hidden dark:block" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="Events" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Growth Trends */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-left font-display">
            Recent Registration Activity (Last 10 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" className="hidden dark:block" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Registrations" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRegistrations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Categories Pie Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-left font-display">
            Event Category Distribution
          </h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-1/2 h-full min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartsData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto w-full sm:w-1/2 px-2 text-left">
              {chartsData.categoryDistribution.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{entry.name}:</span>
                  <span className="text-gray-500 dark:text-gray-400 font-mono">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
