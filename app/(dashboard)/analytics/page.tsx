'use client';

import { Card, Badge, Button, Select } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';
type MetricType = 'relationships' | 'time_investment';

interface ActivityMetric {
  type: string;
  count: number;
  trend: number;
  target: number;
}

interface ConversionMetric {
  stage: string;
  count: number;
  rate: number;
}

interface PerformanceData {
  seller: string;
  calls: number;
  meetings: number;
  proposals: number;
  deals: number;
  winRate: number;
}

interface RelationshipActivityMetrics {
  summary: {
    totalActionsInPeriod: number;
    relationshipsNeedingAttention: number;
    avgActionsPerRelationship: number;
    totalTrackedRelationships: number;
  };
  topActiveRelationships: any[];
  allRelationships: any[];
}

interface DailyTimeInvestment {
  dailyData: Array<{
    date: string;
    minutes: number;
    hours: number;
  }>;
  summary: {
    totalMinutes: number;
    totalHours: number;
    avgMinutesPerDay: number;
    avgHoursPerDay: number;
    daysWithActivity: number;
    totalCompletedTasks: number;
  };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [activeMetric, setActiveMetric] = useState<MetricType>('relationships');
  const [loading, setLoading] = useState(true);
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetric[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [relationshipActivityMetrics, setRelationshipActivityMetrics] = useState<RelationshipActivityMetrics | null>(null);
  const [dailyTimeInvestment, setDailyTimeInvestment] = useState<DailyTimeInvestment | null>(null);

  // Fetch real analytics data
  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics?userId=${user.id}&timePeriod=${timePeriod}`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setActivityMetrics(data.activityMetrics || []);
        setConversionFunnel(data.conversionFunnel || []);
        setPerformanceData(data.performanceData || []);
        setRelationshipActivityMetrics(data.relationshipActivityMetrics || null);
        setDailyTimeInvestment(data.dailyTimeInvestment || null);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, timePeriod]);

  const getPeriodLabel = () => {
    const labels = {
      week: 'Questa Settimana',
      month: 'Questo Mese',
      quarter: 'Questo Trimestre',
      year: 'Quest\'Anno',
    };
    return labels[timePeriod];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  const totalActivities = activityMetrics.reduce((sum, metric) => sum + metric.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Analisi dettagliata delle tue performance</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            fullWidth={false}
          >
            <option value="week">Settimana</option>
            <option value="month">Mese</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Anno</option>
          </Select>
          <Button>📊 Esporta Report</Button>
        </div>
      </div>

      {/* Metric Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveMetric('relationships')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeMetric === 'relationships'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Attività Relazioni
        </button>
        <button
          onClick={() => setActiveMetric('time_investment')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeMetric === 'time_investment'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tempo Investito
        </button>
      </div>

      {/* Relationship Activities */}
      {activeMetric === 'relationships' && relationshipActivityMetrics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding={false} className="p-4 bg-blue-50">
              <div className="text-sm text-gray-600">Azioni Completate</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {relationshipActivityMetrics.summary.totalActionsInPeriod}
              </div>
              <div className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</div>
            </Card>
            <Card padding={false} className="p-4 bg-yellow-50">
              <div className="text-sm text-gray-600">Relazioni Tracciate</div>
              <div className="text-3xl font-bold text-warning mt-2">
                {relationshipActivityMetrics.summary.totalTrackedRelationships}
              </div>
              <div className="text-sm text-gray-600 mt-1">Nel periodo</div>
            </Card>
            <Card padding={false} className="p-4 bg-red-50">
              <div className="text-sm text-gray-600">Necessitano Attenzione</div>
              <div className="text-3xl font-bold text-danger mt-2">
                {relationshipActivityMetrics.summary.relationshipsNeedingAttention}
              </div>
              <div className="text-sm text-gray-600 mt-1">{'>'} 30 giorni o weak/prospective</div>
            </Card>
            <Card padding={false} className="p-4 bg-green-50">
              <div className="text-sm text-gray-600">Media Azioni</div>
              <div className="text-3xl font-bold text-success mt-2">
                {relationshipActivityMetrics.summary.avgActionsPerRelationship}
              </div>
              <div className="text-sm text-gray-600 mt-1">Per relazione</div>
            </Card>
          </div>

          {/* Top Active Relationships */}
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top 10 Relazioni Più Attive - {getPeriodLabel()}
              </h3>
            </div>
            {relationshipActivityMetrics.topActiveRelationships.length > 0 ? (
              <div className="space-y-3">
                {relationshipActivityMetrics.topActiveRelationships.map((rel, idx) => (
                  <div key={rel.relationshipId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{rel.name}</div>
                        <div className="text-sm text-gray-600">{rel.company} • {rel.role || 'N/A'}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge size="sm" variant={
                            rel.strength === 'strong' ? 'success' :
                            rel.strength === 'active' ? 'primary' :
                            rel.strength === 'developing' ? 'warning' :
                            'gray'
                          }>
                            {rel.strength}
                          </Badge>
                          <Badge size="sm" variant="gray">{rel.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{rel.actionsInPeriod}</div>
                      <div className="text-xs text-gray-600">azioni nel periodo</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rel.daysSinceLastContact} giorni dall'ultimo contatto
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nessuna attività registrata nel periodo selezionato
              </div>
            )}
          </Card>

          {/* All Relationships - Needs Attention */}
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Relazioni che Necessitano Attenzione
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Relazioni non contattate da {'>'} 30 giorni o con stato weak/prospective
              </p>
            </div>
            {relationshipActivityMetrics.allRelationships.filter(r => r.needsAttention).length > 0 ? (
              <div className="space-y-2">
                {relationshipActivityMetrics.allRelationships
                  .filter(r => r.needsAttention)
                  .slice(0, 15)
                  .map((rel) => (
                  <div key={rel.relationshipId} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{rel.name}</div>
                      <div className="text-sm text-gray-600">{rel.company}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge size="sm" variant="danger">{rel.strength}</Badge>
                        {rel.nextAction && (
                          <span className="text-xs text-gray-600">Prossima azione: {rel.nextAction}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-danger">{rel.daysSinceLastContact} giorni</div>
                      <div className="text-xs text-gray-600">dall'ultimo contatto</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ottimo! Tutte le relazioni sono aggiornate.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Time Investment */}
      {activeMetric === 'time_investment' && dailyTimeInvestment && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding={false} className="p-4 bg-blue-50">
              <div className="text-sm text-gray-600">Ore Totali</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {dailyTimeInvestment.summary.totalHours}h
              </div>
              <div className="text-sm text-gray-600 mt-1">{getPeriodLabel()}</div>
            </Card>
            <Card padding={false} className="p-4 bg-green-50">
              <div className="text-sm text-gray-600">Media Giornaliera</div>
              <div className="text-3xl font-bold text-success mt-2">
                {dailyTimeInvestment.summary.avgHoursPerDay}h
              </div>
              <div className="text-sm text-gray-600 mt-1">per giorno attivo</div>
            </Card>
            <Card padding={false} className="p-4 bg-yellow-50">
              <div className="text-sm text-gray-600">Giorni Attivi</div>
              <div className="text-3xl font-bold text-warning mt-2">
                {dailyTimeInvestment.summary.daysWithActivity}
              </div>
              <div className="text-sm text-gray-600 mt-1">nel periodo</div>
            </Card>
            <Card padding={false} className="p-4 bg-purple-50">
              <div className="text-sm text-gray-600">Task Completati</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {dailyTimeInvestment.summary.totalCompletedTasks}
              </div>
              <div className="text-sm text-gray-600 mt-1">nel periodo</div>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tempo Investito Giornalmente - {getPeriodLabel()}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ore dedicate ai task completati ogni giorno
              </p>
            </div>
            {dailyTimeInvestment.dailyData.length > 0 ? (
              <div className="h-80 flex items-end justify-between gap-2">
                {dailyTimeInvestment.dailyData.map((day) => {
                  const maxHours = Math.max(...dailyTimeInvestment.dailyData.map(d => d.hours));
                  const heightPercentage = (day.hours / maxHours) * 100;
                  const dateLabel = new Date(day.date).toLocaleDateString('it-IT', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.hours}h ({day.minutes} min)
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {dateLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nessun task completato con tempo registrato nel periodo selezionato
              </div>
            )}
          </Card>

          {/* Daily Breakdown Table */}
          {dailyTimeInvestment.dailyData.length > 0 && (
            <Card>
              <div className="border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dettaglio Giornaliero</h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dailyTimeInvestment.dailyData.slice().reverse().map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {new Date(day.date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-600">{day.minutes} minuti</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{day.hours}h</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
