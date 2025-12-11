import { useState, useMemo, useCallback } from 'react';
import { type Relationship } from '@/lib/hooks/useRelationships';

// Tipi per i preset smart
export type SmartPreset = 'none' | 'da_contattare' | 'da_coltivare' | 'vip' | 'in_attesa';

export interface SmartPresetConfig {
  id: SmartPreset;
  label: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SMART_PRESETS: SmartPresetConfig[] = [
  {
    id: 'da_contattare',
    label: 'Da Contattare',
    icon: '📞',
    description: 'Non li senti da tempo',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    borderColor: 'border-orange-300',
  },
  {
    id: 'da_coltivare',
    label: 'Da Coltivare',
    icon: '🌱',
    description: 'Relazioni da far crescere',
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-300',
  },
  {
    id: 'vip',
    label: 'VIP',
    icon: '⭐',
    description: 'I tuoi contatti top',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  {
    id: 'in_attesa',
    label: 'Devo Ricevere Valore',
    icon: '⬇️',
    description: 'Relazioni dove devo ricevere',
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-300',
  },
];

export function useRelationshipFilters(relationships: Relationship[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'role' | 'lastContact' | 'lastAction' | 'importance' | 'strength' | 'category'>('importance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<SmartPreset>('none');

  // Helper per ottenere l'ultima azione
  const getLastActionTime = (rel: Relationship): number => {
    if (rel.actionsHistory && rel.actionsHistory.length > 0) {
      return new Date(rel.actionsHistory[rel.actionsHistory.length - 1].completedAt).getTime();
    }
    // Se non ci sono azioni, usa lastContact o data molto vecchia
    return rel.lastContact ? new Date(rel.lastContact).getTime() : 0;
  };

  const filteredAndSortedRelationships = useMemo(() => {
    const importanceOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const strengthOrder: Record<string, number> = { strong: 5, active: 4, developing: 3, weak: 2, prospective: 1 };

    // Prima applica filtri standard (search, strength, importance, city)
    let filtered = relationships.filter((rel) => {
      const matchesSearch =
        rel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rel.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStrength = filterStrength === 'all' || rel.strength === filterStrength;
      const matchesImportance = filterImportance === 'all' || rel.importance === filterImportance;

      const matchesCity = filterCity === 'all' ||
        (rel.cities && rel.cities.some(city => city.toLowerCase() === filterCity.toLowerCase()));

      return matchesSearch && matchesStrength && matchesImportance && matchesCity;
    });

    // Se c'è un preset attivo, applica filtro e ordinamento specifico
    if (activePreset !== 'none') {
      switch (activePreset) {
        case 'da_contattare':
          // Tutte le relazioni, ordinate per ultimo contatto più lontano
          filtered = [...filtered].sort((a, b) => {
            // Ordina per ultimo contatto (più vecchio prima = da contattare prima)
            const aTime = a.lastContact ? new Date(a.lastContact).getTime() : 0;
            const bTime = b.lastContact ? new Date(b.lastContact).getTime() : 0;
            return aTime - bTime;
          });
          break;

        case 'da_coltivare':
          // Relazioni in fase iniziale (developing/weak/prospective) o dove devo dare valore
          // Ordinate per importanza + forza relazione (più deboli prima)
          filtered = filtered.filter((rel) => {
            const isEarlyStage = ['developing', 'weak', 'prospective'].includes(rel.strength);
            const needsGiving = rel.valueBalance === 'do_give_more' || rel.valueBalance === 'do_receive_more';
            return isEarlyStage || needsGiving;
          });

          filtered = [...filtered].sort((a, b) => {
            // Prima ordina per importanza (più importante prima)
            const impDiff = (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
            if (impDiff !== 0) return impDiff;

            // Poi per forza (più deboli prima, hanno più bisogno di coltivazione)
            return (strengthOrder[a.strength] || 0) - (strengthOrder[b.strength] || 0);
          });
          break;

        case 'vip':
          // Solo relazioni critical/high importance che sono strong/active
          filtered = filtered.filter((rel) => {
            const isImportant = ['critical', 'high'].includes(rel.importance);
            const isStrong = ['strong', 'active'].includes(rel.strength);
            return isImportant && isStrong;
          });

          filtered = [...filtered].sort((a, b) => {
            // Ordina per importanza (critical prima di high)
            const impDiff = (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
            if (impDiff !== 0) return impDiff;

            // Poi per forza (strong prima di active)
            return (strengthOrder[b.strength] || 0) - (strengthOrder[a.strength] || 0);
          });
          break;

        case 'in_attesa':
          // Relazioni dove devo ricevere valore
          filtered = filtered.filter((rel) => rel.valueBalance === 'do_receive_more');

          filtered = [...filtered].sort((a, b) => {
            // Ordina per importanza (più importante prima - urgente ricambiare)
            const impDiff = (importanceOrder[b.importance] || 0) - (importanceOrder[a.importance] || 0);
            if (impDiff !== 0) return impDiff;

            // Poi per forza relazione (relazioni forti prima - non vogliamo perderle)
            return (strengthOrder[b.strength] || 0) - (strengthOrder[a.strength] || 0);
          });
          break;
      }

      return filtered;
    }

    // Sorting standard - Create a copy to avoid mutating the original array
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
          comparison = (strengthOrder[a.strength] || 0) - (strengthOrder[b.strength] || 0);
          break;
        case 'category':
          const categoryOrder: Record<string, number> = {
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
  }, [relationships, searchTerm, filterStrength, filterImportance, filterCity, sortBy, sortOrder, activePreset]);

  // Get unique cities for filter dropdown
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    relationships.forEach(rel => {
      if (rel.cities) {
        rel.cities.forEach(city => {
          if (city.trim()) {
            cities.add(city.trim());
          }
        });
      }
    });
    return Array.from(cities).sort();
  }, [relationships]);

  // Calcola conteggi per ogni preset (per mostrare badge con numeri)
  const presetCounts = useMemo(() => {
    const counts: Record<SmartPreset, number> = {
      none: relationships.length,
      da_contattare: relationships.length, // Tutte, ma ordinate diversamente
      da_coltivare: relationships.filter((rel) => {
        const isEarlyStage = ['developing', 'weak', 'prospective'].includes(rel.strength);
        const needsGiving = rel.valueBalance === 'do_give_more' || rel.valueBalance === 'do_receive_more';
        return isEarlyStage || needsGiving;
      }).length,
      vip: relationships.filter((rel) => {
        const isImportant = ['critical', 'high'].includes(rel.importance);
        const isStrong = ['strong', 'active'].includes(rel.strength);
        return isImportant && isStrong;
      }).length,
      in_attesa: relationships.filter((rel) => rel.valueBalance === 'do_receive_more').length,
    };
    return counts;
  }, [relationships]);

  // Funzione per resettare filtri quando si attiva un preset
  const activatePreset = useCallback((preset: SmartPreset) => {
    if (preset === activePreset) {
      // Se clicchi lo stesso preset, disattivalo
      setActivePreset('none');
    } else {
      setActivePreset(preset);
      // Resetta filtri standard quando attivi un preset
      setFilterStrength('all');
      setFilterImportance('all');
      setFilterCity('all');
    }
  }, [activePreset]);

  // Quando si cambia un filtro standard, disattiva il preset
  const handleSetFilterStrength = useCallback((value: string) => {
    setFilterStrength(value);
    if (value !== 'all') setActivePreset('none');
  }, []);

  const handleSetFilterImportance = useCallback((value: string) => {
    setFilterImportance(value);
    if (value !== 'all') setActivePreset('none');
  }, []);

  const handleSetFilterCity = useCallback((value: string) => {
    setFilterCity(value);
    if (value !== 'all') setActivePreset('none');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filterStrength,
    setFilterStrength: handleSetFilterStrength,
    filterImportance,
    setFilterImportance: handleSetFilterImportance,
    filterCity,
    setFilterCity: handleSetFilterCity,
    availableCities,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredRelationships: filteredAndSortedRelationships,
    // Preset smart
    activePreset,
    activatePreset,
    presetCounts,
    smartPresets: SMART_PRESETS,
  };
}
