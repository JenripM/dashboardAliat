import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // ajusta la ruta si difiere
/* ===========================
   Utilidades simples
=========================== */
const formatDateES = (d) => {
  if (!d) return "Sin fecha";
  try {
    const date =
      typeof d === "string"
        ? new Date(d)
        : typeof d?.toDate === "function"
        ? d.toDate()
        : new Date(d);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
};

const Badge = ({ children, tone = "gray", className = "" }) => {
  const tones = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

const PillSubido = () => <Badge tone="green">Subido</Badge>;
const PillPendiente = () => <Badge tone="gray">Pendiente</Badge>;
const PillAprobado = () => <Badge tone="green">Aprobado</Badge>;

/* ===========================
   Modal centrado (Tailwind puro)
=========================== */
function Modal({ open, onClose, title, icon, children, wide = "max-w-4xl" }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* container centrado */}
      <div className="absolute inset-0 flex min-h-full items-center justify-center p-4 sm:p-6">
        {/* panel */}
        <div
          className={`w-full ${wide} bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden`}
        >
          {/* header */}
          <div className="flex items-center gap-2 border-b px-5 h-14">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-gray-700"
                fill="none"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {/* contenido con scroll interno */}
          <div className="px-5 pb-5 pt-4 overflow-y-auto max-h-[calc(90vh-56px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Iconos inline (SVGs)
=========================== */
const IconBuilding = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-gray-700"
    fill="none"
    {...props}
  >
    <path
      d="M3 21h18M6 21V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v17M6 8h9M6 12h9M6 16h9M16 21v-4h3v4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
const IconDoc = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-gray-700"
    fill="none"
    {...props}
  >
    <path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V8L14 2z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconUser = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-gray-700"
    fill="none"
    {...props}
  >
    <path
      d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 9a7 7 0 0 0-14 0"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
const IconInfo = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-blue-600"
    fill="none"
    {...props}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8h.01M11 11h2v5h-2z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconCheck = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-green-600"
    fill="none"
    {...props}
  >
    <path
      d="M20 6 9 17l-5-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconClock = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 text-blue-600"
    fill="none"
    {...props}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 7v5l3 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const IconMap = (props) => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 text-gray-500"
    fill="none"
    {...props}
  >
    <path
      d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/* ===========================
   Bloques visuales genéricos
=========================== */
const Section = ({ title, icon, children, className = "" }) => (
  <div className={`border rounded-xl p-4 sm:p-5 ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="text-lg font-semibold">{title}</h4>
    </div>
    {children}
  </div>
);

const Labeled = ({ label, children }) => (
  <div>
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-sm text-gray-900 mt-0.5">{children}</div>
  </div>
);

/* ===========================
   Contenidos de Modales
=========================== */
function EmpresaModalContent({ student }) {
  const st = student || {};
  return (
    <div className="space-y-6">
      <Section title="Datos de la Empresa" icon={<IconBuilding />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Labeled label="Razón Social">
              {st.empresa?.razonSocial || "No especificada"}
            </Labeled>
            <Labeled label="RUC">
              {st.empresa?.ruc || "No especificado"}
            </Labeled>
            <div>
              <div className="text-sm text-gray-500">Estado</div>
              <div className="mt-1">
                {st.empresa?.estado === "aprobado" && (
                  <Badge tone="green">Aprobada</Badge>
                )}
                {st.empresa?.estado === "pendiente" && (
                  <Badge tone="yellow">Pendiente</Badge>
                )}
                {st.empresa?.estado === "rechazado" && (
                  <Badge tone="red">Rechazada</Badge>
                )}
                {!st.empresa?.estado && <Badge>Sin estado</Badge>}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Labeled label="Teléfono">
              {st.empresa?.telefono || "No especificado"}
            </Labeled>
            <Labeled label="Email">
              {st.empresa?.email || "No especificado"}
            </Labeled>
            <div>
              <div className="text-sm text-gray-500">Dirección</div>
              <div className="text-sm text-gray-900 mt-0.5 inline-flex items-center gap-1">
                <IconMap />
                {st.empresa?.direccion || "No especificada"}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Datos del Supervisor" icon={<IconUser />}>
        {st.supervisor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Labeled label="Nombre Completo">
                {st.supervisor?.nombre || "No especificado"}
              </Labeled>
              <Labeled label="Cargo">
                {st.supervisor?.cargo || "No especificado"}
              </Labeled>
            </div>
            <div className="space-y-4">
              <Labeled label="Email">
                {st.supervisor?.email || "No especificado"}
              </Labeled>
              <Labeled label="Teléfono">
                {st.supervisor?.telefono || "No especificado"}
              </Labeled>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No hay supervisor asignado</p>
          </div>
        )}
      </Section>
    </div>
  );
}

function InformeInicialModalContent({ student }) {
  const s = student || {}; // Esto asegura que no sea undefined o null

  const estadoInicial = s?.informeInicial?.estado || "pendiente";
  const empresaPendiente = s?.empresa?.estado === "pendiente";

  return (
    <div className="space-y-6">
      {/* Estado del proceso */}
      <div className="border rounded-xl p-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <IconInfo />
          <div className="font-semibold text-gray-900">Estado del Proceso</div>
        </div>
        <div className="text-sm text-gray-700">
          Fase 1: Informe Inicial –{" "}
          {empresaPendiente
            ? "Bloqueado (Empresa pendiente de aprobación)"
            : "En proceso de validación administrativa"}
        </div>
      </div>

      {/* Información del Estudiante */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Información del Estudiante" icon={<IconUser />}>
          <div className="grid grid-cols-1 gap-4">
            <Labeled label="Nombre Completo">
              {s?.estudiante?.nombre || "No especificado"}
            </Labeled>
            <Labeled label="Código de Estudiante">
              {s?.estudiante?.codigoEstudiante || "No especificado"}
            </Labeled>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Carrera y Período</span>
              <span className="text-sm text-gray-900">
                {s?.estudiante?.carrera || "—"} /{" "}
                {s?.informeInicial?.periodo || "—"}
              </span>
            </div>
          </div>
        </Section>

        {/* Detalles de la Solicitud */}
        <Section title="Detalles de la Solicitud" icon={<IconDoc />}>
          <div className="grid grid-cols-1 gap-4">
            <Labeled label="Fecha de Solicitud">
              {formatDateES(s?.informeInicial?.fechaInformeInicial)}
            </Labeled>
            <div>
              <div className="text-sm text-gray-500">Estado Actual</div>
              <div className="mt-1">
                {estadoInicial === "aprobado" ? (
                  <PillAprobado />
                ) : (
                  <Badge>{estadoInicial}</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tipo de Práctica</div>
              <div className="mt-1">
                <Badge tone="green">
                  {s?.informeInicial?.tipoPractica || "—"}
                </Badge>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Información de la Empresa y Supervisor */}
      <Section
        title="Información de la Empresa y Supervisor"
        icon={<IconBuilding />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Labeled label="Empresa">
              {s?.empresa?.razonSocial || "Sin empresa"}
            </Labeled>
            <Labeled label="Área y Puesto">
              {s?.informeInicial?.puestoNombre || "—"}
            </Labeled>
            <div className="text-sm text-gray-900 inline-flex items-center gap-1">
              <IconMap />
              {s?.informeInicial?.ubicacion || "—"}
            </div>
          </div>
          <div className="space-y-3">
            <Labeled label="Supervisor y cargo">
              {(s?.supervisor?.nombre || "—") +
                " - " +
                (s?.supervisor?.cargo || "—")}
            </Labeled>
            <Labeled label="Email y teléfono del Supervisor">
              {(s?.supervisor?.email || "—") +
                " - " +
                (s?.supervisor?.telefono || "—")}
            </Labeled>
            <Labeled label="Horario de Prácticas">
              {(s?.informeInicial?.horasPractica || "—") + " horas/semana"}
            </Labeled>
          </div>
        </div>
      </Section>

      {/* Documentos Requeridos */}
      <Section title="Documentos Requeridos - Fase 1" icon={<IconDoc />}>
        <div className="space-y-3">
          {[
            {
              label: "Convenio de Prácticas",
              desc: "Contrato tripartito",
              url: s?.informeInicial?.convenioPracticas,
            },
            {
              label: "Plan de Capacitación",
              desc: "Formato universitario",
              url: s?.informeInicial?.planCapacitacion,
            },
          ].map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium">{d.label}</div>
                <div className="text-sm text-gray-600">{d.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                {d.url ? <PillSubido /> : <PillPendiente />}
                {d.url && (
                  <button
                    onClick={() => window.open(d.url, "_blank")}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Ver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Flujo */}
      <Section title="Flujo de Validación - Fase 1" icon={<IconCheck />}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5">
              <IconCheck />
            </span>
            <div>
              <div className="font-medium">Solicitud Enviada</div>
              <div className="text-sm text-gray-600">
                {formatDateES(s?.informeInicial?.fechaInformeInicial)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 ${
                s?.informeInicial?.convenioPracticas ? "" : "opacity-60"
              }`}
            >
              {s?.informeInicial?.convenioPracticas ? (
                <IconCheck />
              ) : (
                <IconClock />
              )}
            </span>
            <div>
              <div className="font-medium">Convenio de Prácticas</div>
              <div className="text-sm text-gray-600">
                {s?.informeInicial?.convenioPracticas
                  ? "Documento enviado"
                  : "Pendiente de envío"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 ${
                s?.informeInicial?.planCapacitacion ? "" : "opacity-60"
              }`}
            >
              {s?.informeInicial?.planCapacitacion ? (
                <IconCheck />
              ) : (
                <IconClock />
              )}
            </span>
            <div>
              <div className="font-medium">Plan de Capacitación</div>
              <div className="text-sm text-gray-600">
                {s?.informeInicial?.planCapacitacion
                  ? "Documento enviado"
                  : "Pendiente de envío"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5">
              <IconClock />
            </span>
            <div>
              <div className="font-medium">Revisión Administrativa</div>
              <div className="text-sm text-gray-600">
                Validando documentos y información
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 opacity-70">
            <span className="mt-0.5">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-gray-400"
                fill="none"
              >
                <path
                  d="M12 3v18M6 7h12M6 12h12M6 17h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
            <div>
              <div className="font-medium">Aprobación Final</div>
              <div className="text-sm text-gray-600">
                Pendiente de aprobación
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function InformeFinalModalContent({ student }) {
  const s = student || {}; // Asegúrate de que `student` no sea undefined

  const final = s?.informeFinal || {}; // Extrae `informeFinal` del objeto `student`

  return (
    <div className="space-y-6">
      {/* Resumen del Informe Final */}
      <Section title="Resumen del Informe Final" icon={<IconCheck />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Labeled label="Estado">
            {final?.estadoInformeFinal ? (
              <PillAprobado />
            ) : (
              <Badge>Sin estado</Badge>
            )}
          </Labeled>
          <Labeled label="Fecha">
            {formatDateES(final?.fechaInformeFinal)}
          </Labeled>
          <div>
            <div className="text-sm text-gray-500">
              Calificación de la Empresa
            </div>
            <div className="mt-1 flex items-center gap-2">
              {final?.calificacionEmpresa ? <PillSubido /> : <PillPendiente />}
              {final?.calificacionEmpresa && (
                <button
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  onClick={() =>
                    window.open(final.calificacionEmpresa, "_blank")
                  }
                >
                  Ver
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Certificaciones */}
      <Section title="Certificaciones" icon={<IconDoc />}>
        <div className="space-y-3">
          {[
            { label: "Certijoven", url: final?.certiJoven },
            { label: "Certificado de Prácticas", url: final?.certiPracticas },
          ].map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="text-sm text-gray-600">
                  Archivo del certificado
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.url ? <PillSubido /> : <PillPendiente />}
                {c.url && (
                  <button
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                    onClick={() => window.open(c.url, "_blank")}
                  >
                    Ver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Formulario */}
      <Section title="Formulario" icon={<IconDoc />}>
        {final?.formulario && Object.keys(final.formulario).length > 0 ? (
          <div className="divide-y">
            {Object.entries(final.formulario).map(([k, v]) => (
              <div key={k} className="py-3">
                <div className="text-sm font-semibold text-gray-900">
                  {v?.pregunta || "-"}
                </div>
                <div className="text-sm text-gray-700 mt-0.5">
                  {v?.respuesta || "-"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">Sin preguntas registradas</div>
        )}
      </Section>

      {/* Observaciones */}
      {final?.observaciones && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-orange-600"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 8h.01M11 11h2v5h-2z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-medium text-orange-800">Observaciones</span>
          </div>
          <div className="text-sm text-orange-800 whitespace-pre-wrap">
            {final.observaciones}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Página Detalle con los 3 modales
=========================== */
const ConvalidacionDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const solicitud = location.state || {};

  const [openEmpresa, setOpenEmpresa] = useState(false);
  const [openInicial, setOpenInicial] = useState(false);
  const [openFinal, setOpenFinal] = useState(false);

  const [solicitudes, setSolicitud] = useState(null);

  const [estadoEmpresa, setEstadoEmpresa] = useState("");
  const [estadoInformeInicial, setEstadoInformeInicial] = useState("pendiente");
  const [estadoInformeFinal, setEstadoInformeFinal] = useState("pendiente"); // Estado para el estado del informe final

  const estadoPill = useMemo(() => {
    if (estadoEmpresa === "aprobado")
      return <Badge tone="green">Aprobada</Badge>;
    if (estadoEmpresa === "pendiente")
      return <Badge tone="yellow">Pendiente</Badge>;
    if (estadoEmpresa === "rechazado")
      return <Badge tone="red">Rechazada</Badge>;
    return <Badge>Sin estado</Badge>;
  }, [estadoEmpresa]);

  // dentro del componente ConvalidacionDetail
  useEffect(() => {
    if (!id) return;

    const fetchSolicitud = async () => {
      try {
        const ref = doc(db, "solicitudes_practicas", id); // Asegúrate de que la colección sea correcta
        const docSnap = await getDoc(ref);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(data,"DATA");
          setSolicitud(data);
          setEstadoEmpresa(data?.empresa?.estado || ""); // Asignar el estado de la empresa
          setEstadoInformeInicial(data?.informeInicial?.estado || "pendiente"); // Asignar el estado del informe inicial
          setEstadoInformeFinal(data?.informeFinal?.estado || "pendiente"); // Asignar el estado del informe final
        } else {
          console.log("No se encontró la solicitud con ese ID");
        }
      } catch (error) {
        console.error("Error al cargar la solicitud:", error);
      }
    };

    fetchSolicitud(); // Llamamos la función para cargar la solicitud
  }, [id]); // Este efecto se ejecuta solo cuando el `id` cambia

  //EMPRESA
  const handleApprove = async () => {
    try {
      // Actualiza el estado de la empresa a "aprobado"
      const empresaRef = doc(db, "solicitudes_practicas", id); // id es el ID de la solicitud
      await updateDoc(empresaRef, {
        "empresa.estado": "aprobado",
      });

      // Actualiza el estado localmente
      setEstadoEmpresa("aprobado");
      console.log("Empresa aprobada correctamente.");
    } catch (error) {
      console.error("Error al aprobar la empresa: ", error);
    }
  };

  const handleReject = async () => {
    try {
      // Actualiza el estado de la empresa a "rechazado"
      const empresaRef = doc(db, "solicitudes_practicas", id); // id es el ID de la solicitud
      await updateDoc(empresaRef, {
        "empresa.estado": "rechazado",
      });

      // Actualiza el estado localmente
      setEstadoEmpresa("rechazado");
      console.log("Empresa rechazada correctamente.");
    } catch (error) {
      console.error("Error al rechazar la empresa: ", error);
    }
  };

  //INFORME INICIAL
  const handleAccept = async () => {
    try {
      const ref = doc(db, "solicitudes_practicas", id); // Asegúrate de tener el ID de la solicitud
      await updateDoc(ref, {
        "informeInicial.estado": "aprobado",
      });

      // Actualiza el estado localmente
      setEstadoInformeInicial("aprobado");
      console.log("Informe Inicial aprobado");
    } catch (error) {
      console.error("Error al aprobar el informe inicial: ", error);
    }
  };

  const handleRejectInformeInicial = async () => {
    try {
      const ref = doc(db, "solicitudes_practicas", id); // Asegúrate de tener el ID de la solicitud
      await updateDoc(ref, {
        "informeInicial.estado": "devuelto_con_observaciones",
      });

      // Actualiza el estado localmente
      setEstadoInformeInicial("devuelto_con_observaciones");
      console.log("Informe Inicial rechazado y devuelto con observaciones");
    } catch (error) {
      console.error("Error al rechazar el informe inicial: ", error);
    }
  };


    const handleAcceptInformeFinal = async () => {
    try {
      const ref = doc(db, "solicitudes_practicas", id);
      await updateDoc(ref, {
        "informeFinal.estado": "aprobado",
      });

      setEstadoInformeFinal("aprobado"); // Actualiza el estado localmente
      console.log("Informe Final aprobado");
    } catch (error) {
      console.error("Error al aprobar el informe final:", error);
    }
  };

  // Función para manejar el clic en Rechazar Informe Final
  const handleRejectInformeFinal = async () => {
    try {
      const ref = doc(db, "solicitudes_practicas", id);
      await updateDoc(ref, {
        "informeFinal.estado": "devuelto_con_observaciones",
      });

      setEstadoInformeFinal("devuelto_con_observaciones"); // Actualiza el estado localmente
      console.log("Informe Final rechazado y devuelto con observaciones");
    } catch (error) {
      console.error("Error al rechazar el informe final:", error);
    }
  };
  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
      >
        ← Volver
      </button>

      <div>
        <h1 className="text-2xl font-bold">Detalle de la Solicitud </h1>
        <p className="text-gray-700">
          Estudiante: {solicitud?.estudiante?.nombre || "No encontrado"}
        </p>
      </div>

      {/* Bloque: Informes de Prácticas (como tu captura) */}
      <div className="border rounded-2xl p-4 sm:p-5 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-gray-700"
            fill="none"
          >
            <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 8h8M8 12h8M8 16h5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <h2 className="text-xl font-semibold">Informes de Prácticas</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Gestión de informes inicial y final del estudiante
        </p>

        {/* Empresa */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50/60 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
              <IconCheck />
            </div>
            <div>
              <div className="font-semibold">Empresa</div>
              <div className="text-sm text-gray-700">
                {estadoEmpresa === "aprobado"
                  ? "Empresa aprobada"
                  : estadoEmpresa === "pendiente"
                  ? "Empresa pendiente de aprobación"
                  : estadoEmpresa === "rechazado"
                  ? "Empresa rechazada"
                  : "Sin estado"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenEmpresa(true)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            >
              Ver
            </button>
            {estadoEmpresa === "aprobado" && (
              <Badge tone="green">Aprobada</Badge>
            )}
            {estadoEmpresa === "pendiente" && (
              <Badge tone="yellow">Pendiente</Badge>
            )}
            {estadoEmpresa === "rechazado" && (
              <Badge tone="red">Rechazada</Badge>
            )}
            {!estadoEmpresa && <Badge>Sin estado</Badge>}

            {/* Botones de Aprobar y Rechazar cuando el estado es pendiente */}
            {estadoEmpresa === "pendiente" && (
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Aprobar
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informe Inicial */}
        <div className="flex items-center justify-between p-4 border rounded-xl mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <IconDoc />
            </div>
            <div>
              <div className="font-semibold">Informe Inicial</div>
              <div className="text-sm text-gray-700">
                Fase 1: Validación de documentos y información
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Aquí capturamos el estado de informeInicial */}
                {estadoInformeInicial === "aprobado" ? (
                  <PillAprobado />
                ) : (
                  <Badge>{estadoInformeInicial || "pendiente"}</Badge>
                )}
                <span className="text-xs text-gray-500">
                  Solicitado:{" "}
                  {formatDateES(
                    solicitudes?.informeInicial?.fechaInformeInicial
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de ver modal */}
            <button
              onClick={() => setOpenInicial(true)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            >
              Ver
            </button>
            {estadoInformeInicial === "aprobado" && (
              <Badge tone="green">Aprobada</Badge>
            )}
            {estadoInformeInicial === "pendiente" && (
              <Badge tone="yellow">Pendiente</Badge>
            )}
            {estadoInformeInicial === "devuelto_con_observaciones" && (
              <Badge tone="red">Rechazada Con Observaciones</Badge>
            )}
            {!estadoInformeInicial && <Badge>Sin estado</Badge>}

            {estadoEmpresa === "aprobado" &&
              estadoInformeInicial !== "aprobado" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={handleRejectInformeInicial}
                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* Informe Final */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
              {/* candado simple */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-orange-600"
                fill="none"
              >
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Informe Final</div>
              <div className="text-sm text-gray-700">
                Fase 2: Evaluación final y certificación
              </div>
              <div className="flex items-center gap-2 mt-1">
                {solicitudes?.informeFinal?.estadoInformeFinal ? (
                  <Badge tone="green">
                    {solicitudes?.informeFinal?.estadoInformeFinal}
                  </Badge>
                ) : (
                  <Badge tone="gray">No disponible</Badge>
                )}
                <span className="text-xs text-gray-500">
                  {formatDateES(solicitudes?.informeFinal?.fechaInformeFinal)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenFinal(true)}
              disabled={!solicitudes?.informeFinal}
              title={
                solicitudes?.informeFinal
                  ? "Ver"
                  : "Informe Final no disponible"
              }
              className={`px-3 py-1 text-sm border rounded ${
                solicitudes?.informeFinal
                  ? "hover:bg-gray-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Ver
            </button>

             {estadoInformeFinal === "aprobado" && (
              <Badge tone="green">Aprobada</Badge>
            )}
            {estadoInformeFinal === "pendiente" && (
              <Badge tone="yellow">Pendiente</Badge>
            )}
            {estadoInformeFinal === "devuelto_con_observaciones" && (
              <Badge tone="red">Rechazada Con Observaciones</Badge>
            )}

                 {estadoEmpresa === "aprobado" && estadoInformeFinal !== "aprobado" && (
            <div className="flex gap-2">
              <button
                onClick={handleAcceptInformeFinal}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Aceptar
              </button>
              <button
                onClick={handleRejectInformeFinal}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Rechazar
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ====== Modales ====== */}
      <Modal
        open={openEmpresa}
        onClose={() => setOpenEmpresa(false)}
        title="Información de Empresa y Supervisor"
        icon={<IconBuilding />}
      >
        <EmpresaModalContent student={solicitudes} />
      </Modal>

      <Modal
        open={openInicial}
        onClose={() => setOpenInicial(false)}
        title="Informe Inicial -"
        icon={<IconDoc />}
        wide="max-w-5xl"
      >
        <InformeInicialModalContent student={solicitudes} />
      </Modal>

      <Modal
        open={openFinal}
        onClose={() => setOpenFinal(false)}
        title="Informe Final -"
        icon={<IconDoc />}
        wide="max-w-5xl"
      >
        <InformeFinalModalContent student={solicitudes} />
      </Modal>
    </div>
  );
};

export default ConvalidacionDetail;
