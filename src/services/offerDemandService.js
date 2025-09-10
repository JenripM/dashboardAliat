// Servicio para análisis de oferta vs demanda de competencias
import { getPracticasData, getUsersData } from './firebaseService';
import { cacheService } from './cacheService';

/**
 * Analiza la oferta vs demanda de competencias
 * @param {string} targetField - Campo específico para filtrar (opcional)
 * @returns {Object} Análisis de oferta vs demanda
 */
export const analyzeOfferDemand = async (targetField = null) => {
  const cacheKey = `offer_demand_${targetField || 'all'}`;
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    const analysis = analyzeOfferDemandFromData(practicasData, usersData, targetField);
    
    // Guardar en caché solo los datos procesados finales
    cacheService.setMetrics(cacheKey, analysis);
    
    return analysis;
  } catch (error) {
    console.error('Error analizando oferta vs demanda:', error);
    return {
      competencies: [],
      summary: {
        totalCompetencies: 0,
        highDemand: 0,
        highSupply: 0,
        balanced: 0
      }
    };
  }
};

/**
 * Lógica original para analizar oferta vs demanda usando datos
 */
export const analyzeOfferDemandFromData = (practicasData, usersData, targetField = null) => {
  console.log('🔍 Analyzing offer demand for field:', targetField);
  console.log('📊 Total practicas:', practicasData.length);
  console.log('👥 Total users:', usersData.length);
  
  // Debug: Mostrar campos únicos disponibles
  const practicasFields = [...new Set(practicasData.map(p => p?.metadata?.target_field).filter(Boolean))];
  const usersFields = [...new Set(usersData.map(u => u?.metadata?.field_of_study).filter(Boolean))];
  console.log('🏢 Campos en practicas:', practicasFields);
  console.log('👤 Campos en users:', usersFields);
  
  // Filtrar datos por campo si se especifica - con validación defensiva
  const filteredPracticas = targetField 
    ? practicasData.filter(p => p?.metadata?.target_field === targetField)
    : practicasData;
  
  const filteredUsers = targetField 
    ? usersData.filter(u => u?.metadata?.field_of_study === targetField)
    : usersData;

  console.log('🎯 Filtered practicas for', targetField, ':', filteredPracticas.length);
  console.log('🎯 Filtered users for', targetField, ':', filteredUsers.length);
  
  // Debug: Mostrar algunos ejemplos de datos filtrados
  if (targetField && filteredPracticas.length > 0) {
    console.log('📋 Ejemplo de practica filtrada:', filteredPracticas[0]);
  }
  if (targetField && filteredUsers.length > 0) {
    console.log('👤 Ejemplo de usuario filtrado:', filteredUsers[0]);
  }
  
  // Debug: Verificar estructura de datos
  if (filteredPracticas.length > 0) {
    const samplePractica = filteredPracticas[0];
    console.log('🔍 Estructura de practica:', {
      hasMetadata: !!samplePractica?.metadata,
      hasTargetField: !!samplePractica?.metadata?.target_field,
      hasCompetencies: !!samplePractica?.metadata?.required_competencies,
      competenciesType: Array.isArray(samplePractica?.metadata?.required_competencies) ? 'array' : typeof samplePractica?.metadata?.required_competencies
    });
  }
  
  if (filteredUsers.length > 0) {
    const sampleUser = filteredUsers[0];
    console.log('🔍 Estructura de user:', {
      hasMetadata: !!sampleUser?.metadata,
      hasFieldOfStudy: !!sampleUser?.metadata?.field_of_study,
      hasCompetencies: !!sampleUser?.metadata?.competencies,
      competenciesType: Array.isArray(sampleUser?.metadata?.competencies) ? 'array' : typeof sampleUser?.metadata?.competencies
    });
  }

  // Extraer todas las competencias únicas
  const allCompetencies = new Set();
  
  // Competencias de ofertas - con validación defensiva
  filteredPracticas.forEach(practica => {
    // Validar que el objeto tenga la estructura esperada
    if (!practica || typeof practica !== 'object') {
      console.warn('⚠️ Objeto practica inválido en competencias:', practica);
      return;
    }
    
    if (practica?.metadata?.required_competencies && Array.isArray(practica.metadata.required_competencies)) {
      practica.metadata.required_competencies.forEach(comp => {
        if (comp && typeof comp === 'string') {
          allCompetencies.add(comp);
        }
      });
    }
  });
  
  // Competencias de usuarios - con validación defensiva
  filteredUsers.forEach(user => {
    // Validar que el objeto tenga la estructura esperada
    if (!user || typeof user !== 'object') {
      console.warn('⚠️ Objeto user inválido en competencias:', user);
      return;
    }
    
    if (user?.metadata?.competencies && Array.isArray(user.metadata.competencies)) {
      user.metadata.competencies.forEach(comp => {
        if (comp && typeof comp === 'string') {
          allCompetencies.add(comp);
        }
      });
    }
  });

  // Calcular estadísticas por competencia con porcentajes normalizados
  const analysis = {};
  const totalOffers = filteredPracticas.length;
  const totalUsers = filteredUsers.length;
  
  Array.from(allCompetencies).forEach(competency => {
    // Contar en ofertas - con validación defensiva
    const offerCount = filteredPracticas.filter(practica => {
      // Validar que el objeto tenga la estructura esperada
      if (!practica || typeof practica !== 'object') return false;
      
      return practica?.metadata?.required_competencies && 
        Array.isArray(practica.metadata.required_competencies) &&
        practica.metadata.required_competencies.includes(competency);
    }).length;
    
    // Contar en usuarios - con validación defensiva
    const demandCount = filteredUsers.filter(user => {
      // Validar que el objeto tenga la estructura esperada
      if (!user || typeof user !== 'object') return false;
      
      return user?.metadata?.competencies && 
        Array.isArray(user.metadata.competencies) &&
        user.metadata.competencies.includes(competency);
    }).length;
    
    // Calcular porcentajes normalizados
    const offerPercentage = totalOffers > 0 ? (offerCount / totalOffers) * 100 : 0;
    const demandPercentage = totalUsers > 0 ? (demandCount / totalUsers) * 100 : 0;
    
    // Calcular brecha en porcentajes
    const gapPercentage = offerPercentage - demandPercentage;
    
    analysis[competency] = {
      offerCount: offerCount,
      demandCount: demandCount,
      offerPercentage: Math.round(offerPercentage * 100) / 100,
      demandPercentage: Math.round(demandPercentage * 100) / 100,
      gap: offerCount - demandCount,
      gapPercentage: Math.round(gapPercentage * 100) / 100,
      status: getCompetencyStatus(gapPercentage, offerPercentage, demandPercentage)
    };
  });

  return {
    totalOffers: filteredPracticas.length,
    totalUsers: filteredUsers.length,
    competencies: analysis,
    summary: generateSummary(analysis, filteredPracticas.length, filteredUsers.length)
  };
};

