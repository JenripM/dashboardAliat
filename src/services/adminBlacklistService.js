// Servicio para manejar lista negra de administradores
// Permite excluir usuarios específicos de los análisis y métricas

/**
 * Lista de correos electrónicos de administradores que deben ser excluidos
 * de los análisis y métricas del dashboard
 */
const ADMIN_EMAILS_BLACKLIST = [

  'hectorzerrillo85@gmail.com',
  // Agregar más correos de administradores aquí según sea necesario
];

/**
 * Verifica si un correo electrónico está en la lista negra de administradores
 * @param {string} email - El correo electrónico a verificar
 * @returns {boolean} - true si el correo está en la lista negra, false en caso contrario
 */
export const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS_BLACKLIST.includes(normalizedEmail);
};

/**
 * Filtra un array de datos excluyendo usuarios administradores
 * @param {Array} data - Array de datos que contienen información de usuarios
 * @param {string} emailField - Nombre del campo que contiene el correo electrónico (por defecto 'email')
 * @returns {Array} - Array filtrado sin los usuarios administradores
 */
export const filterOutAdmins = (data, emailField = 'email') => {
  if (!Array.isArray(data)) {
    console.warn('filterOutAdmins: data debe ser un array');
    return [];
  }

  const filteredData = data.filter(item => {
    const email = item[emailField];
    return !isAdminEmail(email);
  });

  const removedCount = data.length - filteredData.length;
  if (removedCount > 0) {
    console.log(`📊 Admin Blacklist: Se excluyeron ${removedCount} usuarios administradores de ${data.length} total`);
  }

  return filteredData;
};

/**
 * Filtra datos de usuarios basándose en el campo user.email
 * Útil para datos que tienen estructura user: { email: '...', ... }
 * @param {Array} data - Array de datos que contienen objetos user
 * @returns {Array} - Array filtrado sin los usuarios administradores
 */
export const filterOutAdminsByUserEmail = (data) => {
  if (!Array.isArray(data)) {
    console.warn('filterOutAdminsByUserEmail: data debe ser un array');
    return [];
  }

  const filteredData = data.filter(item => {
    const email = item.user && item.user.email;
    return !isAdminEmail(email);
  });

  const removedCount = data.length - filteredData.length;
  if (removedCount > 0) {
    console.log(`📊 Admin Blacklist: Se excluyeron ${removedCount} usuarios administradores de ${data.length} total`);
  }

  return filteredData;
};

/**
 * Agrega un correo electrónico a la lista negra
 * @param {string} email - El correo electrónico a agregar
 */
export const addAdminEmail = (email) => {
  if (!email || typeof email !== 'string') {
    console.warn('addAdminEmail: email debe ser un string válido');
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (!ADMIN_EMAILS_BLACKLIST.includes(normalizedEmail)) {
    ADMIN_EMAILS_BLACKLIST.push(normalizedEmail);
    console.log(`📊 Admin Blacklist: Se agregó ${normalizedEmail} a la lista negra`);
  }
};

/**
 * Obtiene la lista actual de correos en la lista negra
 * @returns {Array} - Array de correos electrónicos en la lista negra
 */
export const getAdminEmailsList = () => {
  return [...ADMIN_EMAILS_BLACKLIST]; // Retorna una copia para evitar modificaciones externas
};
