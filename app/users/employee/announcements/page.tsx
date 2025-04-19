"use client";
import React, { useState, useEffect } from 'react';
import { FiSearch, FiAlertTriangle, FiInfo, FiBell } from 'react-icons/fi';

type Announcement = {
  _id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  urgency: 'high' | 'medium' | 'low';
  category: string;
};

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/announcements');
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = await response.json();
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  // Get unique categories for filter
  const categories = ['all', ...new Set(announcements.map(a => a.category))];

  // Filter announcements based on search and filters
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'all' || announcement.urgency === selectedUrgency;
    
    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <FiAlertTriangle className="text-red-500 dark:text-red-400" />;
      case 'medium':
        return <FiBell className="text-yellow-500 dark:text-yellow-400" />;
      case 'low':
        return <FiInfo className="text-blue-500 dark:text-blue-400" />;
      default:
        return <FiInfo className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Company Announcements</h1>
        
        {/* Filters Section */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Filter by Category */}
            <div className="flex items-center">
              <label htmlFor="category-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Announcements List */}
        <div className="space-y-6">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            // Announcements list
            <>
              {filteredAnnouncements.map((announcement, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${
                    announcement.urgency === 'high' ? 'border-l-4 border-l-red-500' : 
                    announcement.urgency === 'medium' ? 'border-l-4 border-l-yellow-500' : ''
                  }`}
                >
                  <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
                    {announcement.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {announcement.category}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                      {new Date(announcement.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">No announcements found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;