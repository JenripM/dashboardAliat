import { useState, useEffect } from "react";
import {
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import ExportModal from "../components/ExportModal";
import { getUsersData, getCvAnalysisData, getInterviewSimulationData } from "../services/firebaseService";
import { useNavigate } from "react-router-dom";

const Estudiantes = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const navigate = useNavigate();
useEffect(() => {
  const loadEstudiantes = async () => {
    try {
      setLoading(true);

      // Cargar users + colecciones AI en paralelo
      const [usersData, cvAnalysisDocs, interviewSimDocs] = await Promise.all([
        getUsersData(),
        getCvAnalysisData(),
        getInterviewSimulationData(),
      ]);

      // Sets para joins por userId
      const userIdsWithCvAnalysis = new Set(
        cvAnalysisDocs
          .map((d) => d?.userId)
          .filter((id) => typeof id === "string" && id.trim() !== "")
      );

      const userIdsWithInterviewSim = new Set(
        interviewSimDocs
          .map((d) => d?.userId)
          .filter((id) => typeof id === "string" && id.trim() !== "")
      );

      const estudiantesData = usersData.map((user, index) => {
        const nombre = user?.displayName || "No especificado";
        const carrera = user?.career || "No especificado";
        const telefono = user?.phone || "No especificado";
        const email = user?.email || "No especificado";
        const ciclo = user?.cycle || "No especificado";
        const estado =
          user?.studentStatus === "Egresado"
            ? "Egresado"
            : user?.studentStatus === "Estudiante"
            ? "Estudiante"
            : "No especificado";

        // CV file
        const cvFileUrl = user?.cvFileUrl ?? "";
        const hasCV = typeof cvFileUrl === "string" && cvFileUrl.trim() !== "";

        // createdAtMs y fecha legible
        let createdAtMs = 0;
        let fecha = "No especificado";
        const createdAt = user?.createdAt;

        if (createdAt) {
          if (createdAt?.toDate && typeof createdAt.toDate === "function") {
            const d = createdAt.toDate();
            createdAtMs = d.getTime();
            fecha = d.toLocaleDateString("es-ES");
          } else if (createdAt instanceof Date) {
            createdAtMs = createdAt.getTime();
            fecha = createdAt.toLocaleDateString("es-ES");
          } else if (typeof createdAt === "string") {
            const d = new Date(createdAt);
            if (!isNaN(d.getTime())) {
              createdAtMs = d.getTime();
              fecha = d.toLocaleDateString("es-ES");
            }
          }
        }

        // ID consistente para el join
        const userIdForJoin = user?.id || user?.uid || "";

        const hasCvAnalysis =
          typeof userIdForJoin === "string" &&
          userIdsWithCvAnalysis.has(userIdForJoin);

        const hasInterviewSim =
          typeof userIdForJoin === "string" &&
          userIdsWithInterviewSim.has(userIdForJoin);

        return {
          id: user?.id || user?.uid || index + 1,
          nombre,
          carrera,
          telefono,
          email,
          ciclo,
          fecha,
          estado,
          createdAt,
          createdAtMs,
          cvFileUrl,
          hasCV,
          hasCvAnalysis,
          hasInterviewSim,
        };
      });

      // ORDEN: ambos > cvAnalysis > interviewSim > CV > fecha
      estudiantesData.sort((a, b) => {
        const aBoth = a.hasCvAnalysis && a.hasInterviewSim ? 1 : 0;
        const bBoth = b.hasCvAnalysis && b.hasInterviewSim ? 1 : 0;
        if (bBoth - aBoth !== 0) return bBoth - aBoth;

        const aCv = a.hasCvAnalysis ? 1 : 0;
        const bCv = b.hasCvAnalysis ? 1 : 0;
        if (bCv - aCv !== 0) return bCv - aCv;

        const aInt = a.hasInterviewSim ? 1 : 0;
        const bInt = b.hasInterviewSim ? 1 : 0;
        if (bInt - aInt !== 0) return bInt - aInt;

        const aHas = a.hasCV ? 1 : 0;
        const bHas = b.hasCV ? 1 : 0;
        if (bHas - aHas !== 0) return bHas - aHas;

        return (b.createdAtMs || 0) - (a.createdAtMs || 0);
      });

      setEstudiantes(estudiantesData);
    } catch (err) {
      console.error("Error cargando estudiantes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  loadEstudiantes();
}, []);

  const handleExport = (selectedFields) => {
    // Here you would implement the CSV export logic
    console.log("Exporting with fields:", selectedFields);
    setIsExportModalOpen(false);
  };

  // Filtrar estudiantes basado en búsqueda y estado
  const filteredEstudiantes = estudiantes.filter((estudiante) => {
    const matchesSearch =
      estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.carrera.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.ciclo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Egresado" && estudiante.estado === "Egresado") ||
      (statusFilter === "Estudiante" && estudiante.estado === "Estudiante");

    return matchesSearch && matchesStatus;
  });

  // Mostrar loading
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Estudiantes
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualiza el progreso y métricas de empleabilidad de tus
              estudiantes
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando estudiantes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Estudiantes
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualiza el progreso y métricas de empleabilidad de tus
              estudiantes
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar estudiantes
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Estudiantes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Visualiza el progreso y métricas de empleabilidad de tus estudiantes
          </p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="max-w-sm">
            <input
              type="text"
              placeholder="Buscar estudiantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Exportar seleccionadas
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Seleccionar fechas
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option>Todos</option>
              <option>Egresado</option>
              <option>Estudiante</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="min-w-max divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carrera
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciclo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha De Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {estudiante.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.carrera}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.ciclo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.telefono !== "No especificado" ? (
                      <a
                        href={`https://wa.me/${estudiante.telefono.replace(
                          "+",
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-green-600"
                      >
                        {estudiante.telefono}
                        <svg
                          className="w-4 h-4 ml-1 text-green-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.994 9.994 0 004.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0012.012 2zm-3.706 8.416a.557.557 0 01-.089-.003c-.398-.083-1.037-.383-1.553-.899-.516-.516-.816-1.155-.899-1.553a.567.567 0 01.564-.683c.398 0 .815.166 1.053.404.238.238.404.655.404 1.053 0 .311-.251.562-.562.562h-.006a.557.557 0 01.088.119zm6.406 6.406c-.311 0-.562-.251-.562-.562 0-.398.166-.815.404-1.053.238-.238.655-.404 1.053-.404.311 0 .562.251.562.562 0 .398-.166.815-.404 1.053-.238.238-.655.404-1.053.404zm3.294-3.294c-.083.398-.383 1.037-.899 1.553-.516.516-1.155.816-1.553.899a.567.567 0 01-.683-.564c0-.398.166-.815.404-1.053.238-.238.655-.404 1.053-.404.311 0 .562.251.562.562v.006a.557.557 0 01.116.001z" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-400">
                        {estudiante.telefono}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.email !== "No especificado" ? (
                      <a
                        href={`mailto:${estudiante.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {estudiante.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">{estudiante.email}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {estudiante.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  
                      {estudiante.estado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => navigate(`/estudiantes/${estudiante.id}`)} // Navegar a la página de detalle
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Anterior
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{" "}
                <span className="font-medium">
                  {filteredEstudiantes.length}
                </span>{" "}
                de <span className="font-medium">{estudiantes.length}</span>{" "}
                estudiantes
                {searchTerm && (
                  <span className="ml-2 text-gray-500">
                    (filtrados por "{searchTerm}")
                  </span>
                )}
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Anterior
                </button>
                <button className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
};

export default Estudiantes;
