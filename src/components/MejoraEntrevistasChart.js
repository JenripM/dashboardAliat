import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Area,
  AreaChart
} from 'recharts';
import { getMejoraEntrevistasData, getMejoraEntrevistasStats } from '../services/mejoraEntrevistasService';

const MejoraEntrevistasChart = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalSimulations: 0,
    totalUsers: 0,
    maxSimulations: 0,
    averageImprovement: 0,
    minScore: 0,
    maxScore: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dataResult, statsResult] = await Promise.all([
          getMejoraEntrevistasData(),
          getMejoraEntrevistasStats()
        ]);
        setData(dataResult);
        setStats(statsResult);
      } catch (err) {
        console.error('Error cargando datos de mejora de entrevistas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Personalizar el tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">
            {`Simulación #${label}`}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Score promedio:</span> {data.averageScore}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Usuarios con ≥{label} simulaciones:</span> {data.count}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Rango de scores:</span> {data.minScore} - {data.maxScore}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            *Cada usuario contribuye a todos los puntos hasta su última simulación
          </p>
        </div>
      );
    }
    return null;
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Tendencia de mejora
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando datos de simulaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Tendencia de mejora
        </h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          <div className="text-center">
            <p>Error cargando datos: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tendencia de mejora 
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No hay datos de simulaciones disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Tendencia de mejora
        </h3>
        <p className="text-sm text-gray-600">
          Score promedio por número de simulación de entrevistas (evolución completa de usuarios)
        </p>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>Total simulaciones: {stats.totalSimulations}</span>
          <span>Usuarios únicos: {stats.totalUsers}</span>
          <span className="font-semibold text-green-600">
            Mejora promedio: +{stats.averageImprovement} puntos
          </span>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="simulationNumber"
              stroke="#666"
              fontSize={12}
            >
              <Label 
                value="Número de Simulación" 
                position="insideBottom" 
                offset={-5} 
                style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
              />
            </XAxis>
            <YAxis 
              stroke="#666"
              fontSize={12}
              domain={[stats.minScore, stats.maxScore]}
            >
              <Label 
                value="Score Promedio" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="averageScore"
              stroke="#2563eb"
              strokeWidth={4}
              fill="url(#colorScore)"
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: '#2563eb', strokeWidth: 3, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MejoraEntrevistasChart;
