// Servicio para conexión a Firebase
// Usa las instancias específicas según el tipo de datos

import { collection, getCountFromServer, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { usersDb, jobsDb } from '../config/firebaseInstances';

// Helper para obtener la base de datos correcta según la colección
const getDbForCollection = (collectionName) => {
  if (collectionName === 'practicas') {
    return jobsDb; // Proyecto Jobs
  }
  return usersDb; // Proyecto Users (users, applicationTracking, aiTool_*, userCVs)
};

// Función para obtener datos de una colección específica
export const getCollectionData = async (collectionName) => {
  try {
    console.log(`🔍 Consultando colección: ${collectionName}`);
    
    const db = getDbForCollection(collectionName);
    
    if (!db) {
      throw new Error('Base de datos no está inicializada');
    }
    
    // Usar la API de Firestore del cliente
    const { getDocs } = await import('firebase/firestore');
    const collectionRef = collection(db, collectionName);
    console.log(`📡 Ejecutando consulta en Firestore...`);
    const snapshot = await getDocs(collectionRef);
    
    const data = [];
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Datos obtenidos de ${collectionName}: ${data.length} documentos`);
    if (data.length > 0) {
      console.log(`📄 Primer documento:`, data[0]);
    }
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo datos de ${collectionName}:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    throw error;
  }
};

// Función para obtener datos de applicationTracking (colección principal)
export const getApplicationTrackingData = async () => {
  return await getCollectionData('applicationTracking');
};

// Función para obtener datos de usuarios
export const getUsersData = async () => {
  return await getCollectionData('users');
};

// Función para obtener datos de herramientas de IA específicas
export const getAIToolData = async (toolName) => {
  return await getCollectionData(toolName);
};

// Funciones específicas para cada colección
export const getPracticasData = async () => {
  return await getCollectionData('practicas');
};

// Función para obtener prácticas de los últimos N días
export const getPracticasDataLastDays = async (days = 2) => {
  try {
    console.log(`🔍 Consultando prácticas de los últimos ${days} días`);
    
    const db = jobsDb; // Proyecto Jobs
    
    if (!db) {
      throw new Error('Base de datos Jobs no está inicializada');
    }
    
    // Calcular la fecha de hace N días
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - days);
    const fiveDaysAgoTimestamp = Timestamp.fromDate(fiveDaysAgo);
    
    console.log(`📅 Filtrando desde: ${fiveDaysAgo.toISOString()}`);
    console.log(`🕐 Timestamp:`, fiveDaysAgoTimestamp);
    
    // Crear query con filtro de fecha usando el campo correcto
    const { query: queryFn, where, getDocs, limit } = await import('firebase/firestore');
    const collectionRef = collection(db, 'practicas');
    
    // Agregar límite para evitar consultas muy pesadas
    const q = queryFn(
      collectionRef, 
      where('fecha_agregado', '>=', fiveDaysAgoTimestamp),
      limit(100) // Límite de 100 documentos máximo
    );
    
    console.log(`📡 Ejecutando consulta filtrada en Firestore...`);
    const startTime = Date.now();
    
    // Agregar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Consulta tardó más de 10 segundos')), 10000);
    });
    
    const queryPromise = getDocs(q);
    const snapshot = await Promise.race([queryPromise, timeoutPromise]);
    
    const endTime = Date.now();
    console.log(`⏱️ Consulta completada en ${endTime - startTime}ms`);
    
    const data = [];
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Prácticas obtenidas de los últimos ${days} días: ${data.length} documentos`);
    if (data.length > 0) {
      console.log(`📄 Primer documento:`, {
        id: data[0].id,
        fecha_agregado: data[0].fecha_agregado,
        hasMetadata: !!data[0].metadata,
        hasRequiredCompetencies: !!data[0].metadata?.required_competencies
      });
    }
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo prácticas de los últimos ${days} días:`, error.message);
    
    // Si es timeout o error de consulta, usar fallback
    if (error.message.includes('Timeout') || error.message.includes('index')) {
      console.log(`🔄 Usando fallback: obtener todas las prácticas...`);
      try {
        const allPracticas = await getCollectionData('practicas');
        console.log(`📊 Fallback: Obtenidas ${allPracticas.length} prácticas totales`);
        return allPracticas;
      } catch (fallbackError) {
        console.error(`❌ Error en fallback:`, fallbackError.message);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

export const getCvAnalysisData = async () => {
  return await getCollectionData('aiTool_cvAnalysis');
};

export const getInterviewSimulationData = async () => {
  return await getCollectionData('aiTool_interviewSimulation');
};

export const getCvAdaptationData = async () => {
  return await getCollectionData('aiTool_cvAdaptation');
};

export const getUserCVsData = async () => {
  return await getCollectionData('userCVs');
};

// Función para verificar la conexión a Firebase
export const verifyFirebaseConnection = async () => {
  try {
    // Verificar que las instancias estén disponibles
    if (usersDb && jobsDb) {
      console.log(`✅ Conexiones a Firebase exitosas`);
      return { usersDb, jobsDb };
    } else {
      throw new Error('No se pudieron inicializar las conexiones a Firebase');
    }
  } catch (e) {
    console.error("❌ Error de conexión a Firebase:", e.message);
    throw e;
  }
};


/**
 * Obtiene el conteo de registros en la colección aiTool_linkedinAnalyze
 */
export const getLinkedinAnalyzeCount = async () => {
  try {
    return await getCollectionCount('aiTool_linkedinAnalyze');
  } catch (error) {
    console.error('❌ Error obteniendo conteo de aiTool_linkedinAnalyze:', error.message);
    return 0;
  }
};


// Función para obtener datos con filtros específicos
export const getFilteredCollectionData = async (collectionName, filters = {}) => {
  try {
    const db = getDbForCollection(collectionName);
    
    if (!db) {
      throw new Error('Base de datos no está inicializada');
    }
    
    const { query, where, getDocs } = await import('firebase/firestore');
    const collectionRef = collection(db, collectionName);
    
    let q = collectionRef;
    
    // Aplicar filtros
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        q = query(q, where(field, '==', value));
      }
    });
    
    const snapshot = await getDocs(q);
    const data = [];
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo datos filtrados de ${collectionName}:`, error.message);
    throw error;
  }
};

