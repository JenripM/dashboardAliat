import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Ajusta la ruta según tu estructura
import {usersDb} from "../config/firebaseInstances";
const IconClock = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm.75 5.5a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 .44.68l3.5 1.75a.75.75 0 1 0 .66-1.35L12.75 11.9Z" />
  </svg>
);

const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M10 15.172 6.414 11.586 5 13l5 5 9-9-1.414-1.414Z" />
  </svg>
);

const IconX = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.3-6.3Z" />
  </svg>
);

const EstadoPill = ({ value }) => {
  const v = (value || "pendiente").toLowerCase();
  const map = {
    aprobado: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <IconCheck className="w-4 h-4 text-green-600" />,
    },
    rechazado: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <IconX className="w-4 h-4 text-red-600" />,
    },
    pendiente: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: <IconClock className="w-4 h-4 text-yellow-700" />,
    },
  };
  const s = map[v] ?? map.pendiente;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      {s.icon}
      <span className="capitalize">{v}</span>
    </span>
  );
};

const Convalidacion = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [term, setTerm] = useState("");
  const [periodo, setPeriodo] = useState("all");
  const [estado, setEstado] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener todas las solicitudes
        const querySnapshot = await getDocs(collection(db, "solicitudes_practicas"));
        const solicitudes = [];
        const userIds = new Set();
        
        // Primero recopilar todos los userIds únicos
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId) {
            userIds.add(data.userId);
          }
        });
        
        console.log("User IDs encontrados:", Array.from(userIds));
        
        // Obtener solo los usuarios necesarios
        const usersMap = {};
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(usersDb, "users", userId));
            if (userDoc.exists()) {
              usersMap[userId] = userDoc.data();
              console.log(`Usuario ${userId} encontrado:`, userDoc.data());
            } else {
              console.log(`Usuario ${userId} no encontrado`);
              usersMap[userId] = { displayName: "Usuario no encontrado" };
            }
          } catch (userError) {
            console.error(`Error al obtener usuario ${userId}:`, userError);
            usersMap[userId] = { displayName: "Error al cargar" };
          }
        }
        
        // Procesar cada solicitud
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const userInfo = data.userId ? usersMap[data.userId] : { displayName: "Sin usuario" };
          
          const solicitud = {
            id: doc.id,
            periodo: data.informeInicial?.periodo || "No especificado",
            estudiante: {
              nombre: data.estudiante?.nombre,
              email: data.estudiante?.email,

              codigo: data.estudiante?.codigoEstudiante || ""
            },
            empresa: data.empresa ? {
              razonSocial: data.empresa.razonSocial,
              ruc: data.empresa.ruc
            } : null,
            puesto: data.informeInicial?.puestoNombre || "",
            duracion: data.informeInicial?.duracion || "",
            tipo: data.informeInicial?.tipoPractica || "",
            informeInicial: data.informeInicial?.estado || "pendiente",
            informeFinal: data.informeFinal?.estadoInformeFinal || null,
            userId: data.userId
          };
          
          solicitudes.push(solicitud);
        });

        setData(solicitudes);
        setLoading(false);
        console.log("Todos los datos procesados:", solicitudes);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setError("Error al cargar los datos");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const periodos = useMemo(
    () => Array.from(new Set(data.map((d) => d.periodo))).sort(),
    [data]
  );
  const estados = ["aprobado", "rechazado", "pendiente"];

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const t = term.trim().toLowerCase();
      const matchSearch =
        !t ||
        d.estudiante?.nombre?.toLowerCase().includes(t) ||
        d.estudiante?.codigo?.toLowerCase().includes(t) ||
        d.empresa?.razonSocial?.toLowerCase().includes(t) ||
        d.puesto?.toLowerCase().includes(t);

      const matchPeriodo = periodo === "all" || d.periodo === periodo;

      const estadoRef = (d.informeInicial || "pendiente").toLowerCase();
      const matchEstado = estado === "all" || estadoRef === estado;

      return matchSearch && matchPeriodo && matchEstado;
    });
  }, [data, term, periodo, estado]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Convalidación de Prácticas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de solicitudes de prácticas profesionales
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v12m0-12 4 4m-4-4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buscador */}
        <div className="relative">
          <input
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar por empresa, puesto, código o nombre..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M11 19a8 8 0 1 1 5.292-2.708L21 21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Período */}
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="all">Todos los períodos</option>
          {periodos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Estado */}
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e} className="capitalize">
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filtered.length} de {data.length} solicitudes
        </p>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Periodo</th>
                <th className="px-4 py-3 font-semibold">Estudiante</th>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Puesto</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Informe Inicial</th>
                <th className="px-4 py-3 font-semibold">Informe Final</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{s.periodo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {s.estudiante?.nombre || "-"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {s.estudiante?.codigo || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.empresa ? (
                      <>
                        <div className="font-medium text-gray-900">
                          {s.empresa.razonSocial}
                        </div>
                        <div className="text-xs text-gray-600">
                          {s.empresa.ruc}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Sin empresa</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.puesto}</div>
                    <div className="text-xs text-gray-600">{s.duracion}</div>
                  </td>
                  <td className="px-4 py-3">{s.tipo}</td>
                  <td className="px-4 py-3">
                    <EstadoPill value={s.informeInicial} />
                  </td>
                  <td className="px-4 py-3">
                    {s.informeFinal ? (
                      <EstadoPill value={s.informeFinal} />
                    ) : (
                      <EstadoPill value="pendiente" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/convalidacion/${s.id}`, {
                          state: { solicitud: s },
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No se encontraron resultados con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Convalidacion;