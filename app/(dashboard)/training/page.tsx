'use client';

import { Card, Badge, Button, Select } from '@/components/ui';
import { useState } from 'react';

interface Course {
  id: string;
  title: string;
  category: 'sales' | 'product' | 'soft-skills' | 'tools';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  modules: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  aiRecommended?: boolean;
  certificateUrl?: string;
  description: string;
}

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Tecniche di Cold Calling Avanzate',
    category: 'sales',
    level: 'advanced',
    duration: '4h 30m',
    modules: 8,
    progress: 65,
    status: 'in-progress',
    aiRecommended: true,
    description: 'Impara le tecniche più efficaci per trasformare chiamate fredde in opportunità concrete',
  },
  {
    id: '2',
    title: 'Gestione Obiezioni del Cliente',
    category: 'sales',
    level: 'intermediate',
    duration: '3h 15m',
    modules: 6,
    progress: 100,
    status: 'completed',
    certificateUrl: '/certificates/obiezioni-2024.pdf',
    description: 'Come gestire e superare le obiezioni più comuni nel processo di vendita',
  },
  {
    id: '3',
    title: 'Product Knowledge: Suite Completa',
    category: 'product',
    level: 'beginner',
    duration: '6h 00m',
    modules: 12,
    progress: 0,
    status: 'not-started',
    aiRecommended: true,
    description: 'Conoscenza approfondita di tutti i prodotti e servizi aziendali',
  },
  {
    id: '4',
    title: 'Negoziazione Strategica',
    category: 'sales',
    level: 'advanced',
    duration: '5h 00m',
    modules: 10,
    progress: 30,
    status: 'in-progress',
    description: 'Strategie avanzate per negoziare contratti e chiudere deal importanti',
  },
  {
    id: '5',
    title: 'Emotional Intelligence nel Sales',
    category: 'soft-skills',
    level: 'intermediate',
    duration: '4h 00m',
    modules: 8,
    progress: 0,
    status: 'not-started',
    description: 'Sviluppa intelligenza emotiva per creare relazioni più forti con i clienti',
  },
  {
    id: '6',
    title: 'CRM & Sales Tools Mastery',
    category: 'tools',
    level: 'beginner',
    duration: '2h 30m',
    modules: 5,
    progress: 100,
    status: 'completed',
    certificateUrl: '/certificates/crm-tools-2024.pdf',
    description: 'Padroneggia gli strumenti di CRM e automazione per massimizzare la produttività',
  },
];

const categoryColors = {
  sales: 'bg-blue-100 text-blue-800',
  product: 'bg-purple-100 text-purple-800',
  'soft-skills': 'bg-green-100 text-green-800',
  tools: 'bg-orange-100 text-orange-800',
};

const levelBadges = {
  beginner: { variant: 'success' as const, label: 'Base' },
  intermediate: { variant: 'warning' as const, label: 'Intermedio' },
  advanced: { variant: 'danger' as const, label: 'Avanzato' },
};

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const inProgressCourses = courses.filter(c => c.status === 'in-progress');
  const completedCourses = courses.filter(c => c.status === 'completed');
  const aiRecommendedCourses = courses.filter(c => c.aiRecommended && c.status === 'not-started');

  const totalProgress = Math.round(
    courses.reduce((acc, c) => acc + c.progress, 0) / courses.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training & Formazione</h1>
          <p className="text-gray-600 mt-2">
            {inProgressCourses.length} corsi in corso • {completedCourses.length} completati
          </p>
        </div>
        <Button>📚 Catalogo Completo</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Progress Totale</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalProgress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: `${totalProgress}%` }}></div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Corsi Completati</div>
          <div className="text-2xl font-bold text-success mt-1">{completedCourses.length}</div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">In Corso</div>
          <div className="text-2xl font-bold text-warning mt-1">{inProgressCourses.length}</div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="text-sm text-gray-600">Certificati Ottenuti</div>
          <div className="text-2xl font-bold text-primary mt-1">{completedCourses.length}</div>
        </Card>
      </div>

      {/* AI Recommendations */}
      {aiRecommendedCourses.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Raccomandazioni AI
                <Badge variant="primary" size="sm">Personalizzato</Badge>
              </h3>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                L'AI ha analizzato le tue performance e consiglia questi corsi per migliorare
              </p>
              <div className="space-y-2">
                {aiRecommendedCourses.map(course => (
                  <div key={course.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-xs text-gray-600">{course.duration} • {course.modules} moduli</p>
                      </div>
                    </div>
                    <Button size="sm">Inizia</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* In Progress Courses */}
      {inProgressCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">In Corso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCourses.map(course => (
              <Card key={course.id} hover className="relative">
                {course.aiRecommended && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="primary" size="sm">🤖 AI</Badge>
                  </div>
                )}
                <div className="mb-3">
                  <span className={`text-xs px-2 py-1 rounded ${categoryColors[course.category]}`}>
                    {course.category.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <span>🕐 {course.duration}</span>
                  <span>•</span>
                  <span>📚 {course.modules} moduli</span>
                  <span>•</span>
                  <Badge variant={levelBadges[course.level].variant} size="sm">
                    {levelBadges[course.level].label}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-primary">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                <Button variant="primary" className="w-full">Continua Corso</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completati</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedCourses.map(course => (
              <Card key={course.id} padding={false} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${categoryColors[course.category]}`}>
                    {course.category.toUpperCase()}
                  </span>
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                  <span>🕐 {course.duration}</span>
                  <span>•</span>
                  <span>📚 {course.modules} moduli</span>
                </div>
                <Button size="sm" variant="ghost" className="w-full">
                  🏆 Scarica Certificato
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tutti i Corsi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Tutte le categorie</option>
              <option value="sales">Sales</option>
              <option value="product">Product</option>
              <option value="soft-skills">Soft Skills</option>
              <option value="tools">Tools</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tutti gli stati</option>
              <option value="not-started">Non iniziato</option>
              <option value="in-progress">In corso</option>
              <option value="completed">Completato</option>
            </Select>
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                course.status === 'completed'
                  ? 'bg-gray-50 border-gray-200'
                  : course.aiRecommended
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="text-3xl">
                {course.status === 'completed' ? '✅' : course.aiRecommended ? '🤖' : '📖'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{course.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${categoryColors[course.category]}`}>
                    {course.category}
                  </span>
                  <Badge variant={levelBadges[course.level].variant} size="sm">
                    {levelBadges[course.level].label}
                  </Badge>
                  {course.aiRecommended && course.status === 'not-started' && (
                    <Badge variant="primary" size="sm">AI Consiglia</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>🕐 {course.duration}</span>
                  <span>📚 {course.modules} moduli</span>
                  {course.status !== 'not-started' && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{course.progress}% completato</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                {course.status === 'not-started' && (
                  <Button size="sm">Inizia</Button>
                )}
                {course.status === 'in-progress' && (
                  <Button size="sm" variant="primary">Continua</Button>
                )}
                {course.status === 'completed' && (
                  <Button size="sm" variant="ghost">Rivedi</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
