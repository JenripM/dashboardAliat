import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getCareerStats } from '../services/userStatsService';

const EstudiantesActivosCarreraChart = () => {
  const [carrerasData, setCarrerasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(15);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getCareerStats();
        setCarrerasData(data);
      } catch (err) {
        console.error('Error cargando datos de carreras:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Ordenar y limitar + agregar "Otros" (suma de valores y promedio de porcentaje)
  const displayedData = useMemo(() => {
    if (!carrerasData || carrerasData.length === 0) return [];
    const sorted = [...carrerasData].sort((a, b) => (b.value || 0) - (a.value || 0));
    if (showAll) return sorted;

    const limited = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    if (rest.length === 0) return limited;

    const totalValue = rest.reduce((acc, item) => acc + (item.value || 0), 0);
    const avgPercentage = rest.reduce((acc, item) => acc + (item.percentage || 0), 0) / rest.length;

    const others = {
      name: 'Otros',
      value: totalValue,
      percentage: avgPercentage,
    };
    return [...limited, others];
  }, [carrerasData, showAll, topN]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Estudiantes Activos por Carrera</h2>
        <div className="flex items-center justify-center text-gray-500" style={{ height: '300px' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando datos de carreras...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Estudiantes Activos por Carrera</h2>
        <div className="flex items-center justify-center text-red-500" style={{ height: '300px' }}>
          <p>Error cargando datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Estudiantes Activos por Carrera</h2>
          <p className="mt-1 text-sm text-gray-500">Carreras con más del 0.5% de estudiantes activos</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
            disabled={showAll}
          >
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
            <option value={30}>Top 30</option>
          </select>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-sm px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            {showAll ? 'Ver Top N' : 'Ver todos'}
          </button>
        </div>
      </div>
      <div className="mt-6" style={{ height: '520px' }}>
        <div className="h-full overflow-y-auto">
          <div style={{ height: '100%', minHeight: '100%' }}>
            <ResponsiveContainer width="100%" height={Math.max(400, displayedData.length * 28)}>
              <BarChart
                layout="vertical"
                data={displayedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={220}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.length > 30 ? value.substring(0, 30) + '…' : value}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-blue-600">Estudiantes: {data.value}</p>
                          {typeof data.percentage === 'number' && (
                            <p className="text-gray-600">Porcentaje: {data.percentage.toFixed(1)}%</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#028bbf" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudiantesActivosCarreraChart;
