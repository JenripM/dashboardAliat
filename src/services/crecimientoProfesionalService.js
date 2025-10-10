// Servicio para métricas de crecimiento profesional
// Combina datos de herramientas de IA y aplicaciones para análisis de crecimiento

import { 
  getApplicationTrackingData,
  getInterviewSimulationData,
  getCvAnalysisData,
  getCvAdaptationData,
  getUsersData,
  getUserCVsCount,
  getLinkedinAnalyzeCount
} from './firebaseService';
import { 
  analyzeToolUsage
} from './toolUsageService';
import { cacheService } from './cacheService';

// Función para parsear fechas de Firestore
const parseFirestoreDate = (dateValue) => {
  if (!dateValue) return new Date();
  
  if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
    // Es un Timestamp de Firestore
    return dateValue.toDate();
  } else if (dateValue) {
    // Es un string o Date
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  return new Date();
};

// Función principal para obtener métricas de crecimiento profesional
export const getCrecimientoProfesionalMetrics = async (timeRange = '30D') => {
  const cacheKey = `crecimiento_profesional_${timeRange}`;
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('🔄 Iniciando carga de métricas de crecimiento profesional...');
    
    // Obtener datos de Firestore
    const [
      applicationData,
      interviewData,
      cvAnalysisData,
      cvAdaptationData,
      usersData
    ] = await Promise.all([
      getApplicationTrackingData(),
      getInterviewSimulationData(),
      getCvAnalysisData(),
      getCvAdaptationData(),
      getUsersData()
    ]);

    console.log('📈 Datos obtenidos:', {
      applicationData: applicationData.length,
      interviewData: interviewData.length,
      cvAnalysisData: cvAnalysisData.length,
      cvAdaptationData: cvAdaptationData.length,
      usersData: usersData.length
    });

    // Calcular métricas básicas
    const totalInterviews = interviewData.length;
    const totalCvAnalysis = cvAnalysisData.length;
    const totalCvAdaptation = cvAdaptationData.length;
    const totalUsers = usersData.length;

    // Calcular cambios porcentuales
    const interviewChange = calculatePercentageChange(interviewData, timeRange);
    const cvAnalysisChange = calculatePercentageChange(cvAnalysisData, timeRange);
    const cvAdaptationChange = calculatePercentageChange(cvAdaptationData, timeRange);

    // Obtener métricas de uso de herramientas
    const toolUsage = await analyzeToolUsage();

    // SOLO cachear las métricas esenciales, NO raw data ni datos pesados
    const processedMetrics = {
      // Métricas básicas
      totalInterviews,
      totalCvAnalysis,
      totalCvAdaptation,
      totalUsers,

      // Cambios porcentuales
      interviewChange: {
        value: interviewChange.value,
        type: interviewChange.type
      },
      cvAnalysisChange: {
        value: cvAnalysisChange.value,
        type: cvAnalysisChange.type
      },
      cvAdaptationChange: {
        value: cvAdaptationChange.value,
        type: cvAdaptationChange.type
      },

      // Uso de herramientas (solo lo esencial)
      toolUsage: toolUsage.totalUsage,
      mostUsedTool: toolUsage.mostUsedTool,
      leastUsedTool: toolUsage.leastUsedTool
      // NO guardar toolUsageTrends ni toolUsageByStatus (muy pesados)
    };

    // Guardar en caché solo las métricas procesadas
    cacheService.setMetrics(cacheKey, processedMetrics);

    return processedMetrics;
  } catch (error) {
    console.error('Error obteniendo métricas de crecimiento profesional:', error);
    throw error;
  }
};

// Función para calcular cambios porcentuales
const calculatePercentageChange = (data, timeRange = '30D') => {
  if (data.length === 0) return { value: 0, type: 'neutral' };
  
  const now = new Date();
  let startDate, previousStartDate, previousEndDate;
  
  switch (timeRange) {
    case '7D':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case '30D':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    case '90D':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  }
  
  const currentPeriod = data.filter(item => {
    const itemDate = parseFirestoreDate(item.createdAt);
    return itemDate >= startDate && itemDate <= now;
  });
  
  const previousPeriod = data.filter(item => {
    const itemDate = parseFirestoreDate(item.createdAt);
    return itemDate >= previousStartDate && itemDate < previousEndDate;
  });
  
  const currentCount = currentPeriod.length;
  const previousCount = previousPeriod.length;
  
  if (previousCount === 0) {
    return currentCount > 0 ? { value: 100, type: 'increase' } : { value: 0, type: 'neutral' };
  }
  
  const change = ((currentCount - previousCount) / previousCount) * 100;
  return {
    value: Math.round(change * 10) / 10,
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  };
};

// Función para obtener métricas de vista panorámica
export const getVistaPanoramicaMetrics = async (timeRange = '30D') => {
  const cacheKey = `vista_panoramica_${timeRange}`;
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    console.log('🌐 Iniciando carga de métricas de vista panorámica...');
    
    // Obtener datos necesarios para cálculos específicos
  const [applicationData, userCVsCount, linkedinCount] = await Promise.all([
    getApplicationTrackingData(),
    getUserCVsCount(),
    getLinkedinAnalyzeCount()
  ]);

      
    // Obtener métricas de crecimiento profesional (ya con caché)
    const crecimientoMetrics = await getCrecimientoProfesionalMetrics(timeRange);
    
    // Calcular métricas específicas de vista panorámica
    const activeStudents = crecimientoMetrics.totalUsers;
    const totalApplications = applicationData.length;
    
    // Calcular empleos conseguidos
    const jobsObtained = applicationData.filter(
      app => app.status === 'aceptados'
    ).length;
    
    // Calcular entrevistas conseguidas
    const interviewsObtained = applicationData.filter(
      app => app.status === 'entrevistas' || app.status === 'aceptados'
    ).length;
    
    // Calcular cambios para aplicaciones
    const applicationChange = calculatePercentageChange(applicationData, timeRange);
    
    // SOLO cachear las métricas esenciales para Vista Panorámica
    const processedMetrics = {
      // Métricas básicas
      activeStudents,
      totalApplications,
      totalInterviews: crecimientoMetrics.totalInterviews,
      totalCvAnalysis: crecimientoMetrics.totalCvAnalysis,
      totalCvAdaptation: crecimientoMetrics.totalCvAdaptation,
      totalUserCVs: userCVsCount,
        totalLinkedinAnalyze: linkedinCount,

      jobsObtained,
      interviewsObtained,
      
      // Cambios porcentuales
      applicationChange: {
        value: applicationChange.value,
        type: applicationChange.type
      },
      interviewChange: crecimientoMetrics.interviewChange,
      cvAnalysisChange: crecimientoMetrics.cvAnalysisChange,
      cvAdaptationChange: crecimientoMetrics.cvAdaptationChange,
      
      // Uso de herramientas (solo lo esencial)
      toolUsage: crecimientoMetrics.toolUsage
      // NO guardar toolUsagePercentages (muy pesado)
    };

    // Guardar en caché solo las métricas procesadas
    cacheService.setMetrics(cacheKey, processedMetrics);

    return processedMetrics;
  } catch (error) {
    console.error('Error obteniendo métricas de vista panorámica:', error);
    throw error;
  }
};
