import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Client, Task, Meeting, TaskPriority, WorkflowStage } from '../types';
import { clientService, taskService, meetingService } from '../services/localStorageService';
import { needsAnalysisService } from '../services/needsAnalysisService';
import { useAuth } from '../contexts/AuthContext';
import PotentialSection from '../components/PotentialSection';
import toast from 'react-hot-toast';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

interface MeetingFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<{ exists: boolean; percentage: number }>({ exists: false, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: ''
  });
  const [meetingFormData, setMeetingFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: ''
  });

  useEffect(() => {
    if (id) {
      loadClientData(parseInt(id));
    }
  }, [id]);

  const loadClientData = (clientId: number) => {
    const clientData = clientService.getById(clientId);
    if (clientData) {
      setClient(clientData);
      
      // Zkontroluj stav analýzy potřeb
      const analysis = needsAnalysisService.getByClientId(clientId);
      if (analysis) {
        const percentage = needsAnalysisService.getCompletionPercentage(analysis);
        setAnalysisStatus({ exists: true, percentage });
      }
      
      // Načti úkoly klienta
      const allTasks = taskService.getAll();
      const tasks = allTasks.filter(task => task.clientId === clientId);
      setClientTasks(tasks);
    }
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (window.confirm('Opravdu chcete smazat tohoto klienta? Tato akce je nevratná.')) {
      if (id) {
        clientService.delete(parseInt(id));
        navigate('/clients');
      }
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskFormData.title.trim()) {
      toast.error('Název úkolu je povinný');
      return;
    }

    try {
      const newTask = taskService.create({
        ...taskFormData,
        clientId: parseInt(id!)
      });
      
      if (newTask) {
        toast.success('Úkol byl vytvořen');
        setShowTaskForm(false);
        setTaskFormData({
          title: '',
          description: '',
          priority: TaskPriority.MEDIUM,
          dueDate: ''
        });
      }
    } catch (error) {
      toast.error('Chyba při vytváření úkolu');
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingFormData.title.trim() || !meetingFormData.startTime || !meetingFormData.endTime) {
      toast.error('Název, začátek a konec schůzky jsou povinné');
      return;
    }

    if (new Date(meetingFormData.startTime) >= new Date(meetingFormData.endTime)) {
      toast.error('Začátek musí být před koncem schůzky');
      return;
    }

    try {
      const newMeeting = meetingService.create({
        ...meetingFormData,
        clientId: parseInt(id!)
      });
      
      if (newMeeting) {
        toast.success('Schůzka byla vytvořena');
        setShowMeetingForm(false);
        setMeetingFormData({
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          location: ''
        });
      }
    } catch (error) {
      toast.error('Chyba při vytváření schůzky');
    }
  };

  const handleTaskComplete = async (taskId: number) => {
    try {
      const updatedTask = taskService.complete(taskId);
      if (updatedTask) {
        toast.success('Úkol označen jako dokončený');
        // Aktualizuj seznam úkolů
        loadClientData(parseInt(id!));
      }
    } catch (error) {
      toast.error('Chyba při označování úkolu');
    }
  };

  const handleWorkflowChange = async (newStage: WorkflowStage) => {
    if (!client) return;

    try {
      const updated = clientService.updateWorkflowStage(client.id, newStage);
      if (updated) {
        setClient(updated);
        setShowWorkflowModal(false);
        toast.success('Fáze spolupráce byla změněna');
      }
    } catch (error) {
      toast.error('Chyba při změně fáze spolupráce');
    }
  };

  const getWorkflowStageLabel = (stage: WorkflowStage) => {
    switch (stage) {
      case WorkflowStage.NAVOLANI: return 'Navolání';
      case WorkflowStage.ANALYZA_POTREB: return 'Analýza potřeb';
      case WorkflowStage.ZPRACOVANI: return 'Zpracování';
      case WorkflowStage.PRODEJNI_SCHUZKA: return 'Prodejní schůzka';
      case WorkflowStage.PODPIS: return 'Podpis';
      case WorkflowStage.SERVIS: return 'Servis';
      default: return stage;
    }
  };

  const setDefaultTaskData = () => {
    if (client) {
      setTaskFormData({
        ...taskFormData,
        title: `Úkol pro ${client.firstName} ${client.lastName}`,
        description: `Úkol související s klientem ${client.firstName} ${client.lastName}`
      });
    }
  };

  const setDefaultMeetingData = () => {
    if (client) {
      // Nastav výchozí čas na zítra od 10:00 do 11:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);
      
      setMeetingFormData({
        ...meetingFormData,
        title: `Schůzka s ${client.firstName} ${client.lastName}`,
        description: `Schůzka s klientem ${client.firstName} ${client.lastName}`,
        startTime: tomorrow.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Klient nenalezen</p>
        <Link to="/clients" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
          Zpět na seznam klientů
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link to="/clients" className="text-sm text-gray-600 hover:text-gray-900">
            ← Zpět na seznam klientů
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {client.firstName} {client.lastName}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/clients/${id}/edit`}
            className="btn btn-secondary"
          >
            Upravit
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Smazat
          </button>
        </div>
      </div>

      {/* Potenciál klienta */}
      <div className="mb-6">
        <PotentialSection clientId={parseInt(id!)} />
      </div>

      {/* Analýza potřeb */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              📋 Analýza potřeb
            </h2>
            {analysisStatus.exists ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Dokončeno:</span>
                  <span className="ml-2 font-semibold">{analysisStatus.percentage}%</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisStatus.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Analýza potřeb ještě nebyla zahájena</p>
            )}
          </div>
          <Link
            to={`/clients/${id}/needs-analysis`}
            className="btn btn-primary"
          >
            {analysisStatus.exists ? 'Pokračovat v analýze' : 'Zahájit analýzu'}
          </Link>
        </div>
      </div>

      {/* Základní informace */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Základní informace</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telefon</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Datum narození</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('cs-CZ') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Poradce</dt>
            <dd className="mt-1 text-sm text-gray-900">{client.advisorName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fáze spolupráce</dt>
            <dd className="mt-1 flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getWorkflowStageLabel(client.workflowStage)}
              </span>
              <button
                onClick={() => setShowWorkflowModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Změnit
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Datum vytvoření</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(client.createdAt).toLocaleDateString('cs-CZ')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Adresa */}
      {(client.address || client.city || client.postalCode) && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresa</h2>
          <address className="not-italic text-sm text-gray-900">
            {client.address && <div>{client.address}</div>}
            {(client.city || client.postalCode) && (
              <div>
                {client.postalCode && `${client.postalCode} `}
                {client.city}
              </div>
            )}
          </address>
        </div>
      )}

      {/* Poznámky */}
      {client.notes && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Poznámky</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Úkoly klienta */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">📋 Úkoly klienta</h2>
          <span className="text-sm text-gray-500">
            {clientTasks.filter(t => !t.completed).length} aktivních, {clientTasks.filter(t => t.completed).length} dokončených
          </span>
        </div>
        
        {clientTasks.length > 0 ? (
          <div className="space-y-3">
            {clientTasks
              .sort((a, b) => {
                // Nedokončené úkoly nahoře, pak podle data vytvoření
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-4 ${
                    task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                  } ${
                    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
                      ? 'border-l-4 border-red-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => !task.completed && handleTaskComplete(task.id)}
                        className="mt-1"
                        disabled={task.completed}
                      />
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority === 'URGENT' ? 'Urgentní' :
                             task.priority === 'HIGH' ? 'Vysoká' :
                             task.priority === 'MEDIUM' ? 'Střední' : 'Nízká'}
                          </span>
                          {task.dueDate && (
                            <span className={`text-xs ${
                              new Date(task.dueDate) < new Date() && !task.completed
                                ? 'text-red-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              Termín: {new Date(task.dueDate).toLocaleDateString('cs-CZ')}
                            </span>
                          )}
                          {task.completed && task.completedAt && (
                            <span className="text-xs text-green-600">
                              ✓ Dokončeno: {new Date(task.completedAt).toLocaleDateString('cs-CZ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Žádné úkoly pro tohoto klienta</p>
            <button
              onClick={() => {
                setDefaultTaskData();
                setShowTaskForm(true);
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Vytvořit první úkol
            </button>
          </div>
        )}
      </div>

      {/* Rychlé akce */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rychlé akce</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setDefaultMeetingData();
              setShowMeetingForm(true);
            }}
            className="btn btn-secondary"
          >
            📅 Naplánovat schůzku
          </button>
          <button
            onClick={() => {
              setDefaultTaskData();
              setShowTaskForm(true);
            }}
            className="btn btn-secondary"
          >
            ✅ Vytvořit úkol
          </button>
          <button className="btn btn-secondary">
            📄 Nahrát dokument
          </button>
          <button className="btn btn-secondary">
            📧 Poslat email
          </button>
        </div>
      </div>

      {/* Formulář úkolu */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nový úkol pro {client.firstName} {client.lastName}
              </h3>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="label">Název úkolu *</label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Popis</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">Priorita</label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as TaskPriority })}
                    className="input w-full"
                  >
                    <option value={TaskPriority.LOW}>Nízká</option>
                    <option value={TaskPriority.MEDIUM}>Střední</option>
                    <option value={TaskPriority.HIGH}>Vysoká</option>
                    <option value={TaskPriority.URGENT}>Urgentní</option>
                  </select>
                </div>

                <div>
                  <label className="label">Termín dokončení</label>
                  <input
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="btn btn-secondary"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Vytvořit úkol
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Formulář schůzky */}
      {showMeetingForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nová schůzka s {client.firstName} {client.lastName}
              </h3>
              <form onSubmit={handleMeetingSubmit} className="space-y-4">
                <div>
                  <label className="label">Název schůzky *</label>
                  <input
                    type="text"
                    value={meetingFormData.title}
                    onChange={(e) => setMeetingFormData({ ...meetingFormData, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Popis</label>
                  <textarea
                    value={meetingFormData.description}
                    onChange={(e) => setMeetingFormData({ ...meetingFormData, description: e.target.value })}
                    rows={3}
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Začátek *</label>
                    <input
                      type="datetime-local"
                      value={meetingFormData.startTime}
                      onChange={(e) => setMeetingFormData({ ...meetingFormData, startTime: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Konec *</label>
                    <input
                      type="datetime-local"
                      value={meetingFormData.endTime}
                      onChange={(e) => setMeetingFormData({ ...meetingFormData, endTime: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Místo konání</label>
                  <input
                    type="text"
                    value={meetingFormData.location}
                    onChange={(e) => setMeetingFormData({ ...meetingFormData, location: e.target.value })}
                    className="input w-full"
                    placeholder="Kancelář, online, adresa..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMeetingForm(false)}
                    className="btn btn-secondary"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Vytvořit schůzku
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Workflow modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Změnit fázi spolupráce
              </h3>
              <div className="space-y-2">
                {Object.values(WorkflowStage).map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleWorkflowChange(stage)}
                    className={`w-full text-left p-3 rounded-md border ${
                      client?.workflowStage === stage 
                        ? 'bg-blue-100 border-blue-300 text-blue-900' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {getWorkflowStageLabel(stage)}
                    {client?.workflowStage === stage && (
                      <span className="ml-2 text-blue-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowWorkflowModal(false)}
                  className="btn btn-secondary"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetailPage; 