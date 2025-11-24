import { useState, useMemo } from 'react';
import { type Relationship } from '@/lib/hooks/useRelationships';

export function useRelationshipFilters(relationships: Relationship[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'role' | 'lastContact' | 'lastAction' | 'importance' | 'strength' | 'category'>('importance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

    // Sorting - Create a copy to avoid mutating the original array
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '');
          break;
        case 'lastContact':
          comparison = new Date(a.lastContact || 0).getTime() - new Date(b.lastContact || 0).getTime();
          break;
        case 'lastAction':
          // Sort by most recent action in actionsHistory
          const aLastAction = a.actionsHistory && a.actionsHistory.length > 0
            ? new Date(a.actionsHistory[a.actionsHistory.length - 1].completedAt).getTime()
            : 0;
          const bLastAction = b.actionsHistory && b.actionsHistory.length > 0
            ? new Date(b.actionsHistory[b.actionsHistory.length - 1].completedAt).getTime()
            : 0;
          comparison = aLastAction - bLastAction;
          break;
        case 'importance':
          const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (importanceOrder[a.importance] || 0) - (importanceOrder[b.importance] || 0);

          // Secondary sort by last action (older actions first) when importance is the same
          if (comparison === 0) {
            const aLastAction = a.actionsHistory && a.actionsHistory.length > 0
              ? new Date(a.actionsHistory[a.actionsHistory.length - 1].completedAt).getTime()
              : 0;
            const bLastAction = b.actionsHistory && b.actionsHistory.length > 0
              ? new Date(b.actionsHistory[b.actionsHistory.length - 1].completedAt).getTime()
              : 0;
            comparison = aLastAction - bLastAction;
          }
          break;
        case 'strength':
          const strengthOrder = { strong: 5, active: 4, developing: 3, weak: 2, prospective: 1 };
          comparison = (strengthOrder[a.strength] || 0) - (strengthOrder[b.strength] || 0);
          break;
        case 'category':
          const categoryOrder = {
            decision_maker: 6,
            champion: 5,
            influencer: 4,
            advisor: 3,
            connector: 2,
            gatekeeper: 1
          };
          comparison = (categoryOrder[a.category] || 0) - (categoryOrder[b.category] || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
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
