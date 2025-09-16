import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import VistaPanoramica from "./pages/VistaPanoramica";
import CompetitividadEnMercado from "./pages/CompetitividadEnMercado";
import CrecimientoProfesional from "./pages/CrecimientoProfesional";
import DesempenoActual from "./pages/DesempenoActual";
import Estudiantes from "./pages/Estudiantes";
import Configuracion from "./pages/Configuracion";
import Ayuda from "./pages/Ayuda";
import AnunciosEventos from "./pages/AnunciosEventos";
import Usuarios from "./pages/Usuarios";
import Empresas from "./pages/Empresas";
import Login from "./pages/Login";
import Convalidacion from "./pages/Convalidacion";
import ConvalidacionDetail from "./pages/ConvalidacionDetail";
import Register from "./pages/Register";
import PrivateRoute from "./components/PrivateRoute";
import AdminSetup from "./components/AdminSetup";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/*<Route path="/admin-setup" element={<AdminSetup />} /> */}

          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/vista-panoramica" />}
                    />
                    <Route
                      path="/vista-panoramica"
                      element={<VistaPanoramica />}
                    />
                    <Route
                      path="/competitividad-mercado"
                      element={<CompetitividadEnMercado />}
                    />
                    <Route
                      path="/crecimiento-profesional"
                      element={<CrecimientoProfesional />}
                    />
                    <Route
                      path="/desempeno-actual"
                      element={<DesempenoActual />}
                    />
                    <Route path="/estudiantes" element={<Estudiantes />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/ayuda" element={<Ayuda />} />
                    <Route path="/anuncios-eventos" element={<AnunciosEventos />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/empresas" element={<Empresas />} />
                    <Route path="/convalidacion" element={<Convalidacion />} />
                            <Route path="/convalidacion/:id" element={<ConvalidacionDetail />} />

                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