/**
 * Obtiene el estado de una competencia basado en la brecha porcentual
 */
const getCompetencyStatus = (gapPercentage, offerPercentage, demandPercentage) => {
  if (offerPercentage === 0 && demandPercentage === 0) return 'neutral';
  if (offerPercentage === 0) return 'oversupply';
  if (demandPercentage === 0) return 'shortage';
  
  if (gapPercentage > 5) return 'shortage';      // Más de 5% de diferencia a favor de oferta
  if (gapPercentage < -5) return 'oversupply';   // Más de 5% de diferencia a favor de demanda
  return 'balanced';
};

/**
 * Genera un resumen del análisis
 */
const generateSummary = (analysis, totalOffers, totalUsers) => {
  const competencies = Object.values(analysis);
  
  const shortages = competencies.filter(c => c.status === 'shortage');
  const oversupplies = competencies.filter(c => c.status === 'oversupply');
  const balanced = competencies.filter(c => c.status === 'balanced');
  
  // Top competencias más demandadas (shortage) - ordenadas por brecha porcentual
  const topShortages = shortages
    .sort((a, b) => b.gapPercentage - a.gapPercentage)
    .slice(0, 5);
  
  // Top competencias más ofrecidas (oversupply) - ordenadas por brecha porcentual
  const topOversupplies = oversupplies
    .sort((a, b) => a.gapPercentage - b.gapPercentage)
    .slice(0, 5);
  
  return {
    shortages: shortages.length,
    oversupplies: oversupplies.length,
    balanced: balanced.length,
    topShortages,
    topOversupplies,
    totalCompetencies: competencies.length
  };
};

