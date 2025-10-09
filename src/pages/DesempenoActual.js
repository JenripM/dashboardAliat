import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import AspectosEntrevistasChart from '../components/AspectosEntrevistasChart';
import AspectosCVChart from '../components/AspectosCVChart';
import PuntajesCVCarreraChart from '../components/PuntajesCVCarreraChart';
import PuntajesEntrevistasCarreraChart from '../components/PuntajesEntrevistasCarreraChart';
import EstudiantesActivosCicloChart from '../components/EstudiantesActivosCicloChart';
import EstudiantesActivosCarreraChart from '../components/EstudiantesActivosCarreraChart';
import { getVistaPanoramicaMetrics } from '../services/crecimientoProfesionalService';

const DesempenoActual = () => {
  const [timeRange, setTimeRange] = useState('30D');
  const [dateRange] = useState('Jan 01, 2025 - Feb 20, 2025');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const data = await getVistaPanoramicaMetrics(timeRange);
        setMetrics(data);
      } catch (err) {
        console.error('Error cargando métricas de desempeño:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [timeRange]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Desempeño Actual</h1>
            <p className="mt-1 text-sm text-gray-500">
              Análisis del desempeño actual y áreas de mejora de nuestros estudiantes
            </p>
            <p className="mt-1 text-sm text-gray-400">{dateRange}</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Desempeño Actual</h1>
            <p className="mt-1 text-sm text-gray-500">
              Análisis del desempeño actual y áreas de mejora de nuestros estudiantes
            </p>
            <p className="mt-1 text-sm text-gray-400">{dateRange}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar métricas</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Desempeño Actual</h1>
            <p className="mt-1 text-sm text-gray-500">
              Análisis del desempeño actual y áreas de mejora de nuestros estudiantes
            </p>
            <p className="mt-1 text-sm text-gray-400">{dateRange}</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Postulaciones',
      value: metrics.totalApplications.toString(),
      icon: ChartBarIcon,
      change: `${metrics.applicationChange.value > 0 ? '+' : ''}${metrics.applicationChange.value}%`,
      changeType: metrics.applicationChange.type,
      description: 'en el último mes'
    },
    {
      name: 'Empleos Conseguidos',
      value: metrics.jobsObtained.toString(),
      icon: BriefcaseIcon,
      change: '+25.0%', // Esta métrica no tiene cambio temporal directo
      changeType: 'increase',
      description: 'estudiantes con trabajo'
    },
    {
      name: 'Entrevistas Conseguidas',
      value: metrics.interviewsObtained.toString(),
      icon: DocumentTextIcon,
      change: '+18.5%', // Esta métrica no tiene cambio temporal directo
      changeType: 'increase',
      description: 'estudiantes con entrevistas'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Desempeño Actual</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análisis del desempeño actual y áreas de mejora de nuestros estudiantes
          </p>
          <p className="mt-1 text-sm text-gray-400">{dateRange}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimeRange('7D')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === '7D'
                ? 'text-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('30D')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === '30D'
                ? 'text-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setTimeRange('90D')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              timeRange === '90D'
                ? 'text-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            90D
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <div>
              <div className="absolute bg-primary/5 rounded-md p-3">
                <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
            </div>
            <div className="ml-16 flex items-baseline mt-1">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                stat.changeType === 'increase' ? 'text-success' : 'text-red-600'
              }`}>
                {stat.change}
              </p>
            </div>
            <div className="ml-16 mt-1">
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Errores más comunes en entrevistas */}
        <AspectosEntrevistasChart />

        {/* Aspectos a mejorar en CVs */}
        <AspectosCVChart />

        {/* Puntajes CV por Carrera */}
        <PuntajesCVCarreraChart />

        {/* Puntajes Entrevistas por Carrera */}
        
        <PuntajesEntrevistasCarreraChart />
      </div>

      {/* Estudiantes Activos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Estudiantes Activos por Ciclo 
        <EstudiantesActivosCicloChart />*/}

        {/* Estudiantes Activos por Carrera 
        <EstudiantesActivosCarreraChart />*/}
      </div>
    </div>
  );
};

export default DesempenoActual;
