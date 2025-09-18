// Servicio para calcular la mejora en entrevistas por número de simulación
import { getInterviewSimulationData } from './firebaseService';
import { cacheService } from './cacheService';
import { filterOutAdminsByUserEmail } from './adminBlacklistService';

/**
 * Verifica si los datos en cache tienen huecos (formato antiguo)
 * El nuevo formato debe tener números de simulación consecutivos sin saltos
 */
const checkForDataGaps = (cachedData) => {
  if (!cachedData || cachedData.length < 2) return false;
  
  const simulationNumbers = cachedData.map(item => item.simulationNumber).sort((a, b) => a - b);
  
  // Verificar si hay huecos en la secuencia
  for (let i = 1; i < simulationNumbers.length; i++) {
    if (simulationNumbers[i] - simulationNumbers[i-1] > 1) {
      return true; // Hay huecos, es formato antiguo
    }
  }
  
  return false; // No hay huecos, es formato nuevo
};

/**
 * Calcula el score promedio por número de simulación
 * Agrupa las simulaciones por usuario, las ordena cronológicamente
 * y calcula el promedio para cada "primera vez", "segunda vez", etc.
 */
export const getMejoraEntrevistasData = async () => {
  const cacheKey = 'mejora_entrevistas_data';
  
  // 1. Verificar caché primero (invalidar cache antiguo por cambio de algoritmo)
  const cached = cacheService.getMetrics(cacheKey);
  if (cached && cached.length > 0 && cached[0].hasOwnProperty('simulationNumber')) {
    // Verificar si es el formato nuevo (sin huecos) o el formato antiguo (con huecos)
    const hasGaps = checkForDataGaps(cached);
    if (!hasGaps) {
      return cached; // Cache válido con nuevo formato
    }
    // Si tiene huecos, es cache antiguo, lo ignoramos y recalculamos
  }

  try {
    const rawInterviewSimulationData = await getInterviewSimulationData();
    // Filtrar administradores antes de procesar los datos
    const interviewSimulationData = filterOutAdminsByUserEmail(rawInterviewSimulationData);
    console.log(`📊 Mejora Entrevistas: ${rawInterviewSimulationData.length} simulaciones totales, ${interviewSimulationData.length} después de filtrar administradores`);
    const data = getMejoraEntrevistasDataFromData(interviewSimulationData);
    
    // Guardar en caché solo los datos procesados
    cacheService.setMetrics(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Error obteniendo datos de entrevistas:', error);
    return [];
  }
};

/**
 * Lógica corregida para calcular mejora en entrevistas usando datos
 * Cada usuario contribuye a todos los puntos de simulación que ha completado
 */
export const getMejoraEntrevistasDataFromData = (interviewSimulationData) => {
  // 1. Agrupar simulaciones por usuario y ordenar cronológicamente
  const userSimulations = {};
  
  interviewSimulationData.forEach(sim => {
    if (!userSimulations[sim.userId]) {
      userSimulations[sim.userId] = [];
    }
    userSimulations[sim.userId].push({
      score: sim.interviewScore,
      date: sim.createdAt,
      userId: sim.userId
    });
  });

  // 2. Para cada usuario, ordenar por fecha y crear secuencia completa de scores
  const userSequences = {};
  
  Object.keys(userSimulations).forEach(userId => {
    const sorted = userSimulations[userId].sort((a, b) => a.date - b.date);
    userSequences[userId] = sorted.map(sim => sim.score);
  });

  // Debug: Log para verificar la estructura de datos
  console.log('=== DEBUG: Mejora Entrevistas ===');
  console.log('Total usuarios:', Object.keys(userSequences).length);
  Object.entries(userSequences).forEach(([userId, scores]) => {
    console.log(`Usuario ${userId}: ${scores.length} simulaciones, scores: [${scores.join(', ')}]`);
  });

  // 3. Encontrar el máximo número de simulaciones que tiene cualquier usuario
  const maxSimulations = Math.max(
    ...Object.values(userSequences).map(sequence => sequence.length)
  );
  
  console.log('Máximo número de simulaciones:', maxSimulations);

  // 4. Para cada número de simulación (1, 2, 3, ..., maxSimulations)
  // calcular el promedio de todos los usuarios que tienen al menos esa cantidad de simulaciones
  const result = [];
  
  for (let simNumber = 1; simNumber <= maxSimulations; simNumber++) {
    const scoresForThisSimulation = [];
    
    // Recopilar scores de todos los usuarios que tienen al menos simNumber simulaciones
    Object.entries(userSequences).forEach(([userId, scores]) => {
      if (scores.length >= simNumber) {
        // El usuario tiene al menos simNumber simulaciones, incluir su score en esa posición
        const scoreAtPosition = scores[simNumber - 1]; // simNumber-1 porque array es 0-indexed
        if (scoreAtPosition !== undefined && scoreAtPosition !== null) {
          scoresForThisSimulation.push(scoreAtPosition);
        }
      }
    });

    console.log(`Simulación #${simNumber}: ${scoresForThisSimulation.length} usuarios contribuyen, scores: [${scoresForThisSimulation.join(', ')}]`);

    // SIEMPRE agregar el punto si hay al menos un score válido
    // Esto garantiza que no haya huecos en la secuencia
    if (scoresForThisSimulation.length > 0) {
      const averageScore = scoresForThisSimulation.reduce((sum, score) => sum + score, 0) / scoresForThisSimulation.length;
      
      result.push({
        simulationNumber: simNumber,
        averageScore: Math.round(averageScore * 10) / 10, // Redondear a 1 decimal
        count: scoresForThisSimulation.length, // Cuántos usuarios contribuyen a este punto
        minScore: Math.min(...scoresForThisSimulation),
        maxScore: Math.max(...scoresForThisSimulation),
        scores: scoresForThisSimulation // Para análisis adicional si es necesario
      });
    } else {
      console.log(`⚠️  Simulación #${simNumber}: NO HAY DATOS - esto no debería pasar!`);
    }
  }

  console.log('Resultado final:', result.map(r => `Sim #${r.simulationNumber}: ${r.averageScore} (${r.count} usuarios)`));
  return result;
};

/**
 * Calcula estadísticas adicionales para el gráfico
 */
export const getMejoraEntrevistasStats = async () => {
  const cacheKey = 'mejora_entrevistas_stats';
  
  // 1. Verificar caché primero (invalidar cache antiguo por cambio de algoritmo)
  const cached = cacheService.getMetrics(cacheKey);
  if (cached && cached.hasOwnProperty('totalSimulations')) {
    // Verificar si es el formato nuevo comparando con datos principales
    const dataCache = cacheService.getMetrics('mejora_entrevistas_data');
    if (dataCache && dataCache.length > 0) {
      const hasGaps = checkForDataGaps(dataCache);
      if (!hasGaps) {
        return cached; // Cache válido con nuevo formato
      }
    }
    // Si tiene huecos, es cache antiguo, lo ignoramos y recalculamos
  }

  try {
    const rawInterviewSimulationData = await getInterviewSimulationData();
    // Filtrar administradores antes de procesar los datos
    const interviewSimulationData = filterOutAdminsByUserEmail(rawInterviewSimulationData);
    const data = getMejoraEntrevistasDataFromData(interviewSimulationData);
    const stats = getMejoraEntrevistasStatsFromData(data, interviewSimulationData);
    
    // Guardar en caché solo las estadísticas procesadas
    cacheService.setMetrics(cacheKey, stats);
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de entrevistas:', error);
    return {
      totalSimulations: 0,
      totalUsers: 0,
      maxSimulations: 0,
      averageImprovement: 0,
      minScore: 0,
      maxScore: 100
    };
  }
};

/**
 * Lógica corregida para calcular estadísticas usando datos
 */
export const getMejoraEntrevistasStatsFromData = (data, interviewSimulationData) => {
  if (data.length === 0) {
    return {
      totalSimulations: 0,
      totalUsers: 0,
      maxSimulations: 0,
      averageImprovement: 0,
      minScore: 0,
      maxScore: 100
    };
  }

  // Calcular total de simulaciones: suma de todas las simulaciones individuales
  const totalSimulations = interviewSimulationData.length;
  const totalUsers = new Set(
    interviewSimulationData.map(sim => sim.userId)
  ).size;
  const maxSimulations = Math.max(...data.map(item => item.simulationNumber));
  
  // Calcular mejora promedio (diferencia entre última y primera simulación)
  const firstSim = data.find(item => item.simulationNumber === 1);
  const lastSim = data[data.length - 1];
  const averageImprovement = firstSim && lastSim 
    ? lastSim.averageScore - firstSim.averageScore 
    : 0;

  // Calcular rango dinámico para el eje Y basado en promedios por simulación
  const averageScores = data.map(item => item.averageScore);
  const minScore = Math.min(...averageScores);
  const maxScore = Math.max(...averageScores);
  
  // Agregar margen de 5 puntos arriba y abajo, redondeando a enteros
  const margin = 5;
  const yAxisMin = Math.max(0, Math.floor(minScore - margin));
  const yAxisMax = Math.min(100, Math.ceil(maxScore + margin));

  return {
    totalSimulations,
    totalUsers,
    maxSimulations,
    averageImprovement: Math.round(averageImprovement * 10) / 10,
    minScore: yAxisMin,
    maxScore: yAxisMax
  };
};
