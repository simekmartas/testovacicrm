import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Client } from '../types';
import { clientService } from '../services/localStorageService';
import { hasGithubAccess } from '../config/environment';
import { githubClientService } from '../services/githubService';
import toast from 'react-hot-toast';

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormData>();

  useEffect(() => {
    if (isEdit && id) {
      loadClient(parseInt(id));
    }
  }, [isEdit, id]);

  const loadClient = async (clientId: number) => {
    setIsLoading(true);
    try {
      const client = clientService.getById(clientId);
      if (client) {
        reset({
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth,
          address: client.address,
          city: client.city,
          postalCode: client.postalCode,
          notes: client.notes,
        });
      } else {
        toast.error('Klient nenalezen');
        navigate('/clients');
      }
    } catch (error) {
      toast.error('Chyba při načítání klienta');
      navigate('/clients');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSaving(true);
    try {
      let savedClient: Client | null;
      
      if (isEdit && id) {
        // Editace existujícího klienta
        savedClient = clientService.update(parseInt(id), data);
        if (savedClient) {
          toast.success('Klient byl úspěšně aktualizován');
        }
      } else {
        // Vytvoření nového klienta
        savedClient = clientService.create(data);
        if (savedClient) {
          toast.success('Klient byl úspěšně vytvořen');
        }
      }
      
      // Pokus o synchronizaci s GitHubem
      if (savedClient && hasGithubAccess()) {
        try {
          await githubClientService.save(savedClient);
          toast.success('Data synchronizována s GitHub');
        } catch (error) {
          toast.error('Nepodařilo se uložit na GitHub, změny zůstávají lokálně');
        }
      }
      
      navigate('/clients');
    } catch (error) {
      toast.error('Chyba při ukládání klienta');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Upravit klienta' : 'Nový klient'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Osobní údaje</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">Jméno *</label>
              <input
                {...register('firstName', { required: 'Jméno je povinné' })}
                type="text"
                className="input"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Příjmení *</label>
              <input
                {...register('lastName', { required: 'Příjmení je povinné' })}
                type="text"
                className="input"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                {...register('email', {
                  required: 'Email je povinný',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Neplatný formát emailu'
                  }
                })}
                type="email"
                className="input"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Telefon</label>
              <input
                {...register('phone')}
                type="tel"
                className="input"
              />
            </div>

            <div>
              <label className="label">Datum narození</label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Adresa</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="label">Ulice a číslo</label>
              <input
                {...register('address')}
                type="text"
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">Město</label>
                <input
                  {...register('city')}
                  type="text"
                  className="input"
                />
              </div>

              <div>
                <label className="label">PSČ</label>
                <input
                  {...register('postalCode')}
                  type="text"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Poznámky</h2>
          
          <div>
            <textarea
              {...register('notes')}
              rows={4}
              className="input"
              placeholder="Zde můžete zapsat jakékoliv poznámky ke klientovi..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="btn btn-secondary"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Ukládám...' : (isEdit ? 'Uložit změny' : 'Vytvořit klienta')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientFormPage; 