import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getImpactoHerramientasChartData, getImpactoHerramientasStats } from '../services/impactoHerramientasService';

const ImpactoHerramientasChart = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalExitosos: 0,
    mensajePrincipal: 'No hay datos disponibles',
    mejoraRelativa: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dataResult, statsResult] = await Promise.all([
          getImpactoHerramientasChartData(),
          getImpactoHerramientasStats()
        ]);
        setData(dataResult);
        setStats(statsResult);
      } catch (err) {
        console.error('Error cargando datos de impacto de herramientas:', err);
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
            {data.categoria}
          </p>
          <p className="text-blue-600 font-medium">
            {data.porcentaje}% ({data.cantidad} aplicaciones)
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Impacto de las Herramientas AI
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando datos de impacto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Impacto de las Herramientas AI
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
  if (data.length === 0 || stats.totalExitosos === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Impacto de las Herramientas AI
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No hay datos de aplicaciones exitosas disponibles</p>
        </div>
      </div>
    );
  }

  // Gráfico temporalmente deshabilitado (solicitado por el usuario)
  return null;

  /*
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          De todos los que consiguieron trabajo:
        </h3>
        
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="categoria" type="category" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="porcentaje" fill="#3b82f6">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  */
};

export default ImpactoHerramientasChart;
