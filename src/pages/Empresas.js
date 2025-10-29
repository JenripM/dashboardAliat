import { useMemo, useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db2 } from '../credentials/companies';
import * as XLSX from 'xlsx'; // Asegúrate de instalar esta librería: npm install xlsx

const statusStyles = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

const Empresas = () => {
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db2, 'companies'));
      const companiesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompanies(companiesList);
    } catch (error) {
      console.error("Error fetching companies: ", error);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return companies;
    return companies.filter((c) => c.status === filter);
  }, [companies, filter]);

  const updateStatus = async (id, status) => {
    try {
      const companyRef = doc(db2, 'companies', id);
      await updateDoc(companyRef, { status });
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setUploadError('');

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // Procesar archivo Excel
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          setUploadData(JSON.stringify(jsonData, null, 2));
        } else if (fileExtension === 'csv') {
          // Procesar CSV
          setUploadData(e.target.result);
        } else if (fileExtension === 'json') {
          // Procesar JSON
          setUploadData(e.target.result);
        } else {
          setUploadError('Formato de archivo no soportado');
          return;
        }
      } catch (error) {
        setUploadError('Error al procesar el archivo: ' + error.message);
      }
    };

    reader.onerror = () => {
      setUploadError('Error al leer el archivo');
    };

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processUploadData = async () => {
    if (!uploadData.trim()) {
      setUploadError('No hay datos para procesar');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      let companiesToUpload = [];

      // Intentar parsear como JSON (para JSON y Excel convertido)
      try {
        const jsonData = JSON.parse(uploadData);
        companiesToUpload = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch (jsonError) {
        // Si falla JSON, intentar como CSV
        companiesToUpload = parseCSV(uploadData);
      }

      // Validar y subir empresas
      const validCompanies = [];
      const invalidCompanies = [];

      for (const company of companiesToUpload) {
        const validatedCompany = validateCompanyData(company);
        if (validatedCompany) {
          validCompanies.push(validatedCompany);
        } else {
          invalidCompanies.push(company);
        }
      }

      // Subir empresas válidas
      for (const company of validCompanies) {
        await addDoc(collection(db2, 'companies'), {
          ...company,
          createdAt: new Date(),
          status: 'pending'
        });
      }

      // Refrescar la lista
      await fetchCompanies();
      setUploadModal(false);
      setUploadData('');
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      let successMessage = `Se subieron ${validCompanies.length} empresas exitosamente`;
      if (invalidCompanies.length > 0) {
        successMessage += `. ${invalidCompanies.length} empresas fueron omitidas por datos incompletos.`;
      }
      
      alert(successMessage);
    } catch (error) {
      console.error("Error uploading companies: ", error);
      setUploadError('Error al procesar los datos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const parseCSV = (csvData) => {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una de datos');
    }

    const headers = lines[0].split(',').map(header => 
      header.trim().toLowerCase().replace(/\s+/g, '')
    );
    const companies = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      const company = {};
      
      headers.forEach((header, index) => {
        company[header] = values[index] || '';
      });
      
      companies.push(company);
    }

    return companies;
  };

  const validateCompanyData = (company) => {
    // Normalizar keys (remover espacios y convertir a minúsculas)
    const normalizedCompany = {};
    Object.keys(company).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      normalizedCompany[normalizedKey] = company[key];
    });

    // Campos mínimos requeridos
    const requiredFields = ['displayname', 'contactemail'];
    const missingFields = requiredFields.filter(field => 
      !normalizedCompany[field] || normalizedCompany[field].toString().trim() === ''
    );
    
    if (missingFields.length > 0) {
      console.warn(`Empresa omitida - Campos faltantes: ${missingFields.join(', ')}`);
      return null;
    }

    // Mapear campos a formato consistente
    return {
      displayName: normalizedCompany.displayname || normalizedCompany.nombre || normalizedCompany.empresa || '',
      description: normalizedCompany.description || normalizedCompany.descripcion || '',
      sector: normalizedCompany.sector || normalizedCompany.industria || normalizedCompany.industry || '',
      contactEmail: normalizedCompany.contactemail || normalizedCompany.email || normalizedCompany.correo || '',
      companySize: normalizedCompany.companysize || normalizedCompany.tamaño || normalizedCompany.size || normalizedCompany.employees || '',
      website: normalizedCompany.website || normalizedCompany.sitio || normalizedCompany.web || '',
      phone: normalizedCompany.phone || normalizedCompany.telefono || normalizedCompany.tel || ''
    };
  };

  const downloadTemplate = (format) => {
    const templateData = [
      {
        displayName: "Mi Empresa SA",
        contactEmail: "contacto@miempresa.com",
        sector: "Tecnología",
        companySize: "50-100",
        description: "Descripción de la empresa",
        website: "https://miempresa.com",
        phone: "+1234567890"
      },
      {
        displayName: "Otra Empresa",
        contactEmail: "info@otraempresa.com", 
        sector: "Consultoría",
        companySize: "10-50",
        description: "Otra descripción",
        website: "https://otraempresa.com",
        phone: "+0987654321"
      }
    ];

    if (format === 'excel') {
      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Empresas");
      XLSX.writeFile(wb, 'plantilla-empresas.xlsx');
    } else {
      // JSON
      const jsonTemplate = JSON.stringify(templateData, null, 2);
      const blob = new Blob([jsonTemplate], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-empresas.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadCSVTemplate = () => {
    const csvTemplate = `displayName,contactEmail,sector,companySize,description,website,phone
"Mi Empresa SA","contacto@miempresa.com","Tecnología","50-100","Descripción de la empresa","https://miempresa.com","+1234567890"
"Otra Empresa","info@otraempresa.com","Consultoría","10-50","Otra descripción","https://otraempresa.com","+0987654321"`;
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-empresas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Modal para subir empresas */}
      {uploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">Subir Empresas</h3>
                <button
                  onClick={() => {
                    setUploadModal(false);
                    setUploadError('');
                    setUploadData('');
                    setFileName('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seleccionar archivo
                  </label>
                  <input
                    type="file"
                    accept=".json,.csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {fileName && (
                    <p className="mt-1 text-sm text-gray-600">Archivo seleccionado: {fileName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    O pegar datos directamente (JSON)
                  </label>
                  <textarea
                    value={uploadData}
                    onChange={(e) => setUploadData(e.target.value)}
                    rows="6"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder={`Formato JSON: [{"displayName": "Empresa", "contactEmail": "email@empresa.com", ...}]\n\nFormatos soportados: JSON, CSV, Excel (.xlsx, .xls)`}
                  />
                </div>

                {uploadError && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{uploadError}</div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Descargar plantilla:</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadTemplate('excel')}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </button>
                    <button
                      onClick={downloadCSVTemplate}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </button>
                    <button
                      onClick={() => downloadTemplate('json')}
                      className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      JSON
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-gray-600">
                    Formatos soportados: Excel, CSV, JSON
                  </div>
                  
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setUploadModal(false);
                        setUploadError('');
                        setUploadData('');
                        setFileName('');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={processUploadData}
                      disabled={uploading || !uploadData.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        'Subir Empresas'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header y controles */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona solicitudes de conexión de empresas empleadoras
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Subir Empresas
          </button>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aceptadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="active">Activas</option>
          </select>
        </div>
      </div>

      {/* Resto del componente permanece igual */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b text-xs font-medium text-gray-500">
          <div className="col-span-4">Empresa</div>
          <div className="col-span-2">Industria</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-1">Tamaño</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {filtered.map((c) => (
          <div key={c.id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b last:border-b-0 items-center">
            <div className="col-span-4">
              <div className="font-medium text-gray-900">{c.displayName}</div>
              <div className="text-sm text-gray-500">{c.description}</div>
              <div className="text-xs text-gray-400 mt-1">
                Desde{' '}
                {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div className="col-span-2 text-gray-700">{c.sector}</div>
            <div className="col-span-2 text-blue-600">{c.contactEmail}</div>
            <div className="col-span-1 text-gray-700">{c.companySize}</div>
            <div className="col-span-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ${statusStyles[c.status] || statusStyles.pending}`}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
            <div className="col-span-2 flex justify-end space-x-2">
              <button
                onClick={() => updateStatus(c.id, 'active')}
                className="px-3 py-1 text-sm rounded-md border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50"
                disabled={c.status === 'active'}
              >
                Aceptar
              </button>
              <button
                onClick={() => updateStatus(c.id, 'rejected')}
                className="px-3 py-1 text-sm rounded-md border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={c.status === 'rejected'}
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Empresas;