/**
 * Obtiene estadísticas por campo de estudio
 */
export const getFieldStats = async () => {
  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    return getFieldStatsFromData(practicasData, usersData);
  } catch (error) {
    console.error('Error obteniendo estadísticas por campo:', error);
    return {};
  }
};

/**
 * Lógica original para calcular estadísticas por campo usando datos
 */
export const getFieldStatsFromData = (practicasData, usersData) => {
  const fields = {};
  
  // Agrupar por campo - con validación defensiva
  practicasData.forEach(practica => {
    const field = practica?.metadata?.target_field;
    if (field && typeof field === 'string') {
      if (!fields[field]) {
        fields[field] = { offers: 0, users: 0 };
      }
      fields[field].offers++;
    }
  });
  
  usersData.forEach(user => {
    const field = user?.metadata?.field_of_study;
    if (field && typeof field === 'string') {
      if (!fields[field]) {
        fields[field] = { offers: 0, users: 0 };
      }
      fields[field].users++;
    }
  });
  
  return fields;
};

/**
 * Obtiene competencias más comunes por campo
 */
export const getTopCompetenciesByField = async (field) => {
  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    return getTopCompetenciesByFieldFromData(practicasData, usersData, field);
  } catch (error) {
    console.error('Error obteniendo competencias por campo:', error);
    return { userTop: [], offerTop: [] };
  }
};

/**
 * Lógica original para obtener competencias por campo usando datos
 */
export const getTopCompetenciesByFieldFromData = (practicasData, usersData, field) => {
  const fieldUsers = usersData.filter(u => u?.metadata?.field_of_study === field);
  const fieldOffers = practicasData.filter(p => p?.metadata?.target_field === field);
  
  const userCompetencies = {};
  const offerCompetencies = {};
  
  // Contar competencias de usuarios - con validación defensiva
  fieldUsers.forEach(user => {
    if (user?.metadata?.competencies && Array.isArray(user.metadata.competencies)) {
      user.metadata.competencies.forEach(comp => {
        if (comp && typeof comp === 'string') {
          userCompetencies[comp] = (userCompetencies[comp] || 0) + 1;
        }
      });
    }
  });
  
  // Contar competencias de ofertas - con validación defensiva
  fieldOffers.forEach(offer => {
    if (offer?.metadata?.required_competencies && Array.isArray(offer.metadata.required_competencies)) {
      offer.metadata.required_competencies.forEach(comp => {
        if (comp && typeof comp === 'string') {
          offerCompetencies[comp] = (offerCompetencies[comp] || 0) + 1;
        }
      });
    }
  });
  
  return {
    userTop: Object.entries(userCompetencies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([comp, count]) => ({ competency: comp, count })),
    offerTop: Object.entries(offerCompetencies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([comp, count]) => ({ competency: comp, count }))
  };
};

/**
 * Obtiene los campos disponibles que tienen competencias analizadas
 */
export const getAvailableFields = async () => {
  const cacheKey = 'available_fields';
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    const fields = getAvailableFieldsFromData(practicasData, usersData);
    
    // Guardar en caché solo los datos procesados finales
    cacheService.setMetrics(cacheKey, fields);
    
    return fields;
  } catch (error) {
    console.error('Error obteniendo campos disponibles:', error);
    return [];
  }
};

/**
 * Obtiene campos disponibles y análisis completo en una sola llamada optimizada
 * Solo devuelve datos procesados, no raw data
 */
export const getFieldsAndAnalysis = async () => {
  const cacheKey = 'fields_and_analysis';
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    
    const fields = getAvailableFieldsFromData(practicasData, usersData);
    const allAnalysis = analyzeOfferDemandFromData(practicasData, usersData, null);
    
    const result = {
      fields,
      analysis: allAnalysis
    };
    
    // Guardar en caché solo los datos procesados
    cacheService.setMetrics(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error obteniendo campos y análisis:', error);
    return {
      fields: [],
      analysis: { competencies: {}, totalOffers: 0, totalUsers: 0, summary: {} }
    };
  }
};

/**
 * Obtiene campos disponibles, análisis completo Y raw data en una sola llamada
 * Solo usar cuando se necesite filtrado local (para evitar llamadas adicionales)
 */
