import { useState } from 'react';
import { PlusIcon, MegaphoneIcon, CalendarDaysIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import CreateAnnouncementEventModal from '../components/CreateAnnouncementEventModal';

const AnunciosEventos = () => {
  const [items, setItems] = useState([
    {
      id: '1',
      titulo: 'Feria de Empleo 2024',
      tipo: 'Evento',
      publico: 'Todas las carreras',
      fechaPublicacion: '2024-01-15',
      fechaEvento: '2024-02-15',
      visualizaciones: 1247,
      asistentes: 89,
    },
    {
      id: '2',
      titulo: 'Taller de Entrevistas Laborales',
      tipo: 'Evento',
      publico: 'Ingeniería de Sistemas',
      fechaPublicacion: '2024-01-20',
      fechaEvento: '2024-02-05',
      visualizaciones: 456,
      asistentes: 34,
    },
    {
      id: '3',
      titulo: 'Nuevas Oportunidades en TechCorp',
      tipo: 'Anuncio',
      publico: 'Cohorte 2023-I',
      fechaPublicacion: '2024-01-18',
      fechaEvento: null,
      visualizaciones: 783,
      asistentes: 0,
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const stats = [
    { name: 'Anuncios Activos', value: items.filter(i => i.tipo === 'Anuncio').length, icon: MegaphoneIcon },
    { name: 'Eventos Próximos', value: items.filter(i => i.tipo === 'Evento').length, icon: CalendarDaysIcon },
    { name: 'Total Visualizaciones', value: items.reduce((a, i) => a + (i.visualizaciones || 0), 0), icon: EyeIcon },
    { name: 'Total Asistentes', value: items.reduce((a, i) => a + (i.asistentes || 0), 0), icon: UserGroupIcon },
  ];

  // Apertura/cierre del modal de creación (solo UI)
  const openCreateModal = () => setIsCreateOpen(true);
  const closeCreateModal = () => setIsCreateOpen(false);

  const handleDelete = (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Anuncios y Eventos</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona comunicaciones y eventos para estudiantes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Crear Anuncio/Evento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
            <div>
              <div className="absolute bg-primary/5 rounded-md p-3">
                <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
            </div>
            <div className="ml-16 mt-1">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Público Objetivo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Publicación</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Evento</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visualizaciones</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistentes</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No hay registros</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.tipo === 'Evento' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.publico}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.fechaPublicacion)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.fechaEvento)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.visualizaciones}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.asistentes || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-600 hover:text-gray-900 font-medium hover:underline">Ver</button>
                      <button className="text-blue-600 hover:text-blue-900 font-medium hover:underline">Editar</button>
                      <button onClick={() => handleDelete(item.id, item.titulo)} className="text-red-600 hover:text-red-900 font-medium hover:underline">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <CreateAnnouncementEventModal isOpen={isCreateOpen} onClose={closeCreateModal} />
    </div>
  );
};

export default AnunciosEventos;


