import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import { Client, WorkflowStage } from '../types';
import { clientService, userService } from '../services/localStorageService';
import { potentialService } from '../services/potentialService';
import { config, hasGithubAccess } from '../config/environment';
import { githubClientService } from '../services/githubService';
import toast from 'react-hot-toast';

const workflowStages: { id: WorkflowStage; name: string; color: string }[] = [
  { id: WorkflowStage.NAVOLANI, name: 'Navolání', color: 'bg-gray-100' },
  { id: WorkflowStage.ANALYZA_POTREB, name: 'Analýza potřeb', color: 'bg-blue-100' },
  { id: WorkflowStage.ZPRACOVANI, name: 'Zpracování', color: 'bg-yellow-100' },
  { id: WorkflowStage.PRODEJNI_SCHUZKA, name: 'Prodejní schůzka', color: 'bg-purple-100' },
  { id: WorkflowStage.PODPIS, name: 'Podpis', color: 'bg-green-100' },
  { id: WorkflowStage.SERVIS, name: 'Servis', color: 'bg-indigo-100' },
];

function WorkflowPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [clientPotentials, setClientPotentials] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const currentUser = userService.getCurrentUser();
      console.log('Současný uživatel:', currentUser);
      
      let data: Client[];
      
      if (hasGithubAccess() && !config.useLocalStorage) {
        // Pokud máme GitHub přístup, synchronizuj data
        data = await syncWithGitHub();
      } else {
        // Jinak použij lokální data
        data = clientService.getAll();
      }
      
      // Pro debugging načti všechny klienty bez filtrování
      const allClients = JSON.parse(localStorage.getItem('crm_clients') || '[]');
      console.log('=== DEBUG INFORMACE ===');
      console.log('Všichni klienti v localStorage:', allClients);
      console.log('Filtrovaní klienti (clientService.getAll()):', data);
      console.log('Počet všech klientů:', allClients.length);
      console.log('Počet filtrovaných klientů:', data.length);
      
      allClients.forEach((client: any) => {
        console.log(`Klient: ${client.firstName} ${client.lastName}, Fáze: ${client.workflowStage}, AdvisorId: ${client.advisorId}`);
      });
      
      console.log('=== KONEC DEBUG ===');
      
      setClients(data);
      
      // Načti potenciály pro všechny klienty
      const potentials: { [key: number]: any } = {};
      data.forEach(client => {
        const potential = potentialService.getByClientId(client.id);
        if (potential) {
          potentials[client.id] = potential;
        }
      });
      setClientPotentials(potentials);
      
    } catch (error) {
      toast.error('Nepodařilo se načíst klienty');
      // Fallback na lokální data
      const fallbackData = clientService.getAll();
      console.log('Fallback data:', fallbackData);
      setClients(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithGitHub = async (): Promise<Client[]> => {
    setIsSyncing(true);
    try {
      // Načti data z GitHubu
      const githubClients = await githubClientService.getAll();
      
      // Ulož do localStorage pro offline přístup
      githubClients.forEach(client => {
        clientService.update(client.id, client);
      });
      
      toast.success('Data synchronizována s GitHub');
      return githubClients;
    } catch (error) {
      toast.error('Synchronizace selhala, používám lokální data');
      return clientService.getAll();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const clientId = parseInt(draggableId);
    const newStage = destination.droppableId as WorkflowStage;

    // Najdi klienta
    const client = clients.find(c => c.id === clientId);
    if (!client || client.workflowStage === newStage) return;

    // Aktualizuj lokálně
    const updatedClient = clientService.updateWorkflowStage(clientId, newStage);
    if (updatedClient) {
      setClients(prevClients => 
        prevClients.map(c => c.id === clientId ? updatedClient : c)
      );
      
      toast.success(`${client.firstName} ${client.lastName} přesunut do fáze: ${workflowStages.find(s => s.id === newStage)?.name}`);
      
      // Pokus se synchronizovat s GitHubem
      if (hasGithubAccess() && !config.useLocalStorage) {
        try {
          await githubClientService.save(updatedClient);
        } catch (error) {
          toast.error('Nepodařilo se uložit na GitHub, změna zůstává lokálně');
        }
      }
    }
  };

  const handleClientClick = (clientId: number) => {
    navigate(`/clients/${clientId}`);
  };

  const getClientsForStage = (stage: WorkflowStage) => {
    const filtered = clients.filter(client => client.workflowStage === stage);
    console.log(`Fáze ${stage}: ${filtered.length} klientů`, filtered.map(c => `${c.firstName} ${c.lastName}`));
    return filtered;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'VYSOKY': return 'border-l-4 border-red-500';
      case 'STREDNI': return 'border-l-4 border-yellow-500';
      case 'NIZKY': return 'border-l-4 border-green-500';
      default: return '';
    }
  };

  const getPotentialSummary = (clientId: number) => {
    const potential = clientPotentials[clientId];
    if (!potential || potential.totalExpectedCommission === 0) {
      return null;
    }
    return {
      total: potential.totalExpectedCommission,
      priority: potential.priority
    };
  };

  const getStageTotalPotential = (stage: WorkflowStage) => {
    const stageClients = getClientsForStage(stage);
    return stageClients.reduce((total, client) => {
      const potential = clientPotentials[client.id];
      return total + (potential ? potential.totalExpectedCommission : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání workflow...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Board</h1>
          <p className="mt-2 text-sm text-gray-700">
            Přetáhněte klienty mezi fázemi spolupráce nebo klikněte na kartu pro detail
          </p>
        </div>
        {hasGithubAccess() && (
          <button
            onClick={syncWithGitHub}
            disabled={isSyncing}
            className="btn btn-secondary flex items-center gap-2"
          >
            {isSyncing ? '⏳ Synchronizuji...' : '🔄 Synchronizovat'}
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {workflowStages.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div className={`${stage.color} rounded-t-lg px-4 py-3`}>
                <h3 className="font-semibold text-gray-800">
                  {stage.name}
                  <span className="ml-2 text-sm text-gray-600">
                    ({getClientsForStage(stage.id).length})
                  </span>
                </h3>
                <div className="mt-1 text-sm">
                  <span className="font-medium text-green-700">
                    💰 {getStageTotalPotential(stage.id).toLocaleString('cs-CZ')} Kč
                  </span>
                  <span className="text-gray-500 ml-1">potenciál</span>
                </div>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-50 min-h-[400px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : ''
                    }`}
                  >
                    {getClientsForStage(stage.id).map((client, index) => {
                      const potentialSummary = getPotentialSummary(client.id);
                      
                      return (
                        <Draggable
                          key={client.id}
                          draggableId={client.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm p-4 mb-2 cursor-pointer transition-all ${
                                snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
                              } ${getPriorityColor(potentialSummary?.priority)}`}
                              onClick={() => handleClientClick(client.id)}
                            >
                              <div className="font-medium text-gray-900">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {client.email}
                              </div>
                              {client.phone && (
                                <div className="text-sm text-gray-500">
                                  {client.phone}
                                </div>
                              )}
                              
                              {/* Potenciál */}
                              {potentialSummary && (
                                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                  <div className="font-medium text-green-800">
                                    💰 {potentialSummary.total.toLocaleString('cs-CZ')} Kč
                                  </div>
                                  <div className="text-green-600">
                                    Priorita: {potentialSummary.priority === 'VYSOKY' ? 'Vysoká' : 
                                              potentialSummary.priority === 'STREDNI' ? 'Střední' : 'Nízká'}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-400">
                                  Poradce: {client.advisorName}
                                </span>
                                {client.hasNeedsAnalysis && (
                                  <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                                    ✓ Analýza
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>💡 Tip: Přetáhněte kartu klienta do jiné fáze pro změnu stavu nebo klikněte na kartu pro detail</p>
        <p>💰 Barevný okraj označuje prioritu podle očekávané provize (červená = vysoká, žlutá = střední, zelená = nízká)</p>
        {hasGithubAccess() ? (
          <p className="text-green-600">✓ Data se ukládají na GitHub</p>
        ) : (
          <p className="text-yellow-600">⚠️ Data se ukládají pouze lokálně</p>
        )}
      </div>
    </div>
  );
}

export default WorkflowPage; 