// Función para obtener datos con ordenamiento
export const getOrderedCollectionData = async (collectionName, orderBy = 'createdAt', orderDirection = 'desc', limit = null) => {
  try {
    const db = getDbForCollection(collectionName);
    
    if (!db) {
      throw new Error('Base de datos no está inicializada');
    }
    
    const { query, orderBy: orderByFn, limit: limitFn, getDocs } = await import('firebase/firestore');
    const collectionRef = collection(db, collectionName);
    
    let q = query(collectionRef, orderByFn(orderBy, orderDirection));
    
    if (limit) {
      q = query(q, limitFn(limit));
    }
    
    const snapshot = await getDocs(q);
    const data = [];
    
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Error obteniendo datos ordenados de ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Obtiene el conteo de documentos en una colección (optimizado)
 */
export const getCollectionCount = async (collectionName) => {
  try {
    const db = getDbForCollection(collectionName);
    
    if (!db) {
      throw new Error('Base de datos no está inicializada');
    }
    
    const collectionRef = collection(db, collectionName);
    const snapshot = await getCountFromServer(collectionRef);
    return snapshot.data().count;
  } catch (error) {
    console.error(`❌ Error obteniendo conteo de ${collectionName}:`, error.message);
    throw error;
  }
};

/**
 * Obtiene el conteo de userCVs (optimizado)
 */
export const getUserCVsCount = async () => {
  try {
    return await getCollectionCount('userCVs');
  } catch (error) {
    console.error('❌ Error obteniendo conteo de userCVs:', error.message);
    return 0;
  }
};
