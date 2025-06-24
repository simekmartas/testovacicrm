import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskPriority, Client } from '../types';
import { taskService, clientService } from '../services/localStorageService';
import { githubTaskService } from '../services/githubService';
import { hasGithubAccess } from '../config/environment';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  clientId?: number;
}

function TasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    clientId: undefined
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user) return;

    // Načti úkoly podle role
    let userTasks: Task[];
    if (user.role === 'VEDOUCI') {
      userTasks = taskService.getAll();
    } else {
      userTasks = taskService.getByUserId(user.id);
    }
    
    setTasks(userTasks);
    setClients(clientService.getAll());
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Název úkolu je povinný');
      return;
    }

    try {
      let savedTask: Task | null;

      if (editingTask) {
        // Editace existujícího úkolu
        savedTask = taskService.update(editingTask.id, formData);
        if (savedTask) {
          toast.success('Úkol byl aktualizován');
        }
      } else {
        // Vytvoření nového úkolu
        savedTask = taskService.create(formData);
        if (savedTask) {
          toast.success('Úkol byl vytvořen');
        }
      }

      // Pokus o synchronizaci s GitHubem
      if (savedTask && hasGithubAccess()) {
        try {
          await githubTaskService.save(savedTask);
        } catch (error) {
          toast.error('Nepodařilo se synchronizovat s GitHub');
        }
      }

      loadData();
      resetForm();
    } catch (error) {
      toast.error('Chyba při ukládání úkolu');
    }
  };

  const handleComplete = async (taskId: number) => {
    const updatedTask = taskService.complete(taskId);
    if (updatedTask) {
      toast.success('Úkol označen jako dokončený');
      
      // Synchronizace s GitHub
      if (hasGithubAccess()) {
        try {
          await githubTaskService.save(updatedTask);
        } catch (error) {
          toast.error('Nepodařilo se synchronizovat s GitHub');
        }
      }
      
      loadData();
    }
  };

  const handleDelete = async (taskId: number) => {
    if (window.confirm('Opravdu chcete smazat tento úkol?')) {
      taskService.delete(taskId);
      toast.success('Úkol byl smazán');
      
      // Synchronizace s GitHub
      if (hasGithubAccess()) {
        try {
          await githubTaskService.delete(taskId);
        } catch (error) {
          toast.error('Nepodařilo se synchronizovat s GitHub');
        }
      }
      
      loadData();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      clientId: task.clientId
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      clientId: undefined
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'COMPLETED': return task.completed;
      case 'PENDING': return !task.completed;
      default: return true;
    }
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-100 text-red-800';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-800';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'Urgentní';
      case TaskPriority.HIGH: return 'Vysoká';
      case TaskPriority.MEDIUM: return 'Střední';
      case TaskPriority.LOW: return 'Nízká';
      default: return priority;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání úkolů...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Úkoly</h1>
          <p className="mt-2 text-sm text-gray-700">
            Správa úkolů a sledování pokroku
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Nový úkol
        </button>
      </div>

      {/* Filtry */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Všechny ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'PENDING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Nedokončené ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Dokončené ({tasks.filter(t => t.completed).length})
        </button>
      </div>

      {/* Seznam úkolů */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
          
          return (
            <div
              key={task.id}
              className={`card p-4 ${task.completed ? 'opacity-60' : ''} ${
                isOverdue(task.dueDate) && !task.completed ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => !task.completed && handleComplete(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${isOverdue(task.dueDate) && !task.completed ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          Termín: {new Date(task.dueDate).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      {client && (
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          👤 {client.firstName} {client.lastName}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!task.completed && (
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Upravit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {filter === 'COMPLETED' ? 'Žádné dokončené úkoly' : 'Žádné úkoly'}
        </div>
      )}

      {/* Formulář */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTask ? 'Upravit úkol' : 'Nový úkol'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Název úkolu *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">Popis</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">Priorita</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
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
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="label">Klient (volitelné)</label>
                  <select
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="input w-full"
                  >
                    <option value="">Bez klienta</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingTask ? 'Uložit změny' : 'Vytvořit úkol'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage; 