export const getFieldsAnalysisAndRawData = async () => {
  const cacheKey = 'fields_analysis_raw_data';
  
  // 1. Verificar caché primero
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    console.log('📦 Usando caché para fields_analysis_raw_data');
    console.log('🔍 Caché contiene fieldAnalyses:', !!cached.fieldAnalyses);
    
    // Si el caché no tiene fieldAnalyses, es un caché antiguo, lo limpiamos
    if (!cached.fieldAnalyses) {
      console.log('🧹 Caché antiguo detectado, limpiando...');
      cacheService.clearAllCache();
      // Continuar con el cálculo nuevo
    } else {
      if (cached.fieldAnalyses) {
        console.log('📊 Campos en caché:', Object.keys(cached.fieldAnalyses));
      }
      return cached;
    }
  }

  try {
    const [practicasData, usersData] = await Promise.all([
      getPracticasData(),
      getUsersData()
    ]);
    
    const fields = getAvailableFieldsFromData(practicasData, usersData);
    const allAnalysis = analyzeOfferDemandFromData(practicasData, usersData, null);
    
    // Pre-calcular análisis para cada campo disponible y guardar en caché
    const fieldAnalyses = {};
    fields.forEach(field => {
      console.log('🔄 Pre-calculando análisis para campo:', field.field);
      const fieldAnalysis = analyzeOfferDemandFromData(practicasData, usersData, field.field);
      console.log('📊 Resultado para', field.field, ':', {
        totalOffers: fieldAnalysis.totalOffers,
        totalUsers: fieldAnalysis.totalUsers,
        competenciesCount: Object.keys(fieldAnalysis.competencies).length
      });
      fieldAnalyses[field.field] = fieldAnalysis;
    });
    
    const result = {
      fields,
      analysis: allAnalysis,
      fieldAnalyses, // Nuevo: análisis pre-calculados por campo
      rawData: { practicasData, usersData }
    };
    
    // Guardar en caché solo los datos procesados (no raw data)
    const processedData = {
      fields,
      analysis: allAnalysis,
      fieldAnalyses
    };
    
    cacheService.setMetrics(cacheKey, processedData);
    
    return result;
  } catch (error) {
    console.error('Error obteniendo campos, análisis y raw data:', error);
    return {
      fields: [],
      analysis: { competencies: {}, totalOffers: 0, totalUsers: 0, summary: {} },
      fieldAnalyses: {},
      rawData: { practicasData: [], usersData: [] }
    };
  }
};

/**
 * Lógica para obtener campos disponibles usando datos
 */
export const getAvailableFieldsFromData = (practicasData, usersData) => {
  const fieldStats = {};
  
  console.log('🔍 Analizando campos disponibles...');
  console.log('📊 Total practicas:', practicasData.length);
  console.log('👥 Total users:', usersData.length);
  
  // Analizar campos de practicas - con validación defensiva
  practicasData.forEach(practica => {
    // Validar que el objeto tenga la estructura esperada
    if (!practica || typeof practica !== 'object') {
      console.warn('⚠️ Objeto practica inválido:', practica);
      return;
    }
    
    const field = practica?.metadata?.target_field;
    if (field && typeof field === 'string' && field.trim() !== '') {
      if (!fieldStats[field]) {
        fieldStats[field] = { practicas: 0, users: 0, competencies: new Set() };
      }
      fieldStats[field].practicas++;
      
      // Contar competencias en practicas
      if (practica?.metadata?.required_competencies && Array.isArray(practica.metadata.required_competencies)) {
        practica.metadata.required_competencies.forEach(comp => {
          if (comp && typeof comp === 'string') {
            fieldStats[field].competencies.add(comp);
          }
        });
      }
    }
  });
  
  // Analizar campos de usuarios - con validación defensiva
  usersData.forEach(user => {
    // Validar que el objeto tenga la estructura esperada
    if (!user || typeof user !== 'object') {
      console.warn('⚠️ Objeto user inválido:', user);
      return;
    }
    
    const field = user?.metadata?.field_of_study;
    if (field && typeof field === 'string' && field.trim() !== '') {
      if (!fieldStats[field]) {
        fieldStats[field] = { practicas: 0, users: 0, competencies: new Set() };
      }
      fieldStats[field].users++;
      
      // Contar competencias en usuarios
      if (user?.metadata?.competencies && Array.isArray(user.metadata.competencies)) {
        user.metadata.competencies.forEach(comp => {
          if (comp && typeof comp === 'string') {
            fieldStats[field].competencies.add(comp);
          }
        });
      }
    }
  });
  
  console.log('📈 Estadísticas por campo:', Object.entries(fieldStats).map(([field, stats]) => ({
    field,
    practicas: stats.practicas,
    users: stats.users,
    competencies: stats.competencies.size
  })));
  
  // Filtrar solo campos que tienen competencias analizadas Y datos en ambas fuentes
  const validFields = Object.entries(fieldStats)
    .filter(([_, stats]) => {
      const hasCompetencies = stats.competencies.size >= 5;
      const hasBothSources = stats.practicas > 0 && stats.users > 0;
      console.log(`🔍 Campo ${_[0]}: competencias=${stats.competencies.size}, practicas=${stats.practicas}, users=${stats.users}, válido=${hasCompetencies && hasBothSources}`);
      return hasCompetencies && hasBothSources;
    })
    .map(([field, stats]) => ({
      field,
      practicas: stats.practicas,
      users: stats.users,
      competencies: stats.competencies.size
    }))
    .sort((a, b) => b.competencies - a.competencies);
    
  console.log('✅ Campos válidos encontrados:', validFields);
  return validFields;
};

