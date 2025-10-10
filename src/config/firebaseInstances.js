// Configuración de las 3 instancias de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Credenciales de los 3 proyectos
import dashboardCredentials from '../credentials/firebase_dashboard_credentials.json';
import jobsCredentials from '../credentials/firebase_jobs_credentials.json';
import usersCredentials from '../credentials/firebase_credentials_ucal.json';

// Instancia para Dashboard (login/auth de administradores)
const dashboardApp = initializeApp(dashboardCredentials, 'dashboard');
export const dashboardDb = getFirestore(dashboardApp);
export const dashboardAuth = getAuth(dashboardApp);

// Instancia para Jobs (prácticas y ofertas laborales)
const jobsApp = initializeApp(jobsCredentials, 'jobs');
export const jobsDb = getFirestore(jobsApp);

// Instancia para Users (estudiantes y datos del dashboard)
const usersApp = initializeApp(usersCredentials, 'users');
export const usersDb = getFirestore(usersApp);

// Exportar por defecto la instancia de dashboard para compatibilidad
export default dashboardApp;
