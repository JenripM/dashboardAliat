import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { analyzeOfferDemand, getFieldsAnalysisAndRawData } from '../services/offerDemandService';

const CompetenciasAgrupadasChart = () => {
  const [selectedCareer, setSelectedCareer] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [sortBy, setSortBy] = useState('demandada');
  const [analysis, setAnalysis] = useState(null);
  const [bottleneckAnalysis, setBottleneckAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState(null); // Cache de todos los datos
  const [isFiltering, setIsFiltering] = useState(false); // Indicador de filtrado local

  // Función para sincronizar ambos selects
  const handleCareerChange = (value) => {
    setSelectedCareer(value);
    setSelectedArea(value);
  };

  const handleAreaChange = (value) => {
    setSelectedArea(value);
    setSelectedCareer(value);
  };

  // Cargar todos los datos una sola vez al montar el componente
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar todos los datos en una sola llamada optimizada
        const { analysis: fullAnalysis, fieldAnalyses, rawData } = await getFieldsAnalysisAndRawData();
        
        // Guardar todos los datos disponibles
        setAllData({ 
          analysis: fullAnalysis, 
          fieldAnalyses: fieldAnalyses || {},
          rawData: rawData || null 
        });
        
        setAnalysis(fullAnalysis);
        setBottleneckAnalysis(fullAnalysis);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Filtrar datos localmente cuando cambia el filtro
  useEffect(() => {
    if (!allData) return;
    
    const filterData = () => {
      setIsFiltering(true);
      
      if (selectedCareer === 'all') {
        setAnalysis(allData.analysis);
        setBottleneckAnalysis(allData.analysis);
        setIsFiltering(false);
        return;
      }
      
      // Usar datos pre-calculados del caché si están disponibles
      if (allData.fieldAnalyses && allData.fieldAnalyses[selectedCareer]) {
        const filteredAnalysis = allData.fieldAnalyses[selectedCareer];
        console.log('🎯 Usando datos pre-calculados para:', selectedCareer);
        console.log('📊 Datos filtrados:', filteredAnalysis);
        setAnalysis(filteredAnalysis);
        setBottleneckAnalysis(filteredAnalysis);
        setIsFiltering(false);
        return;
      }
      
      // Si no hay datos pre-calculados, usar raw data para filtrar localmente
      if (allData.rawData) {
        const { analyzeOfferDemandFromData } = require('../services/offerDemandService');
        const filteredAnalysis = analyzeOfferDemandFromData(
          allData.rawData.practicasData,
          allData.rawData.usersData,
          selectedCareer
        );
        setAnalysis(filteredAnalysis);
        setBottleneckAnalysis(filteredAnalysis);
      } else {
        // Fallback: usar datos completos si no hay filtro específico
        setAnalysis(allData.analysis);
        setBottleneckAnalysis(allData.analysis);
      }
      
      setIsFiltering(false);
    };
    
    filterData();
  }, [selectedCareer, allData]);

  // Mostrar loading
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Análisis de Competencias</h2>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Cargando análisis de competencias...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Análisis de Competencias</h2>
        <div className="flex items-center justify-center h-96 text-red-500">
          <p>Error cargando datos: {error}</p>
        </div>
      </div>
    );
  }

  // Verificar que tenemos datos
  if (!analysis || !bottleneckAnalysis) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Análisis de Competencias</h2>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const { competencies, totalOffers, totalUsers } = analysis;
  const { competencies: bottleneckCompetencies } = bottleneckAnalysis;
  
  // Debug: Verificar datos
  console.log('🔍 Debug CompetenciasAgrupadasChart:');
  console.log('📊 Analysis object:', analysis);
  console.log('📈 Total offers:', totalOffers);
  console.log('👥 Total users:', totalUsers);
  console.log('🎯 Selected career:', selectedCareer);

  // Preparar datos para el gráfico de barras agrupadas
  const allCompetencies = Object.entries(competencies);
  console.log('Total competencias encontradas:', allCompetencies.length);
  console.log('Competencias con brecha > 0:', allCompetencies.filter(([, data]) => data.gapPercentage > 0).length);
  
  // Función para ordenar según el criterio seleccionado
  const getSortFunction = (sortBy) => {
    switch (sortBy) {
      case 'demandada':
        return (a, b) => b.demandada - a.demandada;
      case 'ofertada':
        return (a, b) => b.ofertada - a.ofertada;
      default:
        return (a, b) => b.demandada - a.demandada;
    }
  };

  // Datos para el primer gráfico (barras agrupadas)
  const groupedData = allCompetencies
    .map(([competency, data]) => ({
      name: competency,
      demandada: data.offerPercentage, // Competencias demandadas por empresas
      ofertada: data.demandPercentage, // Competencias ofertadas por usuarios
      brecha: data.gapPercentage // Usar la brecha calculada por el servicio
    }))
    .filter(item => item.demandada > 0 || item.ofertada > 0) // Solo competencias que aparecen en al menos una categoría
    .sort(getSortFunction(sortBy)) // Ordenar según el criterio seleccionado
    .slice(0, 10); // Top 10 competencias

  // Datos para el segundo gráfico (cuellos de botella)
  const bottleneckData = Object.entries(bottleneckCompetencies)
    .map(([competency, data]) => ({
      name: competency,
      value: data.gapPercentage
    }))
    .filter(item => item.value > 0) // Solo competencias con escasez (más oferta que demanda)
    .sort((a, b) => b.value - a.value) // Ordenar por mayor escasez
    .slice(0, 8);
    
  console.log('Competencias filtradas para el gráfico:', groupedData.length);
  console.log('Datos del gráfico:', groupedData);

  // Calcular altura dinámica basada en el número de competencias
  const barHeight = 60; // Altura fija por barra (más gordita)
  const padding = 20; // Padding superior e inferior
  const dynamicHeight = Math.max(200, (groupedData.length * barHeight) + padding);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Análisis de Competencias</h2>
          <p className="text-sm text-gray-500">
            Total ofertas: {totalOffers} | Total usuarios: {totalUsers} | 
            Competencias analizadas: {Object.keys(competencies).length}
            {selectedCareer !== 'all' && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Filtrado por: {selectedCareer}
                {isFiltering && <span className="ml-1">(filtrando...)</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por área:</label>
            <select
              value={selectedCareer}
              onChange={(e) => handleCareerChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las carreras</option>
              <option value="Programming">Programación</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finanzas</option>
            </select>
          </div>
        </div>
      </div>
      {/* Controles para el primer gráfico */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Análisis de Oferta vs Demanda</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="demandada">Más demandado</option>
              <option value="ofertada">Más ofertado</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Competencias ordenadas por {
            sortBy === 'demandada' ? 'más demandado' : 'más ofertado'
          }
        </p>
      </div>

      {/* Gráfico de barras agrupadas */}
      <div style={{ height: `${dynamicHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={groupedData}
            layout="vertical"
            margin={{ top: 80, right: 30, left: 120, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120}
              tick={{ fontSize: 14 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900 mb-2">
                        Competencia: {label}
                      </p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm text-gray-700">
                            {entry.dataKey === 'demandada' 
                              ? 'Demandada por empresas' 
                              : 'Ofertada por usuarios'
                            }: <span className="font-semibold">{entry.value}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={50}
              iconSize={20}
              iconType="rect"
              layout="horizontal"
              align="center"
              wrapperStyle={{ 
                paddingBottom: '50px',
              }}
            />
            <Bar 
              dataKey="demandada" 
              name="Demandada por empresas"
              fill="#D97706"
              radius={[0, 2, 2, 0]}
            />
            <Bar 
              dataKey="ofertada" 
              name="Ofertada por usuarios"
              fill="#166534"
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Explicación del primer gráfico */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Interpretación del gráfico de oferta vs demanda:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <span className="text-orange-600 font-medium">Barras naranjas:</span> Porcentaje de ofertas que requieren esta competencia</li>
          <li>• <span className="text-green-800 font-medium">Barras verdes:</span> Porcentaje de usuarios que tienen esta competencia</li>
          <li>• <span className="text-gray-600 font-medium">Filtro:</span> Se aplica el filtro por área seleccionada (sincronizado con ambos gráficos)</li>
        </ul>
      </div>

      {/* Controles para el segundo gráfico */}
      <div className="mt-8 mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Cuellos de botella: Skills que las empresas demandan pero no tienen los usuarios</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por área:</label>
            <select
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las áreas</option>
              <option value="Programming">Programación</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finanzas</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Competencias con mayor escasez en el mercado
        </p>
      </div>

      {/* Gráfico de cuellos de botella */}
      <div className="mb-8">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bottleneckData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value}%`, 
                  'Escasez en el mercado'
                ]}
                labelFormatter={(label) => `Competencia: ${label}`}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#EF4444"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Explicación del segundo gráfico */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Interpretación del gráfico de cuellos de botella:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <span className="text-red-600 font-medium">Barras rojas:</span> Competencias con mayor escasez en el mercado</li>
            <li>• <span className="text-gray-600 font-medium">Filtro:</span> Se aplica el filtro por área seleccionada (sincronizado con ambos gráficos)</li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default CompetenciasAgrupadasChart;
