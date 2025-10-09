import React, { useState, useEffect } from 'react';
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
import { getInterviewCareerAverageScores } from '../services/careerScoresService';

const PuntajesEntrevistasCarreraChart = () => {
  const [puntajeEntrevistas, setPuntajeEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getInterviewCareerAverageScores();
        const dataWithColors = data.map((career, index) => ({
          ...career,
          color: ['#00bf63', '#024579', '#028bbf', '#00bf63', '#024579'][index % 5]
        }));
        setPuntajeEntrevistas(dataWithColors);
      } catch (err) {
        console.error('Error cargando puntajes de entrevistas por carrera:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de entrevistas por carrera</h2>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando puntajes de entrevistas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de entrevistas por carrera</h2>
        <div className="flex items-center justify-center h-96 text-red-500">
          <p>Error cargando datos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Puntaje promedio de entrevistas por carrera</h2>
      <p className="mt-1 text-sm text-gray-500">Rendimiento promedio en entrevistas simuladas por carrera</p>
      {/* MODIFICACIÓN: Aumento de la altura mínima y el espacio por barra */}
      <div className="mt-6" style={{ height: `${Math.max(500, puntajeEntrevistas.length * 80 + 150)}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={puntajeEntrevistas}
            margin={{ top: 20, right: 40, left: 40, bottom: 120 }}
            // MODIFICACIÓN: Barras más gruesas para mejor visibilidad
            barSize={Math.max(50, Math.min(100, 400 / puntajeEntrevistas.length))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval={0}
              height={120}
              textAnchor="middle"
              tick={(props) => {
                const { x, y, payload } = props;
                const maxLength = 20;
                const careerName = payload.value;
                
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
                        dy={index * 18}
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
                      <p className="text-green-600">Puntaje promedio: {data.value}</p>
                      <p className="text-gray-600">Entrevistas simuladas: {data.count}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" fill="#00bf63">
              <LabelList dataKey="value" position="top" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PuntajesEntrevistasCarreraChart;
