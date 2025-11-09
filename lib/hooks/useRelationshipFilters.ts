import { useState, useMemo } from 'react';
import { Relationship } from '@/lib/types';

export function useRelationshipFilters(relationships: Relationship[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'lastContact' | 'importance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedRelationships = useMemo(() => {
    let filtered = relationships.filter((rel) => {
      const matchesSearch =
        rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStrength = filterStrength === 'all' || rel.strength === filterStrength;
      const matchesImportance = filterImportance === 'all' || rel.importance === filterImportance;

      return matchesSearch && matchesStrength && matchesImportance;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'lastContact':
          comparison = (a.lastContact?.toMillis() || 0) - (b.lastContact?.toMillis() || 0);
          break;
        case 'importance':
          const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (importanceOrder[a.importance] || 0) - (importanceOrder[b.importance] || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [relationships, searchTerm, filterStrength, filterImportance, sortBy, sortOrder]);

  return {
    searchTerm,
    setSearchTerm,
    filterStrength,
    setFilterStrength,
    filterImportance,
    setFilterImportance,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredRelationships: filteredAndSortedRelationships,
  };
}
