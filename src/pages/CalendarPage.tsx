import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meeting, Client } from '../types';
import { meetingService, clientService } from '../services/localStorageService';
import { githubMeetingService } from '../services/githubService';
import { hasGithubAccess } from '../config/environment';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MeetingFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  clientId?: number;
}

function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    clientId: undefined
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user) return;

    let userMeetings: Meeting[];
    if (user.role === 'VEDOUCI') {
      userMeetings = meetingService.getAll();
    } else {
      userMeetings = meetingService.getAll().filter(m => m.userId === user.id);
    }
    
    setMeetings(userMeetings);
    setClients(clientService.getAll());
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) {
      toast.error('Název, začátek a konec schůzky jsou povinné');
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error('Začátek musí být před koncem schůzky');
      return;
    }

    try {
      let savedMeeting: Meeting | null;

      if (editingMeeting) {
        savedMeeting = meetingService.update(editingMeeting.id, formData);
        if (savedMeeting) {
          toast.success('Schůzka byla aktualizována');
        }
      } else {
        savedMeeting = meetingService.create(formData);
        if (savedMeeting) {
          toast.success('Schůzka byla vytvořena');
        }
      }

      if (savedMeeting && hasGithubAccess()) {
        try {
          await githubMeetingService.save(savedMeeting);
        } catch (error) {
          toast.error('Nepodařilo se synchronizovat s GitHub');
        }
      }

      loadData();
      resetForm();
    } catch (error) {
      toast.error('Chyba při ukládání schůzky');
    }
  };

  const handleDelete = async (meetingId: number) => {
    if (window.confirm('Opravdu chcete smazat tuto schůzku?')) {
      meetingService.delete(meetingId);
      toast.success('Schůzka byla smazána');
      
      if (hasGithubAccess()) {
        try {
          await githubMeetingService.delete(meetingId);
        } catch (error) {
          toast.error('Nepodařilo se synchronizovat s GitHub');
        }
      }
      
      loadData();
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location || '',
      clientId: meeting.clientId
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      clientId: undefined
    });
    setEditingMeeting(null);
    setShowForm(false);
  };

  const getWeekDates = (date: string) => {
    const start = new Date(date);
    const day = start.getDay();
    const monday = new Date(start);
    monday.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDates.push(day.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const getMeetingsForDate = (date: string) => {
    return meetings.filter(meeting => 
      meeting.startTime.split('T')[0] === date
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString('cs-CZ', { weekday: 'short' });
  };

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání kalendáře...</div>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedDate);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalendář</h1>
          <p className="mt-2 text-sm text-gray-700">
            Správa schůzek a událostí
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Nová schůzka
        </button>
      </div>

      {/* Navigace kalendáře */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 7);
              setSelectedDate(prev.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary"
          >
            ← Předchozí týden
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="btn btn-secondary"
          >
            Dnes
          </button>
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 7);
              setSelectedDate(next.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary"
          >
            Další týden →
          </button>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input"
        />
      </div>

      {/* Týdenní zobrazení */}
      <div className="grid grid-cols-7 gap-1 bg-gray-200 rounded-lg p-1">
        {weekDates.map((date) => (
          <div key={date} className="bg-white rounded min-h-[300px] p-2">
            <div className={`text-center pb-2 border-b mb-2 ${isToday(date) ? 'bg-blue-100 text-blue-800 rounded px-2 py-1' : ''}`}>
              <div className="text-sm font-medium">{getDayName(date)}</div>
              <div className="text-lg">{new Date(date).getDate()}</div>
            </div>
            
            <div className="space-y-1">
              {getMeetingsForDate(date).map((meeting) => {
                const client = meeting.clientId ? clients.find(c => c.id === meeting.clientId) : null;
                
                return (
                  <div
                    key={meeting.id}
                    className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-xs cursor-pointer hover:bg-blue-200"
                    onClick={() => handleEdit(meeting)}
                  >
                    <div className="font-medium text-blue-900">
                      {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                    </div>
                    <div className="text-blue-800 font-medium">{meeting.title}</div>
                    {client && (
                      <div className="text-blue-600">👤 {client.firstName} {client.lastName}</div>
                    )}
                    {meeting.location && (
                      <div className="text-blue-600">📍 {meeting.location}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Seznam nadcházejících schůzek */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nadcházející schůzky</h2>
        <div className="space-y-4">
          {meetingService.getUpcoming(user?.id).slice(0, 5).map((meeting) => {
            const client = meeting.clientId ? clients.find(c => c.id === meeting.clientId) : null;
            
            return (
              <div key={meeting.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>🕒 {new Date(meeting.startTime).toLocaleString('cs-CZ')}</span>
                      {meeting.location && <span>📍 {meeting.location}</span>}
                      {client && (
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          👤 {client.firstName} {client.lastName}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(meeting)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(meeting.id)}
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
      </div>

      {/* Formulář */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMeeting ? 'Upravit schůzku' : 'Nová schůzka'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Název schůzky *</label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Začátek *</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Konec *</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Místo konání</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input w-full"
                    placeholder="Kancelář, online, adresa..."
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
                    {editingMeeting ? 'Uložit změny' : 'Vytvořit schůzku'}
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

export default CalendarPage; 