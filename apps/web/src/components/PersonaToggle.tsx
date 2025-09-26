'use client'

import { useState } from 'react'
import { User, Stethoscope, Heart } from 'lucide-react'
import type { PersonaType } from '@plumly/summarizer'

interface PersonaToggleProps {
  selectedPersona: PersonaType
  onPersonaChange: (persona: PersonaType) => void
  disabled?: boolean
}

export function PersonaToggle({ selectedPersona, onPersonaChange, disabled = false }: PersonaToggleProps) {
  const personas: { type: PersonaType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
    {
      type: 'patient',
      label: 'Patient',
      icon: <User className="h-4 w-4" />,
      description: 'Simple, clear language for patients and families',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    {
      type: 'provider',
      label: 'Provider',
      icon: <Stethoscope className="h-4 w-4" />,
      description: 'Clinical terminology for healthcare professionals',
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    },
    {
      type: 'caregiver',
      label: 'Caregiver',
      icon: <Heart className="h-4 w-4" />,
      description: 'Practical, actionable information for caregivers',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
    }
  ]

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Target Audience
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {personas.map((persona) => {
          const isSelected = selectedPersona === persona.type
          return (
            <button
              key={persona.type}
              onClick={() => !disabled && onPersonaChange(persona.type)}
              disabled={disabled}
              className={`
                relative flex items-center justify-center px-4 py-3 text-sm font-medium border rounded-lg
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
                ${isSelected
                  ? `${persona.color} ring-2 ring-offset-2 ring-current shadow-sm`
                  : `bg-white text-gray-700 border-gray-200 hover:bg-gray-50`
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2">
                  {persona.icon}
                  <span className="font-semibold">{persona.label}</span>
                </div>
                <span className="text-xs text-center opacity-75 leading-tight">
                  {persona.description}
                </span>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-current rounded-full" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Changing persona will regenerate the summary with appropriate language and detail level
      </div>
    </div>
  )
}