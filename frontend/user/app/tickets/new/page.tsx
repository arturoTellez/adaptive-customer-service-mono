'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

const CATEGORIES = [
  'Financiamiento',
  'Garantías',
  'Documentos',
  'Entrega del Vehículo',
  'Mantenimiento',
  'Soporte Técnico',
  'Otro',
];

export default function NewTicketPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío a API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock: Guardar en localStorage temporalmente
    const newTicket = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Aquí harías la llamada a tu API
    console.log('Nuevo ticket:', newTicket);

    setIsSubmitting(false);
    router.push('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-kavak-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-kavak-blue hover:text-kavak-orange transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          
          <h1 className="text-3xl font-bold text-kavak-navy mb-2">Crear Nuevo Ticket</h1>
          <p className="text-kavak-gray-600">
            Completa el formulario para crear tu solicitud de soporte
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-kavak-navy mb-2">
                Título del Ticket *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all"
                placeholder="Ej: Problema con el proceso de financiamiento"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-kavak-navy mb-2">
                Categoría *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all bg-white"
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-kavak-navy mb-2">
                Descripción del Problema *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all resize-none"
                placeholder="Describe detalladamente tu problema o consulta..."
              />
              <p className="mt-2 text-xs text-kavak-gray-500">
                Proporciona todos los detalles relevantes para ayudarnos a resolver tu caso más rápido
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-kavak-gray-200 hover:bg-kavak-gray-300 text-kavak-navy font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-kavak-blue mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-kavak-navy mb-1">Tiempo de Respuesta</h3>
              <p className="text-sm text-kavak-gray-600">
                Nuestro equipo de soporte responderá tu ticket en menos de 24 horas hábiles. 
                Recibirás notificaciones por correo electrónico sobre cualquier actualización.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}