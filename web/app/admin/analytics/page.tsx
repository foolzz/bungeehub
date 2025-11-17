'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import axios from 'axios';

interface HubAnalytics {
  id: string;
  name: string;
  address: string;
  tier: string;
  totalDeliveries: number;
  rating: number;
  estimatedEarnings: number;
  deliverySpeed: number; // Average hours to deliver
  successRate: number; // Percentage of successful deliveries
  rankScore: number; // Overall ranking score
}

export default function AdminAnalyticsPage() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<HubAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'earnings' | 'speed' | 'rating'>('rank');
  const [totalStats, setTotalStats] = useState({
    totalHubs: 0,
    totalDeliveries: 0,
    totalEarnings: 0,
    avgRating: 0,
  });

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  useEffect(() => {
    if (analytics.length > 0) {
      sortAnalytics();
    }
  }, [sortBy]);

  const checkAdminAndFetchData = async () => {
    try {
      const profileResponse = await authApi.getProfile();
      if (profileResponse.data.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }
      await fetchHubsAndCalculateAnalytics();
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const fetchHubsAndCalculateAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('http://localhost:8080/api/v1/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const hubsData = response.data?.data || [];
      setHubs(hubsData);

      // Calculate analytics for each hub
      const calculatedAnalytics: HubAnalytics[] = hubsData.map((hub: any) => {
        const totalDeliveries = hub.totalDeliveries || 0;
        const rating = parseFloat(hub.rating) || 0;
        const estimatedEarnings = totalDeliveries * 2.5; // $2.50 per delivery

        // NOTE: Simulated delivery metrics for demonstration
        // PRODUCTION TODO: Calculate from actual package delivery timestamps
        // Expected calculation: AVG(deliveredAt - createdAt) per hub
        const deliverySpeed = Math.random() * 24 + 12; // 12-36 hours (simulated)

        // PRODUCTION TODO: Calculate from actual delivery success/failure records
        // Expected calculation: (successful_deliveries / total_attempts) * 100
        const successRate = 85 + Math.random() * 14; // 85-99% (simulated)

        // Calculate rank score (higher is better)
        // Factors: rating (40%), success rate (30%), speed (20%), deliveries (10%)
        const speedScore = Math.max(0, 100 - (deliverySpeed / 48) * 100); // Normalize to 0-100
        const rankScore =
          rating * 8 + // 0-40 points (5 stars * 8)
          successRate * 0.3 + // 0-30 points
          speedScore * 0.2 + // 0-20 points
          Math.min(totalDeliveries / 10, 10); // 0-10 points (cap at 1000 deliveries)

        return {
          id: hub.id,
          name: hub.name,
          address: hub.address,
          tier: hub.tier,
          totalDeliveries,
          rating,
          estimatedEarnings,
          deliverySpeed,
          successRate,
          rankScore,
        };
      });

      setAnalytics(calculatedAnalytics);

      // Calculate total stats
      const totalDeliveries = calculatedAnalytics.reduce((sum, h) => sum + h.totalDeliveries, 0);
      const totalEarnings = calculatedAnalytics.reduce((sum, h) => sum + h.estimatedEarnings, 0);
      const avgRating =
        calculatedAnalytics.length > 0
          ? calculatedAnalytics.reduce((sum, h) => sum + h.rating, 0) / calculatedAnalytics.length
          : 0;

      setTotalStats({
        totalHubs: calculatedAnalytics.length,
        totalDeliveries,
        totalEarnings,
        avgRating,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const sortAnalytics = () => {
    const sorted = [...analytics].sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return b.rankScore - a.rankScore;
        case 'earnings':
          return b.estimatedEarnings - a.estimatedEarnings;
        case 'speed':
          return a.deliverySpeed - b.deliverySpeed; // Lower is better
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
    setAnalytics(sorted);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { emoji: '🥇', color: 'text-yellow-600', label: '1st Place' };
    if (index === 1) return { emoji: '🥈', color: 'text-gray-400', label: '2nd Place' };
    if (index === 2) return { emoji: '🥉', color: 'text-orange-600', label: '3rd Place' };
    return { emoji: '', color: 'text-gray-600', label: `${index + 1}th` };
  };

  const getPerformanceColor = (value: number, type: 'rating' | 'speed' | 'success') => {
    if (type === 'rating') {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-blue-600';
      if (value >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'speed') {
      if (value <= 18) return 'text-green-600';
      if (value <= 24) return 'text-blue-600';
      if (value <= 30) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'success') {
      if (value >= 95) return 'text-green-600';
      if (value >= 90) return 'text-blue-600';
      if (value >= 85) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Hub Analytics & Rankings</h1>
          <a
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Admin Dashboard
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Hubs</h3>
            <p className="text-3xl font-bold text-primary-600">{totalStats.totalHubs}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Deliveries</h3>
            <p className="text-3xl font-bold text-blue-600">{totalStats.totalDeliveries.toLocaleString()}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-600">${totalStats.totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Estimated platform fees</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Avg Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">★ {totalStats.avgRating.toFixed(1)}</p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('rank')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  sortBy === 'rank'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overall Rank
              </button>
              <button
                onClick={() => setSortBy('earnings')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  sortBy === 'earnings'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Earnings
              </button>
              <button
                onClick={() => setSortBy('speed')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  sortBy === 'speed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Speed
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  sortBy === 'rating'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rating
              </button>
            </div>
          </div>
        </div>

        {/* Hub Rankings Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Hub Rankings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Rankings based on rating (40%), success rate (30%), delivery speed (20%), and volume (10%)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hub Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Speed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((hub, index) => {
                  const rankBadge = getRankBadge(index);
                  return (
                    <tr key={hub.id} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-2xl ${rankBadge.color} font-bold`}>
                            {rankBadge.emoji} {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{hub.name}</div>
                        <div className="text-xs text-gray-500">{hub.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {hub.tier?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {hub.totalDeliveries.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${hub.estimatedEarnings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPerformanceColor(hub.rating, 'rating')}`}>
                          ★ {hub.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPerformanceColor(hub.deliverySpeed, 'speed')}`}>
                          {hub.deliverySpeed.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPerformanceColor(hub.successRate, 'success')}`}>
                          {hub.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-purple-600">
                          {hub.rankScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Legend */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Performance Indicators</h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-blue-800">
            <div>
              <strong>Rating:</strong> Green (4.5+), Blue (4.0+), Yellow (3.5+), Red (&lt;3.5)
            </div>
            <div>
              <strong>Speed:</strong> Green (&lt;18h), Blue (&lt;24h), Yellow (&lt;30h), Red (30h+)
            </div>
            <div>
              <strong>Success Rate:</strong> Green (95%+), Blue (90%+), Yellow (85%+), Red (&lt;85%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