// Función específica para OfertasPorCampoTreemap - solo datos del treemap
export const getTreemapData = async () => {
  const cacheKey = 'treemap_data';
  
  // Intentar obtener del caché
  const cached = cacheService.getMetrics(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const practicasData = await getPracticasData();
    
    // Agrupar ofertas por target_field - excluyendo "No especificado"
    const fieldCounts = {};
    
    practicasData.forEach(practica => {
      const field = practica?.metadata?.target_field;
      if (field && typeof field === 'string' && field.trim() !== '' && field !== 'No especificado') {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
    });

    // Calcular total para determinar el umbral del 2%
    const totalOfertas = Object.values(fieldCounts).reduce((sum, count) => sum + count, 0);
    const umbral2Porciento = totalOfertas * 0.02;
    
    // Separar campos principales (>=2%) y menores (<2%)
    const camposPrincipales = [];
    const camposMenores = [];
    let colorIndex = 0;
    
    Object.entries(fieldCounts).forEach(([field, count]) => {
      const assignedColor = getFieldColor(field, colorIndex);
      
      if (count >= umbral2Porciento) {
        camposPrincipales.push({ 
          name: field, 
          value: count, 
          fill: assignedColor 
        });
        colorIndex++;
      } else {
        camposMenores.push({ 
          name: field, 
          value: count, 
          fill: assignedColor 
        });
        colorIndex++;
      }
    });

    // Ordenar campos principales por cantidad
    camposPrincipales.sort((a, b) => b.value - a.value);

    // Agrupar campos menores en "Otros" si hay suficientes
    let treemapData = [...camposPrincipales];
    
    if (camposMenores.length > 0) {
      const totalOtros = camposMenores.reduce((sum, campo) => sum + campo.value, 0);
      treemapData.push({
        name: 'Otros',
        value: totalOtros,
        fill: '#6B7280',
        isGroup: true,
        originalFields: camposMenores
      });
    }

    // Guardar en caché solo los datos del treemap
    cacheService.setMetrics(cacheKey, treemapData);
    
    return treemapData;
  } catch (error) {
    console.error('Error obteniendo datos del treemap:', error);
    return [];
  }
};

// Función para obtener colores de campos (reutilizada)
const getFieldColor = (field, index = 0) => {
  const vibrantColors = [
    '#4F46E5', '#059669', '#D97706', '#DB2777', '#DC2626',
    '#0891B2', '#65A30D', '#7C3AED', '#EA580C', '#0F766E'
  ];
  
  const specificColors = {
    'Programming': '#4F46E5', 'Marketing': '#059669', 'Finance': '#D97706',
    'Design': '#DB2777', 'Sales': '#DC2626', 'HR': '#0891B2',
    'Operations': '#65A30D', 'Data Science': '#7C3AED', 'Engineering': '#EA580C',
    'Business': '#0F766E'
  };

  return specificColors[field] || vibrantColors[index % vibrantColors.length];
};
