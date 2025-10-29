'use client';

import { Card, Badge, Button, Select } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';
type MetricType = 'activities' | 'conversion' | 'performance';

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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [activeMetric, setActiveMetric] = useState<MetricType>('activities');
  const [loading, setLoading] = useState(true);
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetric[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

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
          onClick={() => setActiveMetric('activities')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeMetric === 'activities'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Attività
        </button>
        <button
          onClick={() => setActiveMetric('conversion')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeMetric === 'conversion'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Conversion Funnel
        </button>
        <button
          onClick={() => setActiveMetric('performance')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeMetric === 'performance'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Performance Comparata
        </button>
      </div>

      {/* Activities Metrics */}
      {activeMetric === 'activities' && (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{getPeriodLabel()}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activityMetrics.map((metric, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{metric.type}</span>
                    <Badge
                      variant={metric.trend >= 0 ? 'success' : 'danger'}
                      size="sm"
                    >
                      {metric.trend >= 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {metric.count}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full ${
                        metric.count >= metric.target ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((metric.count / metric.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {metric.target} {metric.count >= metric.target ? '✅' : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline Chart */}
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trend Attività</h3>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, idx) => {
                const heights = [45, 62, 55, 78, 85, 40, 25];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary-600"
                      style={{ height: `${heights[idx]}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{day}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activity Breakdown */}
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Distribuzione Attività</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Chiamate</span>
                      <span className="font-medium">43%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '43%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Email</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Meeting</span>
                      <span className="font-medium">18%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Demo</span>
                      <span className="font-medium">9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '9%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{totalActivities}</div>
                  <div className="text-sm text-gray-600 mt-2">Attività Totali</div>
                  <div className="text-sm text-gray-500 mt-1">{getPeriodLabel()}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Conversion Funnel */}
      {activeMetric === 'conversion' && (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Conversion Funnel - {getPeriodLabel()}
              </h3>
            </div>
            <div className="space-y-4">
              {conversionFunnel.map((stage, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">{idx + 1}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{stage.stage}</div>
                        <div className="text-sm text-gray-600">
                          {stage.count} lead
                          {idx > 0 && (
                            <span className="ml-2">
                              • {stage.rate}% conversion dal passo precedente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{stage.count}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        idx === 0
                          ? 'bg-blue-500'
                          : idx === 1
                          ? 'bg-purple-500'
                          : idx === 2
                          ? 'bg-yellow-500'
                          : idx === 3
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${stage.rate}%` }}
                    ></div>
                  </div>
                  {idx < conversionFunnel.length - 1 && (
                    <div className="flex justify-center my-2">
                      <span className="text-gray-400">↓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Conversion Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding={false} className="p-4 bg-green-50">
              <div className="text-sm text-gray-600">Win Rate Complessivo</div>
              <div className="text-3xl font-bold text-success mt-2">
                {conversionFunnel.length > 0 && conversionFunnel[conversionFunnel.length - 1].count > 0
                  ? Math.round((conversionFunnel[conversionFunnel.length - 1].count / conversionFunnel[0].count) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Da Lead a Won</div>
            </Card>
            <Card padding={false} className="p-4 bg-blue-50">
              <div className="text-sm text-gray-600">Qualification Rate</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {conversionFunnel.length > 2 && conversionFunnel[2].rate > 0
                  ? conversionFunnel[2].rate
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Da Contacted a Qualified</div>
            </Card>
            <Card padding={false} className="p-4 bg-yellow-50">
              <div className="text-sm text-gray-600">Lead Totali</div>
              <div className="text-3xl font-bold text-warning mt-2">
                {conversionFunnel.length > 0 ? conversionFunnel[0].count : 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Nel periodo</div>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Insights</h3>
                <div className="space-y-2 mt-3">
                  {conversionFunnel.length > 0 && conversionFunnel[0].count === 0 ? (
                    <p className="text-sm text-gray-700">
                      <strong>📊 Inizia subito:</strong> Non ci sono ancora lead nel sistema. Inizia ad aggiungere prospect per vedere le tue metriche.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">
                        <strong>📊 Conversion Rate:</strong> Stai convertendo il {conversionFunnel.length > 0 && conversionFunnel[conversionFunnel.length - 1].count > 0
                          ? Math.round((conversionFunnel[conversionFunnel.length - 1].count / conversionFunnel[0].count) * 100)
                          : 0}% dei lead in clienti.
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>🎯 Focus:</strong> Hai {conversionFunnel.length > 2 ? conversionFunnel[2].count : 0} lead qualificati che necessitano attenzione.
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>📈 Attività:</strong> Hai completato {totalActivities} attività nel periodo selezionato.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Performance Summary */}
      {activeMetric === 'performance' && (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Le Tue Performance - {getPeriodLabel()}
              </h3>
            </div>
            {performanceData.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{performanceData[0].calls}</div>
                  <div className="text-sm text-gray-600 mt-2">Chiamate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{performanceData[0].meetings}</div>
                  <div className="text-sm text-gray-600 mt-2">Meeting</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{performanceData[0].proposals}</div>
                  <div className="text-sm text-gray-600 mt-2">Proposte</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">{performanceData[0].deals}</div>
                  <div className="text-sm text-gray-600 mt-2">Deals Chiusi</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{performanceData[0].winRate}%</div>
                  <div className="text-sm text-gray-600 mt-2">Win Rate</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nessun dato disponibile per il periodo selezionato
              </div>
            )}
          </Card>

          {/* Performance Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Distribuzione Attività</h3>
              </div>
              <div className="space-y-4">
                {activityMetrics.slice(0, 5).map((metric, idx) => {
                  const percentage = totalActivities > 0
                    ? Math.round((metric.count / totalActivities) * 100)
                    : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{metric.type}</span>
                        <span className="font-medium">{metric.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Obiettivi vs Risultati</h3>
              </div>
              <div className="space-y-4">
                {activityMetrics.slice(0, 5).map((metric, idx) => {
                  const percentage = metric.target > 0
                    ? Math.round((metric.count / metric.target) * 100)
                    : 0;
                  const isAboveTarget = metric.count >= metric.target;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{metric.type}</span>
                        <span className={`font-medium ${isAboveTarget ? 'text-success' : 'text-gray-900'}`}>
                          {metric.count} / {metric.target} {isAboveTarget && '✅'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isAboveTarget ? 'bg-success' : 'bg-primary'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
