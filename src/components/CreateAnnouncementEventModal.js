import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { collection, getDocs, query, where } from "firebase/firestore";
import { usersDb } from "../config/firebaseInstances";

const CreateAnnouncementEventModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("anuncio");
  const [career, setCareer] = useState("");
  const [emails, setEmails] = useState("");
  const [emailList, setEmailList] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [modality, setModality] = useState("presencial");
  const [location, setLocation] = useState("");
  const [segment, setSegment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loadedEmailsCount, setLoadedEmailsCount] = useState(0);
  const [newEmail, setNewEmail] = useState("");

  // Efecto para cargar emails cuando se selecciona una carrera
  useEffect(() => {
    if (!isOpen) return;

    const loadStudentEmails = async () => {
      if (!career) {
        setEmails("");
        setEmailList([]);
        setLoadedEmailsCount(0);
        return;
      }

      setIsLoadingEmails(true);
      setError(null);

      try {
        const usersRef = collection(usersDb, "users");
        const q = query(usersRef, where("career", "==", career));
        const querySnapshot = await getDocs(q);

        const emailArray = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email) {
            emailArray.push(userData.email);
          }
        });

        setEmailList(emailArray);
        setEmails(emailArray.join(", "));
        setLoadedEmailsCount(emailArray.length);

        if (emailArray.length === 0) {
          setError(`No se encontraron estudiantes para la carrera: ${career}`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Error cargando emails:", err);
        setError("Error al cargar los emails de estudiantes");
        setEmails("");
        setEmailList([]);
        setLoadedEmailsCount(0);
      } finally {
        setIsLoadingEmails(false);
      }
    };

    loadStudentEmails();
  }, [career, isOpen]);

  // Función para eliminar un email
  const removeEmail = (indexToRemove) => {
    const newEmailList = emailList.filter((_, index) => index !== indexToRemove);
    setEmailList(newEmailList);
    setEmails(newEmailList.join(", "));
    setLoadedEmailsCount(newEmailList.length);
  };

  // Función para agregar un email manualmente
  const addEmail = () => {
    if (newEmail.trim() && isValidEmail(newEmail.trim())) {
      const updatedEmailList = [...emailList, newEmail.trim()];
      setEmailList(updatedEmailList);
      setEmails(updatedEmailList.join(", "));
      setLoadedEmailsCount(updatedEmailList.length);
      setNewEmail("");
    }
  };

  // Función para validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejar presionar Enter en el input de nuevo email
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setType("anuncio");
    setCareer("");
    setEmails("");
    setEmailList([]);
    setSubject("");
    setMessage("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setModality("presencial");
    setLocation("");
    setSegment("");
    setError(null);
    setSuccessMsg(null);
    setLoadedEmailsCount(0);
    setNewEmail("");
  };

  const handleNextStep = () => {
    if (!career) {
      setError("Selecciona una carrera");
      return;
    }
    if (emailList.length === 0) {
      setError("No hay emails disponibles para esta carrera");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (type === "evento") {
      if (!date) {
        setError("Selecciona la fecha del evento");
        return;
      }
      if (!startTime) {
        setError("Selecciona la hora de inicio del evento");
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        email: emailList,
        displayName: "admin",
        asunto: subject,
        mensaje: message,
        tipo: type,
        carrera: career,
        fecha: date || null,
        horaInicio: startTime || null,
        horaFin: endTime || null,
        modalidad: modality,
        lugar: location,
        segmentacion: segment,
      };

      const response = await fetch("/api/email/b2banuncios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let text = "Error al enviar el correo";
        try {
          const json = await response.json();
          if (json?.message) text = json.message;
        } catch (_) {}
        throw new Error(text);
      }

      setSuccessMsg(`Correo(s) enviado(s) correctamente a ${emailList.length} destinatarios`);
      resetAll();
      onClose();
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto w-full max-w-2xl px-4">
        <form onSubmit={handleSubmit}>
          <div className="border w-full overflow-hidden rounded-lg bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                {step === 1 ? "Selección básica" : "Detalles del contenido"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-5">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {successMsg}
                </div>
              )}

              {step === 1 && (
                <>
                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <div className="inline-flex mt-2 rounded-md border border-gray-300 bg-gray-50 p-1">
                      <button
                        type="button"
                        onClick={() => setType("evento")}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          type === "evento"
                            ? "bg-black text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Evento
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("anuncio")}
                        className={`ml-1 px-4 py-2 text-sm font-medium rounded-md ${
                          type === "anuncio"
                            ? "bg-black text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Anuncio
                      </button>
                    </div>
                  </div>

                  {/* Carrera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Carrera
                    </label>
                    <select
                      value={career}
                      onChange={(e) => setCareer(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    >
                      <option value="">Selecciona una carrera</option>
                      <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                      <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                      <option value="Administración">Administración</option>
                      <option value="Contabilidad">Contabilidad</option>
                      <option value="Derecho">Derecho</option>
                    </select>
                  </div>

                  {/* Emails como tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emails de estudiantes
                      {loadedEmailsCount > 0 && (
                        <span className="ml-2 text-xs text-green-600">
                          ({loadedEmailsCount} estudiantes encontrados)
                        </span>
                      )}
                    </label>
                    
                    <div className="mt-1 relative">
                      {isLoadingEmails && (
                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-md border border-gray-300 z-10">
                          <div className="text-sm text-gray-600">Cargando emails...</div>
                        </div>
                      )}
                      
                      {/* Contenedor de tags de emails */}
                      <div className="min-h-[100px] max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
                        {emailList.length === 0 && !isLoadingEmails ? (
                          <p className="text-sm text-gray-500 italic">
                            Los emails se cargarán automáticamente al seleccionar una carrera
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {emailList.map((email, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                              >
                                <span>{email}</span>
                                <button
                                  type="button"
                                  onClick={() => removeEmail(index)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Input para agregar emails manualmente */}
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Agregar email manualmente (presiona Enter)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          disabled={isLoadingEmails}
                        />
                        <button
                          type="button"
                          onClick={addEmail}
                          disabled={isLoadingEmails || !newEmail.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-xs text-gray-500">
                      Los emails se cargan automáticamente de la base de datos. Puedes eliminar emails individualmente o agregar nuevos manualmente.
                    </p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Información de envío */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800">Resumen del envío</h3>
                    <p className="text-xs text-blue-600 mt-1">
                      Tipo: <span className="font-medium">{type === "evento" ? "Evento" : "Anuncio"}</span> | 
                      Carrera: <span className="font-medium">{career}</span> | 
                      Destinatarios: <span className="font-medium">{loadedEmailsCount}</span>
                    </p>
                    
                    {/* Vista previa de algunos emails */}
                    <div className="mt-2">
                      <p className="text-xs text-blue-600 mb-1">Emails seleccionados:</p>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {emailList.slice(0, 10).map((email, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {email}
                          </span>
                        ))}
                        {emailList.length > 10 && (
                          <span className="inline-block bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded">
                            +{emailList.length - 10} más...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Asunto / Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Asunto / Título
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Escribe el asunto"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Mensaje / Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mensaje / Descripción
                    </label>
                    <textarea
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Campos específicos para EVENTOS */}
                  {type === "evento" && (
                    <>
                      {/* Fecha */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fecha (requerida)
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>

                      {/* Hora inicio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hora de inicio (requerida)
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        />
                      </div>

                      {/* Hora fin */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hora de fin (opcional)
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Modalidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Modalidad
                        </label>
                        <select
                          value={modality}
                          onChange={(e) => setModality(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="presencial">Presencial</option>
                          <option value="virtual">Virtual</option>
                          <option value="hibrido">Híbrido</option>
                        </select>
                      </div>

                      {/* Lugar / Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Lugar o link
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Ej: Auditorio / https://meet.example.com/..."
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Segmentación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Segmentación adicional
                        </label>
                        <input
                          type="text"
                          value={segment}
                          onChange={(e) => setSegment(e.target.value)}
                          placeholder="Ej: Ciclo 3 - Sede Trujillo"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetAll();
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoadingEmails || emailList.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingEmails ? "Cargando..." : "Siguiente"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Atrás
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetAll();
                        onClose();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || isLoadingEmails}
                    >
                      {isLoading ? "Enviando..." : `Enviar a ${emailList.length} estudiantes`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementEventModal;