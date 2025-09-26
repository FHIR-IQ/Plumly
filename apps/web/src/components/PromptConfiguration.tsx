'use client'

import React, { useState, useEffect } from 'react'
import { PromptTemplate } from '@/types/fhir'
import { SummarizationOptions } from '@/lib/claude-client'

interface PromptConfigurationProps {
  onConfigChange: (config: SummarizationOptions & { templateId?: string }) => void
  className?: string
}

export default function PromptConfiguration({ onConfigChange, className = '' }: PromptConfigurationProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [targetAudience, setTargetAudience] = useState<'patient' | 'provider' | 'payer'>('patient')
  const [outputFormat, setOutputFormat] = useState<'narrative' | 'structured' | 'composition'>('narrative')
  const [includeRecommendations, setIncludeRecommendations] = useState(false)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [newFocusArea, setNewFocusArea] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    const config: SummarizationOptions & { templateId?: string } = {
      targetAudience,
      outputFormat,
      includeRecommendations,
      focusAreas
    }

    if (selectedTemplate) {
      config.templateId = selectedTemplate
    }

    onConfigChange(config)
  }, [targetAudience, outputFormat, includeRecommendations, focusAreas, selectedTemplate, onConfigChange])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
        if (data.templates.length > 0) {
          setSelectedTemplate(data.templates[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()])
      setNewFocusArea('')
    }
  }

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFocusArea()
    }
  }

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-8`}>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prompt Configuration</h3>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {selectedTemplateObj && (
          <p className="mt-1 text-sm text-gray-600">
            {selectedTemplateObj.description}
          </p>
        )}
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'patient', label: 'Patient', desc: 'Simple, friendly language' },
            { value: 'provider', label: 'Provider', desc: 'Clinical terminology' },
            { value: 'payer', label: 'Payer', desc: 'Utilization focused' }
          ].map((option) => (
            <label key={option.value} className="relative">
              <input
                type="radio"
                name="audience"
                value={option.value}
                checked={targetAudience === option.value}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="sr-only"
              />
              <div className={`
                p-3 border rounded-lg cursor-pointer text-center transition-colors
                ${targetAudience === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'narrative', label: 'Narrative', desc: 'Flowing text' },
            { value: 'structured', label: 'Structured', desc: 'Bullet points & sections' },
            { value: 'composition', label: 'Composition', desc: 'FHIR format' }
          ].map((option) => (
            <label key={option.value} className="relative">
              <input
                type="radio"
                name="format"
                value={option.value}
                checked={outputFormat === option.value}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="sr-only"
              />
              <div className={`
                p-3 border rounded-lg cursor-pointer text-center transition-colors
                ${outputFormat === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeRecommendations}
            onChange={(e) => setIncludeRecommendations(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Include recommendations</span>
        </label>
      </div>

      {/* Focus Areas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Focus Areas
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFocusArea}
            onChange={(e) => setNewFocusArea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add focus area (e.g., diabetes, medications)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addFocusArea}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        {focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {area}
                <button
                  onClick={() => removeFocusArea(area)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}