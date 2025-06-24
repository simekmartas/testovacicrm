import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Client, WorkflowStage } from '../types';
import { clientService } from '../services/localStorageService';
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
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      let data: Client[];
      
      if (hasGithubAccess() && !config.useLocalStorage) {
        // Pokud máme GitHub přístup, synchronizuj data
        data = await syncWithGitHub();
      } else {
        // Jinak použij lokální data
        data = clientService.getAll();
      }
      
      setClients(data);
    } catch (error) {
      toast.error('Nepodařilo se načíst klienty');
      // Fallback na lokální data
      setClients(clientService.getAll());
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

  const getClientsForStage = (stage: WorkflowStage) => {
    return clients.filter(client => client.workflowStage === stage);
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
            Přetáhněte klienty mezi fázemi spolupráce
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
              <div className={`${stage.color} rounded-t-lg px-4 py-2`}>
                <h3 className="font-semibold text-gray-800">
                  {stage.name}
                  <span className="ml-2 text-sm text-gray-600">
                    ({getClientsForStage(stage.id).length})
                  </span>
                </h3>
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
                    {getClientsForStage(stage.id).map((client, index) => (
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
                            className={`bg-white rounded-lg shadow-sm p-4 mb-2 cursor-move ${
                              snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                            }`}
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
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>💡 Tip: Přetáhněte kartu klienta do jiné fáze pro změnu stavu</p>
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