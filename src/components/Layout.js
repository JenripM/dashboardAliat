import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MyWorkInLogo from '../assets/images/MyWorkIn (Simbolo)(1).png';
// Importar logos de universidades
import UlimaLogo from '../assets/images/ulima.webp';
import {
  UserGroupIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ArrowLeftOnRectangleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChartPieIcon,
  MegaphoneIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

// Mapeo de acrónimos a logos de universidades
const universityLogos = {
  ulima: UlimaLogo,
  // Agregar más universidades aquí cuando sea necesario
};

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [userEmail] = useState(currentUser?.email || '');

  // Obtener el acrónimo de la universidad desde las variables de entorno
  const acronimoUniversidad = process.env.REACT_APP_ACRONIMO_UNIVERSIDAD;
  
  // Obtener el logo según el acrónimo, o usar el logo por defecto de MyWorkIn
  const logo = acronimoUniversidad && universityLogos[acronimoUniversidad] 
    ? universityLogos[acronimoUniversidad] 
    : MyWorkInLogo;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navigation = [
    {
      title: 'General',
      items: [
        { name: 'Vista Panorámica', href: '/vista-panoramica', icon: ChartPieIcon },
      ]
    },
    {
      title: 'Análisis',
      items: [
        { name: 'Competitividad en el Mercado', href: '/competitividad-mercado', icon: ChartBarIcon },
       
        //{ name: 'Crecimiento Profesional', href: '/crecimiento-profesional', icon: ChartPieIcon },


        { name: 'Desempeño Actual', href: '/desempeno-actual', icon: ClipboardDocumentListIcon },
      ]
    },
    {
      title: 'Más información',
      items: [
        { name: 'Estudiantes', href: '/estudiantes', icon: UserGroupIcon },
        
      ]
    },
    {
      title: 'Practicas',
      items: [
        { name: 'Prácticas', href: '/practicas', icon: BriefcaseIcon },
        { name: 'Convalidación', href: '/convalidacion', icon: UsersIcon },
        { name: 'Empresas', href: '/empresas', icon: BuildingOfficeIcon },

      ]
    },

        {
      title: 'Cuenta',
      items: [
        { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
        { name: 'Anuncios y Eventos', href: '/anuncios-eventos', icon: MegaphoneIcon },
        { name: 'Usuarios', href: '/usuarios', icon: UsersIcon },

      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <img src={logo} alt={acronimoUniversidad ? `${acronimoUniversidad} Logo` : "MyWorkIn Logo"} className="h-8 w-auto" />
            <div className="ml-2 flex flex-col">
              <span className="text-xs text-gray-500">MYWORKIN-DASHBOARD</span>
              <span className="text-[10px] text-gray-400">v0.01</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 mt-6 space-y-8">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? 'text-primary bg-primary/5'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="px-3 py-2 text-sm text-gray-500">
              {userEmail}
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 