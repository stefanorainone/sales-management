import { type Relationship } from '@/lib/hooks/useRelationships';
import { Timestamp } from 'firebase/firestore';

export const exportToCSV = (relationships: Relationship[]) => {
  const headers = [
    'Nome',
    'Azienda',
    'Ruolo',
    'Forza Relazione',
    'Importanza',
    'Categoria',
    'Bilancio Valore',
    'Prossima Azione',
    'Benefici Reciproci',
    'Ultimo Contatto',
  ];

  const rows = relationships.map((rel) => [
    rel.name,
    rel.company,
    rel.role || '',
    rel.strength,
    rel.importance,
    rel.category || '',
    rel.valueBalance || '',
    rel.nextAction || '',
    (rel.mutualBenefits || []).join('; '),
    rel.lastContact
      ? new Date(rel.lastContact).toLocaleDateString('it-IT')
      : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `relazioni_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (relationships: Relationship[]) => {
  const data = relationships.map((rel) => ({
    ...rel,
    // lastContact and createdAt are already ISO strings, no conversion needed
  }));

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `relazioni_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSVImport = (csvText: string): Partial<Relationship>[] => {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // Simple CSV parser (handles quoted fields)
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const [
      name,
      company,
      role,
      strength,
      importance,
      category,
      valueBalance,
      nextAction,
      benefitsStr,
    ] = fields.map((f) => f.replace(/^"|"$/g, '').replace(/""/g, '"'));

    return {
      name,
      company,
      role,
      strength: strength as any,
      importance: importance as any,
      category: category as any,
      valueBalance: valueBalance as any,
      nextAction,
      mutualBenefits: benefitsStr ? benefitsStr.split(';').map((b) => b.trim()) : [],
    };
  });
};

export const parseJSONImport = (jsonText: string): Partial<Relationship>[] => {
  try {
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      name: item.name,
      company: item.company,
      role: item.role,
      strength: item.strength,
      importance: item.importance,
      category: item.category,
      valueBalance: item.valueBalance,
      nextAction: item.nextAction,
      mutualBenefits: item.mutualBenefits || [],
    }));
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
};
