import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Client, Task, Meeting, WorkflowStage } from '../types';
import { clientService, taskService, meetingService } from '../services/localStorageService';

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    newClients: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    upcomingMeetings: 0,
    completedTasks: 0,
  });
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [workflowStats, setWorkflowStats] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    if (!user) return;

    const clients = clientService.getAll();
    const tasks = taskService.getAll();
    const meetings = meetingService.getAll();
    const upcomingMeetingsList = meetingService.getUpcoming(user.id);
    const overdueTasks = taskService.getOverdue(user.id);

    // Základní statistiky
    const pendingTasksCount = tasks.filter(t => !t.completed).length;
    const completedTasksCount = tasks.filter(t => t.completed).length;
    
    // Noví klienti (posledních 30 dní)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newClientsCount = clients.filter(c => 
      new Date(c.createdAt) > thirtyDaysAgo
    ).length;

    // Workflow statistiky
    const workflowCounts: { [key: string]: number } = {};
    Object.values(WorkflowStage).forEach(stage => {
      workflowCounts[stage] = clients.filter(c => c.workflowStage === stage).length;
    });

    setStats({
      totalClients: clients.length,
      newClients: newClientsCount,
      pendingTasks: pendingTasksCount,
      overdueTasks: overdueTasks.length,
      upcomingMeetings: upcomingMeetingsList.length,
      completedTasks: completedTasksCount,
    });

    // Nedávno přidaní klienti
    const sortedClients = [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    setRecentClients(sortedClients);
    setUpcomingMeetings(upcomingMeetingsList.slice(0, 3));
    setPendingTasks(tasks.filter(t => !t.completed).slice(0, 5));
    setWorkflowStats(workflowCounts);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Vítejte, {user?.firstName}!
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Přehled vašich aktivit a důležitých informací
        </p>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Klienti celkem
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalClients}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">⭐</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Noví klienti (30 dní)
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.newClients}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">📋</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Aktivní úkoly
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.pendingTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${stats.overdueTasks > 0 ? 'bg-red-500' : 'bg-gray-400'} rounded-md flex items-center justify-center`}>
                <span className="text-white font-bold">⚠️</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Prošlé úkoly
                </dt>
                <dd className={`text-lg font-medium ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {stats.overdueTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">📅</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Nadcházející schůzky
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.upcomingMeetings}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">✅</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Dokončené úkoly
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.completedTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nedávno přidaní klienti */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Nedávno přidaní klienti
              </h3>
              <button
                onClick={() => navigate('/clients')}
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Zobrazit všechny
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentClients.length > 0 ? (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {client.firstName} {client.lastName}
                      </button>
                      <p className="text-xs text-gray-500">
                        {getWorkflowStageLabel(client.workflowStage)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Žádní noví klienti</p>
            )}
          </div>
        </div>

        {/* Nadcházející schůzky */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Nadcházející schůzky
              </h3>
              <button
                onClick={() => navigate('/calendar')}
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Kalendář
              </button>
            </div>
          </div>
          <div className="p-6">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="border-l-4 border-blue-400 pl-3">
                    <div className="text-sm font-medium text-gray-900">
                      {meeting.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(meeting.startTime).toLocaleString('cs-CZ')}
                    </div>
                    {meeting.location && (
                      <div className="text-xs text-gray-400">
                        📍 {meeting.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Žádné nadcházející schůzky</p>
            )}
          </div>
        </div>

        {/* Aktivní úkoly */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Aktivní úkoly
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                Zobrazit všechny
              </button>
            </div>
          </div>
          <div className="p-6">
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString('cs-CZ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Žádné aktivní úkoly</p>
            )}
          </div>
        </div>

        {/* Workflow přehled */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Stav workflow
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(workflowStats).map(([stage, count]) => (
                <div key={stage} className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {getWorkflowStageLabel(stage as WorkflowStage)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rychlé akce */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rychlé akce</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            onClick={() => navigate('/clients/new')}
            className="btn btn-primary text-center py-6"
          >
            <div className="text-2xl mb-2">👤</div>
            <div>Nový klient</div>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="btn btn-secondary text-center py-6"
          >
            <div className="text-2xl mb-2">📅</div>
            <div>Nová schůzka</div>
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-secondary text-center py-6"
          >
            <div className="text-2xl mb-2">📋</div>
            <div>Nový úkol</div>
          </button>
          <button
            onClick={() => navigate('/workflow')}
            className="btn btn-secondary text-center py-6"
          >
            <div className="text-2xl mb-2">📊</div>
            <div>Workflow</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 