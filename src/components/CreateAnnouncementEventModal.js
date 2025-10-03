import { Fragment } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

const SectionTitle = ({ title, subtitle, badge }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {badge ? (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
          {badge}
        </span>
      ) : null}
    </div>
    {subtitle ? (
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    ) : null}
  </div>
);

const Label = ({ children }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const Input = ({ placeholder, type = 'text', disabled }) => (
  <input
    type={type}
    placeholder={placeholder}
    disabled={disabled}
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
  />
);

const Textarea = ({ placeholder, rows = 5 }) => (
  <textarea
    rows={rows}
    placeholder={placeholder}
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
  />
);

const Select = ({ children }) => (
  <select className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
    {children}
  </select>
);

const Toggle = () => (
  <button type="button" className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-gray-900/5 transition" />
  </button>
);

const Dropzone = ({ label }) => (
  <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-6">
    <div className="text-center">
      <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
      <div className="mt-2 text-sm text-gray-600">
        <span className="font-medium text-gray-900">Subir</span> o arrastra y suelta
      </div>
      <p className="text-xs text-gray-500">PNG, JPG, PDF</p>
    </div>
  </div>
);

const CreateAnnouncementEventModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-16 mx-auto w-full max-w-5xl p-0">
        <div className="border w-full overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Crear anuncio/evento</h2>
              <p className="mt-1 text-xs text-gray-500">Completa la información. Aún no se guardará nada.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
            {/* Tipo */}
            <div className="mb-8">
              <SectionTitle title="Tipo" subtitle="Elige si publicarás un evento o un anuncio." />
              <div className="inline-flex rounded-md border border-gray-300 bg-gray-50 p-1">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50">Evento</button>
                <button className="ml-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50">Anuncio</button>
              </div>
            </div>

            {/* Información básica */}
            <div className="mb-10">
              <SectionTitle title="Información básica" />
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label>Título</Label>
                  <Input placeholder="Ej. Feria de Empleo 2025" />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea placeholder="Describe el contenido o agenda..." rows={6} />
                </div>
                <div>
                  <Label>Imagen de portada</Label>
                  <Dropzone />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <Label>Etiqueta / Tag</Label>
                    <Input placeholder="Ej. Empleo" />
                  </div>
                  <div>
                    <Label>CTA - Texto</Label>
                    <Input placeholder="Ej. Inscribirme" />
                  </div>
                  <div>
                    <Label>CTA - URL</Label>
                    <Input placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Programación y estado */}
            <div className="mb-10">
              <SectionTitle title="Programación y estado" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Estado</Label>
                  <Select>
                    <option>Borrador</option>
                    <option>Publicado</option>
                    <option>Programado</option>
                  </Select>
                </div>
                <div>
                  <Label>Fecha de publicación</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Vigencia hasta</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>

            {/* Detalles del evento */}
            <div className="mb-10 rounded-md border border-gray-200 p-4 sm:p-5">
              <SectionTitle title="Detalles del evento" badge="Solo evento" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Fecha del evento</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Input type="time" />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Modalidad</Label>
                  <Select>
                    <option>Presencial</option>
                    <option>Virtual</option>
                    <option>Híbrido</option>
                  </Select>
                </div>
                <div>
                  <Label>Lugar (si presencial)</Label>
                  <Input placeholder="Auditorio Principal" />
                </div>
                <div>
                  <Label>Dirección / Mapa URL</Label>
                  <Input placeholder="https://maps..." />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Enlace a la sala (si virtual)</Label>
                  <Input placeholder="https://meet..." />
                </div>
                <div>
                  <Label>Plataforma</Label>
                  <Input placeholder="Google Meet, Zoom..." />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input type="number" placeholder="Opcional" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Label>Requiere registro</Label>
                  <div className="flex items-center gap-3">
                    <Toggle />
                    <span className="text-sm text-gray-500">Activar si se solicitará registro</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>URL de registro</Label>
                  <Input placeholder="https://forms..." />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Organizador</Label>
                  <Input placeholder="Oficina de Empleo" />
                </div>
                <div>
                  <Label>Email de contacto</Label>
                  <Input type="email" placeholder="contacto@uni.edu" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input placeholder="Opcional" />
                </div>
              </div>
            </div>

            {/* Segmentación */}
            <div className="mb-10">
              <SectionTitle title="Público objetivo / Segmentación" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>Carreras</Label>
                  <Input placeholder="Selecciona carreras" />
                </div>
                <div>
                  <Label>Cohorte / Año</Label>
                  <Input placeholder="Ej. 2023-I, 2024-II" />
                </div>
                <div>
                  <Label>Ciclo / Semestre</Label>
                  <Input placeholder="Ej. VII, VIII" />
                </div>
                <div>
                  <Label>Campus / Sede</Label>
                  <Input placeholder="Lima, Arequipa..." />
                </div>
                <div className="sm:col-span-2">
                  <Label>Etiquetas de usuario</Label>
                  <Input placeholder="Agregar etiquetas" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Alcance estimado: — estudiantes</p>
            </div>

            {/* Seguimiento */}
            <div className="mb-10">
              <SectionTitle title="Seguimiento" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label>Slug</Label>
                  <Input placeholder="feria-de-empleo-2025" />
                </div>
                <div>
                  <Label>UTM Source</Label>
                  <Input placeholder="dashboard" />
                </div>
                <div>
                  <Label>UTM Medium</Label>
                  <Input placeholder="email" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Label>UTM Campaign</Label>
                  <Input placeholder="feria-2025" />
                </div>
              </div>
              <div className="mt-6">
                <Label>Adjuntos</Label>
                <Dropzone />
              </div>
            </div>

            {/* Permisos */}
            <div className="mb-2">
              <SectionTitle title="Permisos y visibilidad" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>Visible para</Label>
                  <Select>
                    <option>Todos</option>
                    <option>Solo segmentados</option>
                  </Select>
                </div>
                <div>
                  <Label>Quién puede ver asistentes</Label>
                  <Select>
                    <option>Solo admins</option>
                    <option>Todos</option>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancelar
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300">
              Guardar borrador
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementEventModal;


