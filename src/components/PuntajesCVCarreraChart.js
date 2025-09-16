import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { getCareerAverageScores } from '../services/careerScoresService';

const PuntajesCVCarreraChart = () => {
  const [puntajePromedio, setPuntajePromedio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(10);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getCareerAverageScores();
        const dataWithColors = data.map((career, index) => ({
          ...career,
          color: ['#024579', '#028bbf', '#00bf63', '#024579', '#028bbf'][index % 5]
        }));
        setPuntajePromedio(dataWithColors);
      } catch (err) {
        console.error('Error cargando puntajes de CV por carrera:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Datos derivados: ordenar, aplicar Top N y agregar "Otros" si corresponde
  const displayedData = useMemo(() => {
    if (!puntajePromedio || puntajePromedio.length === 0) return [];

    const sorted = [...puntajePromedio].sort((a, b) => (b.value || 0) - (a.value || 0));
    if (showAll) return sorted;

    const limited = sorted.slice(0, topN);
    const rest = sorted.slice(topN);
    if (rest.length === 0) return limited;

    const totalCount = rest.reduce((acc, item) => acc + (item.count || 0), 0);
    const weightedSum = rest.reduce((acc, item) => acc + (item.value || 0) * (item.count || 0), 0);
    const averageValue = totalCount > 0
      ? weightedSum / totalCount
      : rest.reduce((acc, item) => acc + (item.value || 0), 0) / rest.length;

    const othersBar = {
      name: 'Otros',
      value: Number(averageValue.toFixed(1)),
      count: totalCount || rest.length,
      color: '#9CA3AF'
    };

    return [...limited, othersBar];
  }, [puntajePromedio, showAll, topN]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de CV por carrera</h2>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando puntajes de CV...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de CV por carrera</h2>
        <div className="flex items-center justify-center h-96 text-red-500">
          <p>Error cargando datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de CV por carrera</h2>
          <p className="mt-1 text-sm text-gray-500">Rendimiento promedio de CV analizados por carrera</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
            disabled={showAll}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
          </select>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-sm px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            {showAll ? 'Ver Top N' : 'Ver todos'}
          </button>
        </div>
      </div>
      <div className="mt-6" style={{ height: '420px' }}>
        <div className="overflow-x-auto h-full">
          <div style={{ minWidth: `${Math.max(700, displayedData.length * 80)}px`, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedData}
                margin={{ top: 20, right: 40, left: 40, bottom: 90 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  interval={displayedData.length > 18 ? 'preserveStartEnd' : 0}
                  height={80}
                  textAnchor="middle"
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const maxLength = 20; // Longitud máxima por línea
                    const careerName = payload.value;
                    
                    // Dividir el nombre en líneas si es muy largo
                    const lines = [];
                    if (careerName.length > maxLength) {
                      const words = careerName.split(' ');
                      let currentLine = '';
                      
                      words.forEach(word => {
                        if ((currentLine + ' ' + word).length <= maxLength) {
                          currentLine += (currentLine ? ' ' : '') + word;
                        } else {
                          if (currentLine) lines.push(currentLine);
                          currentLine = word;
                        }
                      });
                      if (currentLine) lines.push(currentLine);
                    } else {
                      lines.push(careerName);
                    }
                    
                    return (
                      <g transform={`translate(${x},${y + 20})`}>
                        {lines.map((line, index) => (
                          <text
                            key={index}
                            x={0}
                            y={0}
                            dy={index * 16}
                            textAnchor="middle"
                            fill="#666"
                            fontSize={12}
                          >
                            {line}
                          </text>
                        ))}
                      </g>
                    );
                  }}
                />
                <YAxis 
                  domain={[0, 100]}
                  label={{ value: 'Puntaje', angle: -90, position: 'insideLeft', offset: 5 }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-blue-600">Puntaje promedio: {data.value}</p>
                          <p className="text-gray-600">CVs analizados: {data.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#028bbf">
                  <LabelList dataKey="value" position="top" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuntajesCVCarreraChart;
