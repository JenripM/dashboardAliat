import React, { useState, useEffect } from 'react';
import { 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { jobsDb } from '../config/firebaseInstances';
import { useAuth } from '../contexts/AuthContext';

// Definimos el tipo para las preguntas de filtro
const FilterQuestion = {
  text: '',
  type: 'text', // 'bool' | 'int' | 'select' | 'text'
  options: [] // Solo aplica si el tipo es 'select'
};

// Definimos el tipo para las preguntas de entrevista asíncrona
const AsyncInterviewQuestion = {
  text: '',
  id: ''
};

const Practicas = () => {
  const { currentUser } = useAuth();
  const [practicas, setPracticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPractica, setSelectedPractica] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estados para el flujo paso a paso
  const [currentStep, setCurrentStep] = useState('basic');
  const [applicationType, setApplicationType] = useState(null);
  const [wantsFilterQuestions, setWantsFilterQuestions] = useState(false);
  
  // Estados para feedback visual
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedJobId, setPublishedJobId] = useState(null);

  const [formData, setFormData] = useState({
    descripcion: '',
    fecha_agregado: '',
    location: '',
    salary: '',
    title: '',
    titulo_contactos: '',
    fuente: 'myworkin',
    uid: '',
    sitio_web: '',
    logo: '',
    company: '',
    estado: 'activo',
    // Campo para URL externa
    externalUrl: '',
    // Preguntas de filtro (para filtrar postulantes)
    filterQuestions: [],
    nuevaPreguntaFiltro: {
      text: '',
      type: 'text',
      options: [],
      nuevaOpcion: ''
    },
    // Especificaciones de entrevista asíncrona
    asyncInterviewSpecs: {
      questionBank: [],
      questionsPerCandidate: 5
    },
    nuevaPreguntaEntrevista: '',
    isGeneratingQuestions: false
  });

  useEffect(() => {
    loadPracticas();
  }, []);

  const loadPracticas = async () => {
    try {
      setLoading(true);
      const practicasRef = collection(jobsDb, 'practicas');
      const q = query(practicasRef, orderBy('fecha_agregado', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const practicasData = [];
      querySnapshot.forEach((doc) => {
        practicasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPracticas(practicasData);
    } catch (error) {
      console.error('Error cargando prácticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'finalizada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVerDetalles = (practica) => {
    setSelectedPractica(practica);
    setShowModal(true);
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setSelectedPractica(null);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
    setCurrentStep('basic');
    setApplicationType(null);
    setWantsFilterQuestions(false);
    setFormData({
      descripcion: '',
      fecha_agregado: '',
      location: '',
      salary: '',
      title: '',
      titulo_contactos: '',
      fuente: 'myworkin',
      uid: currentUser?.uid || '',
      sitio_web: '',
      logo: '',
      company: '',
      estado: 'activo',
      externalUrl: '',
      filterQuestions: [],
      nuevaPreguntaFiltro: {
        text: '',
        type: 'text',
        options: [],
        nuevaOpcion: ''
      },
      asyncInterviewSpecs: {
        questionBank: [],
        questionsPerCandidate: 5
      },
      nuevaPreguntaEntrevista: '',
      isGeneratingQuestions: false
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('nuevaPreguntaFiltro.')) {
      const field = name.split('.')[1];
      setFormData(prevData => ({
        ...prevData,
        nuevaPreguntaFiltro: {
          ...prevData.nuevaPreguntaFiltro,
          [field]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleAddOption = () => {
    if (formData.nuevaPreguntaFiltro.nuevaOpcion.trim() !== '') {
      setFormData(prevData => ({
        ...prevData,
        nuevaPreguntaFiltro: {
          ...prevData.nuevaPreguntaFiltro,
          options: [...prevData.nuevaPreguntaFiltro.options, prevData.nuevaPreguntaFiltro.nuevaOpcion],
          nuevaOpcion: ''
        }
      }));
    }
  };

  const handleRemoveOption = (index) => {
    setFormData(prevData => {
      const nuevasOpciones = [...prevData.nuevaPreguntaFiltro.options];
      nuevasOpciones.splice(index, 1);
      
      return {
        ...prevData,
        nuevaPreguntaFiltro: {
          ...prevData.nuevaPreguntaFiltro,
          options: nuevasOpciones
        }
      };
    });
  };

  const handleAddFilterQuestion = () => {
    if (formData.nuevaPreguntaFiltro.text.trim() !== '') {
      if (formData.nuevaPreguntaFiltro.type === 'select' && formData.nuevaPreguntaFiltro.options.length === 0) {
        alert('Las preguntas de tipo "select" deben tener al menos una opción.');
        return;
      }
      
      const nuevaPregunta = {
        text: formData.nuevaPreguntaFiltro.text,
        type: formData.nuevaPreguntaFiltro.type,
        options: formData.nuevaPreguntaFiltro.type === 'select' ? [...formData.nuevaPreguntaFiltro.options] : []
      };
      
      setFormData(prevData => ({
        ...prevData,
        filterQuestions: [...prevData.filterQuestions, nuevaPregunta],
        nuevaPreguntaFiltro: {
          text: '',
          type: 'text',
          options: [],
          nuevaOpcion: ''
        }
      }));
    }
  };

  const handleRemoveFilterQuestion = (index) => {
    setFormData(prevData => {
      const nuevasPreguntas = [...prevData.filterQuestions];
      nuevasPreguntas.splice(index, 1);
      
      return {
        ...prevData,
        filterQuestions: nuevasPreguntas
      };
    });
  };

  const handleAddAsyncInterviewQuestion = () => {
    if (formData.nuevaPreguntaEntrevista.trim() !== '') {
      const nuevaPregunta = {
        text: formData.nuevaPreguntaEntrevista,
        id: `question_${Date.now()}`
      };
      
      setFormData(prevData => ({
        ...prevData,
        asyncInterviewSpecs: {
          ...prevData.asyncInterviewSpecs,
          questionBank: [...prevData.asyncInterviewSpecs.questionBank, nuevaPregunta]
        },
        nuevaPreguntaEntrevista: ''
      }));
    }
  };

  const handleRemoveAsyncInterviewQuestion = (index) => {
    setFormData(prevData => {
      const nuevasPreguntas = [...prevData.asyncInterviewSpecs.questionBank];
      nuevasPreguntas.splice(index, 1);
      
      return {
        ...prevData,
        asyncInterviewSpecs: {
          ...prevData.asyncInterviewSpecs,
          questionBank: nuevasPreguntas
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (applicationType === 'internal') {
      if (formData.asyncInterviewSpecs.questionBank.length < formData.asyncInterviewSpecs.questionsPerCandidate) {
        alert(`Debes tener al menos ${formData.asyncInterviewSpecs.questionsPerCandidate} preguntas en el banco de entrevista asíncrona. Actualmente tienes ${formData.asyncInterviewSpecs.questionBank.length}.`);
        return;
      }
    } else if (applicationType === 'external') {
      if (!formData.externalUrl.trim()) {
        alert('Debes proporcionar la URL externa para postular.');
        return;
      }
    }
    
    setIsPublishing(true);
    
    try {
      const docRef = await addDoc(collection(jobsDb, 'practicas'), {
        company: formData.company,
        descripcion: formData.descripcion,
        fecha_agregado: serverTimestamp(),
        location: formData.location,
        logo: formData.logo,
        salary: formData.salary,
        sitio_web: formData.sitio_web,
        title: formData.title,
        titulo_contactos: formData.title,
        fuente: formData.fuente,
        uid: formData.uid,
        estado: formData.estado,
        owner: process.env.REACT_APP_ACRONIMO_UNIVERSIDAD?.toLowerCase() || 'public',
        applicationType: applicationType,
        externalUrl: applicationType === 'external' ? formData.externalUrl : '',
        candidateFilters: applicationType === 'internal' ? formData.filterQuestions : [],
        asyncInterviewSpecs: applicationType === 'internal' ? formData.asyncInterviewSpecs : null,
      });

      const documentUrl = `https://www.myworkin.pe/portal-trabajo/oferta-trabajo/${docRef.id}`;
      await updateDoc(docRef, { url: documentUrl });

      setPublishSuccess(true);
      setPublishedJobId(docRef.id);
      
      // Recargar la lista de prácticas
      await loadPracticas();
      
      // Reset form
      setFormData({
        descripcion: '',
        fecha_agregado: '',
        location: '',
        salary: '',
        title: '',
        titulo_contactos: '',
        fuente: 'myworkin',
        uid: currentUser?.uid || '',
        sitio_web: '',
        logo: '',
        company: '',
        estado: 'activo',
        externalUrl: '',
        filterQuestions: [],
        nuevaPreguntaFiltro: {
          text: '',
          type: 'text',
          options: [],
          nuevaOpcion: ''
        },
        asyncInterviewSpecs: {
          questionBank: [],
          questionsPerCandidate: 5
        },
        nuevaPreguntaEntrevista: '',
        isGeneratingQuestions: false
      });
      
      setCurrentStep('basic');
      setApplicationType(null);
      setWantsFilterQuestions(false);
      
      setTimeout(() => {
        setPublishSuccess(false);
        setShowCreateModal(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error al publicar la práctica:', error);
      alert('Hubo un error al publicar la práctica.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Funciones para el flujo paso a paso
  const handleContinueToType = () => {
    if (!formData.title.trim() || !formData.descripcion.trim()) {
      alert('Por favor, completa el título y descripción antes de continuar.');
      return;
    }
    setCurrentStep('type');
  };

  const handleContinueToFilters = () => {
    if (!applicationType) {
      alert('Por favor, selecciona un tipo de aplicación.');
      return;
    }
    
    if (applicationType === 'external') {
      handleSubmit(new Event('submit'));
      return;
    }
    
    setCurrentStep('filters');
  };

  const handleContinueToInterview = () => {
    setCurrentStep('interview');
  };

  const handleSelectExternal = () => {
    setApplicationType('external');
  };

  const handleSelectInternal = () => {
    setApplicationType('internal');
  };

  const handleUseFilters = () => {
    setWantsFilterQuestions(true);
  };

  const handleSkipFilters = () => {
    setWantsFilterQuestions(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prácticas Profesionales</h1>
          <p className="text-gray-600">Gestiona las prácticas profesionales de los estudiantes</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5 inline mr-2" />
          Nueva Práctica
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Prácticas</p>
              <p className="text-2xl font-bold text-gray-900">{practicas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {practicas.filter(p => p.estado === 'activo').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Internas</p>
              <p className="text-2xl font-bold text-gray-900">
                {practicas.filter(p => p.applicationType === 'internal').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Externas</p>
              <p className="text-2xl font-bold text-gray-900">
                {practicas.filter(p => p.applicationType === 'external').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Prácticas */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Prácticas</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {practicas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay prácticas publicadas aún.</p>
              <p className="text-sm">Haz clic en "Nueva Práctica" para comenzar.</p>
            </div>
          ) : (
            practicas.map((practica) => (
              <div key={practica.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{practica.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(practica.estado)}`}>
                        {practica.estado}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        practica.applicationType === 'internal' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {practica.applicationType === 'internal' ? 'Interna' : 'Externa'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                        {practica.company}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {practica.location}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {practica.salary}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{practica.descripcion}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerDetalles(practica)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver detalles"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      {showModal && selectedPractica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Detalles de la Práctica</h3>
                <button
                  onClick={handleCerrarModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedPractica.title}</h4>
                <p className="text-gray-600">{selectedPractica.company}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ubicación</label>
                  <p className="text-gray-900">{selectedPractica.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Salario</label>
                  <p className="text-gray-900">{selectedPractica.salary}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Aplicación</label>
                  <p className="text-gray-900">{selectedPractica.applicationType === 'internal' ? 'Interna' : 'Externa'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <p className="text-gray-900">{selectedPractica.estado}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <p className="text-gray-900 mt-1">{selectedPractica.descripcion}</p>
              </div>

              {selectedPractica.applicationType === 'external' && selectedPractica.externalUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-700">URL Externa</label>
                  <a 
                    href={selectedPractica.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedPractica.externalUrl}
                  </a>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCerrarModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Editar Práctica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Crear Nueva Práctica</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {/* Indicador de pasos */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'basic' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  
                  <div className={`w-16 h-1 ${currentStep === 'type' || currentStep === 'filters' || currentStep === 'interview' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'type' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  
                  {applicationType === 'internal' && (
                    <>
                      <div className={`w-16 h-1 ${currentStep === 'filters' || currentStep === 'interview' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep === 'filters' ? 'bg-primary text-white' : currentStep === 'interview' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        3
                      </div>
                      
                      <div className={`w-16 h-1 ${currentStep === 'interview' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep === 'interview' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        4
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* PASO 1: Información básica */}
              {currentStep === 'basic' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Información básica del puesto</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título del puesto</label>
                      <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Ej. Desarrollador Frontend"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del puesto</label>
                      <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary p-3"
                        placeholder="Responsabilidades, requisitos, beneficios..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                      <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Ej. Lima"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salario</label>
                      <input
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Ej. $1000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <input
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                      <input
                        name="sitio_web"
                        value={formData.sitio_web}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="https://empresa.com"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleContinueToType}
                      disabled={!formData.title.trim() || !formData.descripcion.trim()}
                      className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: Selección de tipo de aplicación */}
              {currentStep === 'type' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de aplicación</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    ¿Cómo quieres manejar las postulaciones para esta práctica?
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        applicationType === 'external' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={handleSelectExternal}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Manejo Externo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Los candidatos serán redirigidos a tu sitio web o plataforma externa para postular.
                        </p>
                        <div className="text-xs text-gray-500">
                          ✓ Solo necesitas proporcionar un enlace<br/>
                          ✓ Proceso más rápido<br/>
                          ✓ Ideal para empresas con su propio sistema
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        applicationType === 'internal' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={handleSelectInternal}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Manejo Interno</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Los candidatos postulan directamente en nuestra plataforma con filtros y entrevistas.
                        </p>
                        <div className="text-xs text-gray-500">
                          ✓ Preguntas de filtro personalizadas<br/>
                          ✓ Entrevistas asíncronas<br/>
                          ✓ Mejor control del proceso
                        </div>
                      </div>
                    </div>
                  </div>

                  {applicationType === 'external' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL para postular
                      </label>
                      <input
                        name="externalUrl"
                        value={formData.externalUrl}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        placeholder="https://tu-empresa.com/postular"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Los candidatos serán redirigidos a esta URL cuando hagan clic en "Postular"
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('basic')}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueToFilters}
                      disabled={!applicationType || (applicationType === 'external' && !formData.externalUrl.trim())}
                      className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                      {applicationType === 'external' ? 'Publicar' : 'Continuar →'}
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: Preguntas de filtro (solo para manejo interno) */}
              {currentStep === 'filters' && applicationType === 'internal' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preguntas de filtro</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    ¿Te gustaría agregar preguntas para filtrar candidatos?
                  </p>
                  
                  <div className="flex space-x-4 mb-6">
                    <button
                      type="button"
                      onClick={handleUseFilters}
                      className={`px-6 py-3 rounded-xl transition-colors flex-1 ${
                        wantsFilterQuestions === true 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg">✓</div>
                        <div className="text-sm">Sí, agregar filtros</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipFilters}
                      className={`px-6 py-3 rounded-xl transition-colors flex-1 ${
                        wantsFilterQuestions === false 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg">✗</div>
                        <div className="text-sm">No</div>
                      </div>
                    </button>
                  </div>

                  {wantsFilterQuestions && (
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-700">Agregar preguntas de filtro</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta</label>
                          <input
                            name="nuevaPreguntaFiltro.text"
                            value={formData.nuevaPreguntaFiltro.text}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            placeholder="Ej. ¿En qué ciclo académico te encuentras?"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de respuesta</label>
                          <select
                            name="nuevaPreguntaFiltro.type"
                            value={formData.nuevaPreguntaFiltro.type}
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          >
                            <option value="text">Texto</option>
                            <option value="bool">Sí/No</option>
                            <option value="int">Número</option>
                            <option value="select">Selección múltiple</option>
                          </select>
                        </div>
                      </div>

                      {formData.nuevaPreguntaFiltro.type === 'select' && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Opciones de selección</label>
                          
                          <div className="flex gap-2 mb-3">
                            <input
                              name="nuevaPreguntaFiltro.nuevaOpcion"
                              value={formData.nuevaPreguntaFiltro.nuevaOpcion}
                              onChange={handleChange}
                              className="flex-1 h-9 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              placeholder="Agregar opción"
                            />
                            <button
                              type="button"
                              onClick={handleAddOption}
                              className="h-9 px-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            >
                              Agregar
                            </button>
                          </div>
                          
                          {formData.nuevaPreguntaFiltro.options.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">Opciones agregadas:</p>
                              <ul className="space-y-2">
                                {formData.nuevaPreguntaFiltro.options.map((opcion, index) => (
                                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded-lg">
                                    <span>{opcion}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddFilterQuestion}
                        disabled={formData.nuevaPreguntaFiltro.text.trim() === ''}
                        className="w-full h-10 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                      >
                        Agregar pregunta de filtro
                      </button>

                      {formData.filterQuestions.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium text-gray-700 mb-2">Preguntas de filtro agregadas:</h3>
                          <ul className="space-y-3">
                            {formData.filterQuestions.map((pregunta, index) => (
                              <li key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{pregunta.text}</p>
                                  <p className="text-sm text-gray-600">Tipo: {pregunta.type}</p>
                                  {pregunta.type === 'select' && pregunta.options.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                      Opciones: {pregunta.options.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFilterQuestion(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('type')}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueToInterview}
                      disabled={wantsFilterQuestions === true && formData.filterQuestions.length === 0}
                      className="px-6 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 4: Entrevista asíncrona (solo para manejo interno) */}
              {currentStep === 'interview' && applicationType === 'internal' && (
                <div className="space-y-4 h-[60vh] flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Entrevista asíncrona</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Configura las preguntas que responderán los candidatos seleccionados mediante video/audio
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de preguntas para el candidato</label>
                      <select
                        name="asyncInterviewSpecs.questionsPerCandidate"
                        value={formData.asyncInterviewSpecs.questionsPerCandidate}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setFormData(prevData => ({
                            ...prevData,
                            asyncInterviewSpecs: {
                              ...prevData.asyncInterviewSpecs,
                              questionsPerCandidate: value
                            }
                          }));
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value={3}>3 preguntas</option>
                        <option value={4}>4 preguntas</option>
                        <option value={5}>5 preguntas</option>
                        <option value={6}>6 preguntas</option>
                        <option value={7}>7 preguntas</option>
                        <option value={8}>8 preguntas</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agregar pregunta manual</label>
                      <input
                        name="nuevaPreguntaEntrevista"
                        value={formData.nuevaPreguntaEntrevista}
                        onChange={handleChange}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        placeholder="Ej. Cuéntame sobre tu experiencia trabajando en equipo"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddAsyncInterviewQuestion}
                        disabled={formData.nuevaPreguntaEntrevista.trim() === ''}
                        className="w-full h-10 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    {formData.asyncInterviewSpecs.questionBank.length > 0 ? (
                      <>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Banco de preguntas ({formData.asyncInterviewSpecs.questionBank.length} preguntas):
                        </h3>
                        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                          <ul className="space-y-3 p-3">
                            {formData.asyncInterviewSpecs.questionBank.map((pregunta, index) => (
                              <li key={pregunta.id} className="flex justify-between items-start p-3 bg-primary/10 rounded-lg border border-blue-200">
                                <div>
                                  <p className="font-medium text-blue-900">{pregunta.text}</p>
                                  <p className="text-sm text-blue-600">
                                    {pregunta.id.startsWith('generated_') ? 'Generada por IA' : 'Agregada manualmente'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAsyncInterviewQuestion(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Se seleccionarán aleatoriamente {formData.asyncInterviewSpecs.questionsPerCandidate} preguntas de este banco para cada entrevista.
                        </p>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-center">
                          No hay preguntas en el banco. Agrega algunas preguntas para continuar.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('filters')}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="submit"
                      disabled={formData.asyncInterviewSpecs.questionBank.length < formData.asyncInterviewSpecs.questionsPerCandidate || isPublishing}
                      className={`px-6 py-2 rounded-xl text-white ${
                        formData.asyncInterviewSpecs.questionBank.length < formData.asyncInterviewSpecs.questionsPerCandidate || isPublishing
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 transition-colors'
                      }`}
                    >
                      {isPublishing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Publicando...</span>
                        </div>
                      ) : (
                        'Publicar práctica'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Mensaje de éxito */}
      {publishSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Práctica Publicada!</h3>
            <p className="text-gray-600 mb-4">
              Tu práctica profesional ha sido publicada exitosamente.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              El modal se cerrará automáticamente...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practicas;
