import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { usersDb } from "../config/firebaseInstances"; // tu instancia exportada
// Opcional: si tienes otra instancia para userCVs, cámbiala aquí.
import React from "react";
import {
  EyeIcon,
  ArrowDownTrayIcon,
  DownloadIcon,
} from "@heroicons/react/24/outline";
import EmailStudentModal from "../components/EmailStudentModal";

const EstudiantesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiToolData, setAiToolData] = useState(null); // Nuevo estado para la información de aiTool_cvAnalysis
  const [aiToolInterviewData, setAiToolInterviewData] = useState(null); // Nuevo estado para la información de aiTool_interviewSimulation
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID no válido");
        setLoading(false);
        return;
      }
      try {
        // 1) Datos del usuario (colección "users")
        const userRef = doc(usersDb, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
        } else {
          setError("Estudiante no encontrado");
          setUserData(null);
        }

        // 2) Último CV del usuario (colección "userCVs")
        const cvsRef = collection(usersDb, "userCVs");
        const q = query(
          cvsRef,
          where("userId", "==", id),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const cvsSnap = await getDocs(q);
        if (!cvsSnap.empty) {
          const latestCV = cvsSnap.docs[0].data();
          setCvData(latestCV);
        } else {
          setCvData(null);
        }

        // 3) Obtener datos de la colección "aiTool_cvAnalysis" con el userId
        const aiToolRef = collection(usersDb, "aiTool_cvAnalysis");
        const aiToolQuery = query(aiToolRef, where("userId", "==", id));
        const aiToolSnap = await getDocs(aiToolQuery);
        if (!aiToolSnap.empty) {
          const aiToolDataArray = aiToolSnap.docs.map((doc) => doc.data());
          setAiToolData(aiToolDataArray);
          console.log("Datos de aiTool_cvAnalysis:", aiToolDataArray); // Muestra los datos de aiTool_cvAnalysis en la consola
        } else {
          console.log(
            "No se encontraron datos en aiTool_cvAnalysis para este usuario."
          );
        }

        // 4) Obtener datos de la colección "aiTool_interviewSimulation" con el userId
        const aiToolInterviewRef = collection(
          usersDb,
          "aiTool_interviewSimulation"
        );
        const aiToolInterviewQuery = query(
          aiToolInterviewRef,
          where("userId", "==", id)
        );
        const aiToolInterviewSnap = await getDocs(aiToolInterviewQuery);
        if (!aiToolInterviewSnap.empty) {
          const aiToolInterviewDataArray = aiToolInterviewSnap.docs.map((doc) =>
            doc.data()
          );
          setAiToolInterviewData(aiToolInterviewDataArray);
          console.log(
            "Datos de aiTool_interviewSimulation:",
            aiToolInterviewDataArray
          ); // Muestra los datos de aiTool_interviewSimulation en la consola
        } else {
          console.log(
            "No se encontraron datos en aiTool_interviewSimulation para este usuario."
          );
        }
      } catch (e) {
        setError("Error al obtener los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-lg text-gray-500">
        Cargando datos del usuario...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">{error}</div>;
  }

  if (!userData) {
    return (
      <div className="text-center text-lg text-gray-500">
        No se encontró el usuario.
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      <div className=" mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-black"></div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 text-sm bg-gra text-black rounded hover:bg-white/20"
          >
            ← Volver
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Email, Ubicación, Celular, CV/Pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden p-6">
              <div className="space-y-5">
                <h1 className="text-2xl font-semibold">
                  {userData?.displayName || userData?.nombre}
                </h1>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-600">
                    {userData?.email || "Sin correo"}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">
                    Ubicación:
                  </span>
                  <p className="text-gray-600">
                    {userData?.location || "No especificada"}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">Celular:</span>
                  <p className="text-gray-600">
                    {userData?.phone
                      ? userData.phone
                      : "No registró número de celular"}
                  </p>
                </div>

                <div className="flex space-x-5">
                  {/* Botón Ver CV */}
                  {userData?.cvFileUrl && (
                    <button
                      onClick={() => window.open(userData.cvFileUrl, "_blank")}
                      className="flex items-center text-white bg-[#028bbf] hover:bg-[#0277a7] px-4 py-2 rounded-md"
                    >
                      {/* O usa un ícono si tienes librería de íconos */}
                      Ver CV
                    </button>
                  )}

                  {/* Botón Correo */}
                  {userData?.email && (
                    <button
                      onClick={() => setIsEmailOpen(true)}
                      className="flex items-center text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-md"
                    >
                      Correo
                    </button>
                  )}

                  {/* Botón Ver Pitch */}
                  {userData?.pitchVideoUrl && (
                    <button
                      onClick={() =>
                        window.open(userData.pitchVideoUrl, "_blank")
                      }
                      className="flex items-center text-white bg-[#028bbf] hover:bg-[#0277a7] px-4 py-2 rounded-md"
                    >
                      Ver Pitch
                    </button>
                  )}
                </div>
              </div>

              {/* Acerca de mí */}
              <div className="col-span-2">
                {cvData?.data?.personalInfo?.summary && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700">
                      Acerca de mí
                    </h2>
                    <p className="text-gray-600 text-justify">
                      {cvData.data.personalInfo.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {aiToolData && aiToolData.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Análisis de CV{" "}
                </h2>
                <table className="min-w-full table-auto mt-4 border-collapse rounded-lg shadow-md overflow-hidden bg-white text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-b">
                        CV
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Resultado PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiToolData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700 border-b">
                          {item.jobOffer?.title}
                        </td>
                        <td className="px-6 py-4 text-gray-700 border-b">
                          <a
                            href={item.cv?.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:underline flex items-center"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </a>
                        </td>

                        <td className="px-6 py-4 text-gray-700 border-b">
                          <a
                            href={item.result?.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {aiToolInterviewData && aiToolInterviewData.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Simulación de Entrevista{" "}
                </h2>
                <table className="min-w-full table-auto mt-4 border-collapse rounded-lg shadow-md overflow-hidden bg-white text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Título del Trabajo
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Pregunta
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Respuesta
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-b">
                        Puntuación
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiToolInterviewData.map((item, index) => (
                      <React.Fragment key={index}>
                        {/* Dividir por cada pregunta */}
                        {item.questions &&
                          item.questions.map((question, qIndex) => (
                            <tr key={qIndex} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-700 border-b">
                                {qIndex === 0 ? item.jobOffer?.title : ""}{" "}
                                {/* Solo muestra el título una vez */}
                              </td>
                              <td className="px-6 py-4 text-gray-700 border-b">
                                {question.text}
                              </td>
<td className="px-6 py-4 text-gray-700 border-b">
  {question?.answer?.recording_url ? (
    <a
      href={question.answer.recording_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline"
    >
      Escuchar respuesta
    </a>
  ) : (
    <span className="text-gray-400 italic">Sin grabación</span>
  )}

  {question?.transcript && (
    <p className="mt-1">{question.transcript}</p>
  )}
</td>

                              <td className="px-6 py-4 text-gray-700 border-b">
                                {item.interviewScore}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Educación */}
            {cvData?.data?.education &&
              Array.isArray(cvData.data.education) &&
              cvData.data.education.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Educación
                  </h2>
                  <table className="min-w-full table-auto mt-4 border-collapse rounded-lg shadow-md overflow-hidden bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Grado
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Institución
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Inicio
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Término
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvData.data.education.map((edu) => (
                        <tr
                          key={edu.id || `${edu.institution}-${edu.startDate}`}
                          className="hover:bg-gray-50 text-sm"
                        >
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {edu.degree}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {edu.institution}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {edu.startDate}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {edu.endDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Experiencia Laboral 
            {cvData?.data?.workExperience &&
              Array.isArray(cvData.data.workExperience) &&
              cvData.data.workExperience.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Experiencia Laboral
                  </h2>
                  <table className="min-w-full table-auto mt-4 border-collapse rounded-lg shadow-md overflow-hidden bg-white text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Puesto
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Fecha de Inicio
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Fecha de Fin
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Logros
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvData.data.workExperience.map((work) => (
                        <tr
                          key={work.id || `${work.company}-${work.startDate}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {work.company}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {work.position}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {work.startDate}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {work.endDate}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            <ul className="list-disc pl-5 text-justify">
                              {Array.isArray(work.achievements) &&
                                work.achievements.map((achv, idx) => (
                                  <li key={idx} className="text-gray-600">
                                    {achv}
                                  </li>
                                ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}*/}

            {/* Habilidades
            {cvData?.data?.skills &&
              Array.isArray(cvData.data.skills) &&
              cvData.data.skills.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Habilidades
                  </h2>
                  <table className="min-w-full table-auto mt-4 border-collapse rounded-lg shadow-md overflow-hidden bg-white text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Habilidad
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left font-medium border-b">
                          Nivel
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvData.data.skills.map((skill) => (
                        <tr
                          key={skill.id || `${skill.name}-${skill.level}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {skill.name}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {skill.category}
                          </td>
                          <td className="px-6 py-4 text-gray-700 border-b">
                            {skill.level}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )} */}
          </div>
        </div>
      </div>
      <EmailStudentModal isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} toEmail={userData?.email || ''} />
    </div>
  );
};

export default EstudiantesDetail;
