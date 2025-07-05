import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SearchResult, ApiResponse } from '@openclass/shared';

export const useSearch = (query: string, type: 'all' | 'posts' | 'classrooms' = 'all') => {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SearchResult>>('/search', {
        params: { q: query, type },
      });
      return response.data;
    },
    enabled: !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};