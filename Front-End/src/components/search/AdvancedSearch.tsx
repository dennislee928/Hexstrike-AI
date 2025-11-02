'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Filter, X, Tag, Clock, Star, ChevronDown } from 'lucide-react';

export interface SearchFilters {
  category?: string;
  status?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  favorites?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  lastUsed?: Date;
  isFavorite?: boolean;
  score?: number;
}

interface AdvancedSearchProps {
  data: SearchResult[];
  onResults: (results: SearchResult[]) => void;
  placeholder?: string;
  categories?: string[];
  statuses?: string[];
  availableTags?: string[];
  className?: string;
}

// Simple fuzzy search implementation
function fuzzySearch(query: string, text: string): number {
  if (!query) return 1;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return 1;
  }
  
  // Fuzzy matching
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score++;
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length ? score / queryLower.length : 0;
}

export function AdvancedSearch({
  data,
  onResults,
  placeholder = "Search tools, commands, or descriptions...",
  categories = [],
  statuses = [],
  availableTags = [],
  className = ""
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; query: string; filters: SearchFilters }>>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Perform search with fuzzy matching and filtering
  const searchResults = useMemo(() => {
    let results = data;

    // Apply text search
    if (query.trim()) {
      results = results
        .map(item => {
          const titleScore = fuzzySearch(query, item.title) * 2; // Title matches are more important
          const descScore = fuzzySearch(query, item.description);
          const tagScore = item.tags.reduce((acc, tag) => acc + fuzzySearch(query, tag), 0) / item.tags.length;
          
          const totalScore = (titleScore + descScore + tagScore) / 3;
          
          return { ...item, score: totalScore };
        })
        .filter(item => item.score! > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(item => item.category === filters.category);
    }

    if (filters.status) {
      results = results.filter(item => item.status === filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(item => 
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    if (filters.favorites) {
      results = results.filter(item => item.isFavorite);
    }

    if (filters.dateRange) {
      results = results.filter(item => {
        if (!item.lastUsed) return false;
        return item.lastUsed >= filters.dateRange!.start && item.lastUsed <= filters.dateRange!.end;
      });
    }

    return results;
  }, [data, query, filters]);

  // Update results when search changes
  useEffect(() => {
    onResults(searchResults);
  }, [searchResults, onResults]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setQuery('');
  }, []);

  const saveSearch = useCallback(() => {
    if (!query.trim()) return;
    
    const name = prompt('Enter a name for this search:');
    if (name) {
      setSavedSearches(prev => [
        ...prev,
        { name, query, filters }
      ]);
    }
  }, [query, filters]);

  const loadSavedSearch = useCallback((savedSearch: { name: string; query: string; filters: SearchFilters }) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            data-search-input
            className="
              w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
              rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent
              text-gray-900 dark:text-gray-100 placeholder-gray-500
            "
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {(query || hasActiveFilters) && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-1 rounded transition-colors
                ${showFilters || hasActiveFilters 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }
              `}
              title="Toggle filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Search Stats */}
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            {query && ` for "${query}"`}
          </span>
          {query && (
            <button
              onClick={saveSearch}
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Save search
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {statuses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                >
                  <option value="">All statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Favorites Filter */}
            <div>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.favorites || false}
                  onChange={(e) => handleFilterChange('favorites', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <Star size={16} className="text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Favorites only</span>
              </label>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const currentTags = filters.tags || [];
                      const newTags = currentTags.includes(tag)
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag];
                      handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
                    }}
                    className={`
                      inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors
                      ${(filters.tags || []).includes(tag)
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Saved Searches</h4>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((savedSearch, index) => (
              <button
                key={index}
                onClick={() => loadSavedSearch(savedSearch)}
                className="
                  inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 
                  rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors
                "
              >
                <Clock size={12} className="mr-1" />
                {savedSearch.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}