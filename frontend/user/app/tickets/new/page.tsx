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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTicket = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

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
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center text-kavak-blue hover:text-kavak-orange transition-colors mb-8 group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Volver</span>
        </button>
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-kavak-navy mb-3">Crear Nuevo Ticket</h1>
          <p className="text-lg text-kavak-gray-600">
            Completa el formulario y nuestro equipo te responderá en menos de 24 horas
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-kavak-gray-100 p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-kavak-navy mb-3">
                Título del Ticket
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-5 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-kavak-navy placeholder:text-kavak-gray-400"
                placeholder="Ej: Problema con el proceso de financiamiento"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-bold text-kavak-navy mb-3">
                Categoría
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-5 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all bg-white text-kavak-navy"
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
              <label htmlFor="description" className="block text-sm font-bold text-kavak-navy mb-3">
                Descripción del Problema
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-5 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all resize-none text-kavak-navy placeholder:text-kavak-gray-400"
                placeholder="Describe detalladamente tu problema o consulta..."
              />
              <p className="mt-3 text-sm text-kavak-gray-500">
                Proporciona todos los detalles relevantes para ayudarnos a resolver tu caso más rápido
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-kavak-gray-100 hover:bg-kavak-gray-200 text-kavak-navy font-semibold py-4 px-6 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-100 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-kavak-blue rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-kavak-navy mb-2 text-lg">Tiempo de Respuesta</h3>
              <p className="text-kavak-gray-700 leading-relaxed">
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