'use client'

import React, { useState } from 'react'
import { FHIRBundle } from '@/types/fhir'

interface SampleBundle {
  id: string
  name: string
  description: string
  conditions?: string[]
  age?: number
  gender?: string
  fileSize: string
}

interface SampleBundleSelectorProps {
  onSelectBundle: (bundle: FHIRBundle) => void
  className?: string
}

const sampleBundles: SampleBundle[] = [
  {
    id: 'robert_botsford',
    name: 'Robert Botsford',
    description: 'Elderly female with prediabetes and hypertension',
    conditions: ['Hypertension', 'Prediabetes', 'Anemia', 'Osteoarthritis'],
    age: 78,
    gender: 'Female',
    fileSize: '638 KB'
  },
  {
    id: 'gianna_mcclure',
    name: 'Gianna McClure',
    description: 'Young child with minimal medical history',
    conditions: ['Routine pediatric care'],
    age: 7,
    gender: 'Female',
    fileSize: '345 KB'
  },
  {
    id: 'harrison_schuster',
    name: 'Harrison Schuster',
    description: 'Centenarian with complex medical conditions',
    conditions: ['Diabetes', 'Cardiac Arrest', 'Lung Cancer', 'Kidney Disease'],
    age: 113,
    gender: 'Male',
    fileSize: '4.4 MB'
  },
  {
    id: 'maria_mante',
    name: 'Maria Mante',
    description: 'Pre-teen male with minimal medical history',
    conditions: ['Routine pediatric care'],
    age: 11,
    gender: 'Male',
    fileSize: '572 KB'
  },
  {
    id: 'maxwell_koepp',
    name: 'Maxwell Koepp',
    description: 'Elderly male with diabetes and complications',
    conditions: ['Diabetes', 'Hypertension', 'Diabetic Neuropathy', 'Diabetic Retinopathy'],
    age: 67,
    gender: 'Male',
    fileSize: '741 KB'
  },
  {
    id: 'will_lang',
    name: 'Will Lang',
    description: 'Teenager with minimal medical history',
    conditions: ['Routine care'],
    age: 13,
    gender: 'Male',
    fileSize: '721 KB'
  },
  {
    id: 'shelia_sipes',
    name: 'Shelia Sipes',
    description: 'Young child with minimal medical history',
    conditions: ['Routine pediatric care'],
    age: 7,
    gender: 'Female',
    fileSize: '346 KB'
  }
]

export default function SampleBundleSelector({ onSelectBundle, className = '' }: SampleBundleSelectorProps) {
  const [selectedBundle, setSelectedBundle] = useState<string>('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSampleBundle = async (bundleId: string) => {
    setIsLoading(bundleId)
    setError(null)

    try {
      const response = await fetch(`/sample-data/synthea-samples/${bundleId}.json`)

      if (!response.ok) {
        throw new Error(`Failed to load sample bundle: ${response.statusText}`)
      }

      const bundle: FHIRBundle = await response.json()
      onSelectBundle(bundle)
      setSelectedBundle(bundleId)
    } catch (err) {
      console.error('Error loading sample bundle:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sample bundle')
    } finally {
      setIsLoading(null)
    }
  }

  const resetSelection = () => {
    setSelectedBundle('')
    setError(null)
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or choose a sample patient:
        </label>
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
          {sampleBundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-blue-50 ${
                selectedBundle === bundle.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => loadSampleBundle(bundle.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{bundle.name}</h4>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span>{bundle.age}y</span>
                      <span>•</span>
                      <span>{bundle.gender}</span>
                      <span>•</span>
                      <span>{bundle.fileSize}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                  {bundle.conditions && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bundle.conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-shrink-0">
                  {isLoading === bundle.id ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : selectedBundle === bundle.id ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      )}

      {selectedBundle && (
        <div className="mt-3 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm font-medium">
              Sample bundle loaded: {sampleBundles.find(b => b.id === selectedBundle)?.name}
            </span>
          </div>
          <button
            onClick={resetSelection}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-blue-800 text-sm">
          <div className="font-medium mb-1">📊 Synthea Sample Data</div>
          <div className="text-blue-700 text-xs">
            These are realistic synthetic patient records generated by Synthea, containing comprehensive medical histories
            with conditions, medications, encounters, and observations. Perfect for testing and demonstration.
          </div>
        </div>
      </div>
    </div>
  )
}