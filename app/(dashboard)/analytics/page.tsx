'use client';

import { Card, Badge, Button, Select } from '@/components/ui';
import { useState } from 'react';

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

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [activeMetric, setActiveMetric] = useState<MetricType>('activities');

  // Mock data for activities
  const activityMetrics: ActivityMetric[] = [
    { type: 'Chiamate', count: 127, trend: 12, target: 150 },
    { type: 'Email', count: 89, trend: -5, target: 100 },
    { type: 'Meeting', count: 34, trend: 8, target: 30 },
    { type: 'Demo', count: 12, trend: 20, target: 15 },
    { type: 'Proposte Inviate', count: 18, trend: 15, target: 20 },
    { type: 'Contratti Firmati', count: 8, trend: 33, target: 10 },
  ];

  // Mock data for conversion funnel
  const conversionFunnel: ConversionMetric[] = [
    { stage: 'Lead Acquisiti', count: 156, rate: 100 },
    { stage: 'Qualified', count: 89, rate: 57 },
    { stage: 'Proposal Sent', count: 34, rate: 38 },
    { stage: 'Negotiation', count: 18, rate: 53 },
    { stage: 'Won', count: 8, rate: 44 },
  ];

  // Mock data for performance comparison
  const performanceData = [
    { seller: 'Tu (Mario)', calls: 127, meetings: 34, proposals: 18, deals: 8, winRate: 44 },
    { seller: 'Luca Bianchi', calls: 145, meetings: 42, proposals: 25, deals: 15, winRate: 60 },
    { seller: 'Sara Verdi', calls: 98, meetings: 28, proposals: 15, deals: 9, winRate: 60 },
    { seller: 'Media Team', calls: 123, meetings: 35, proposals: 19, deals: 11, winRate: 55 },
  ];

  const getPeriodLabel = () => {
    const labels = {
      week: 'Questa Settimana',
      month: 'Questo Mese',
      quarter: 'Questo Trimestre',
      year: 'Quest\'Anno',
    };
    return labels[timePeriod];
  };

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
                  <div className="text-5xl font-bold text-gray-900">296</div>
                  <div className="text-sm text-gray-600 mt-2">Attività Totali</div>
                  <div className="text-sm text-success mt-1">+15% vs mese scorso</div>
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
              <div className="text-3xl font-bold text-success mt-2">44%</div>
              <div className="text-sm text-gray-600 mt-1">Da Proposal a Won</div>
            </Card>
            <Card padding={false} className="p-4 bg-blue-50">
              <div className="text-sm text-gray-600">Qualification Rate</div>
              <div className="text-3xl font-bold text-primary mt-2">57%</div>
              <div className="text-sm text-gray-600 mt-1">Da Lead a Qualified</div>
            </Card>
            <Card padding={false} className="p-4 bg-yellow-50">
              <div className="text-sm text-gray-600">Tempo Medio Closure</div>
              <div className="text-3xl font-bold text-warning mt-2">18gg</div>
              <div className="text-sm text-gray-600 mt-1">Da Lead a Won</div>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Insights AI</h3>
                <div className="space-y-2 mt-3">
                  <p className="text-sm text-gray-700">
                    <strong>💡 Opportunità:</strong> Il tuo tasso di conversione da Qualified a Proposal (38%) è sotto la media del team (45%). L'AI suggerisce di migliorare il timing dei follow-up dopo la qualifica.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>✅ Punto di Forza:</strong> Ottimo win rate da Proposal a Won (53%)! Continua con le tecniche di negoziazione che stai usando.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>📈 Raccomandazione:</strong> Aumenta del 20% le attività di qualification per portare più lead nella fase Proposal.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Performance Comparison */}
      {activeMetric === 'performance' && (
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Comparazione Team - {getPeriodLabel()}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-gray-900">Seller</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Chiamate</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Meeting</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Proposte</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Deals Chiusi</th>
                    <th className="pb-3 font-semibold text-gray-900 text-center">Win Rate</th>
                    <th className="pb-3 font-semibold text-gray-900"></th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((seller, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 ${
                        seller.seller.includes('Tu') ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-3 font-medium text-gray-900">
                        {seller.seller}
                        {seller.seller.includes('Tu') && (
                          <Badge variant="primary" size="sm" className="ml-2">You</Badge>
                        )}
                      </td>
                      <td className="py-3 text-center text-gray-900">{seller.calls}</td>
                      <td className="py-3 text-center text-gray-900">{seller.meetings}</td>
                      <td className="py-3 text-center text-gray-900">{seller.proposals}</td>
                      <td className="py-3 text-center">
                        <span className="font-bold text-success">{seller.deals}</span>
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={seller.winRate >= 55 ? 'success' : seller.winRate >= 45 ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {seller.winRate}%
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        {seller.seller !== 'Media Team' && (
                          <Button size="sm" variant="ghost">Dettagli</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Your Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">La Tua Posizione</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ranking Team</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">🥈</span>
                    <span className="text-2xl font-bold text-gray-900">2° / 3</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Deals sopra media</span>
                  <Badge variant="danger" size="sm">-3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Win Rate vs Media</span>
                  <Badge variant="danger" size="sm">-11%</Badge>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>🎯 Per raggiungere il 1°:</strong> Chiudi 4 deals in più rispetto a Luca entro fine mese
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confronto vs Media Team</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attività (vs 123)</span>
                    <span className="font-medium text-success">+4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: '103%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Meeting (vs 35)</span>
                    <span className="font-medium text-danger">-1</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-danger h-2 rounded-full" style={{ width: '97%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Proposte (vs 19)</span>
                    <span className="font-medium text-danger">-1</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-danger h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Deals (vs 11)</span>
                    <span className="font-medium text-danger">-3</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-danger h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
