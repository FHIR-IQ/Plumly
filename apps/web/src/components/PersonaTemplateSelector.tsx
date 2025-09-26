'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Stethoscope, Heart, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import { PromptTemplateManager } from '@plumly/summarizer'
import type { PersonaTemplate, PersonaType, TemplateOptions } from '@plumly/summarizer'
import type { ResourceSelectionResult } from '@plumly/fhir-utils'

interface PersonaTemplateSelectorProps {
  resourceData: ResourceSelectionResult | null
  onTemplateChange?: (persona: PersonaType, options: TemplateOptions) => void
  selectedPersona?: PersonaType
}

export function PersonaTemplateSelector({
  resourceData,
  onTemplateChange,
  selectedPersona = 'patient'
}: PersonaTemplateSelectorProps) {
  const [templateManager] = useState(() => new PromptTemplateManager())
  const [currentPersona, setCurrentPersona] = useState<PersonaType>(selectedPersona)
  const [templateOptions, setTemplateOptions] = useState<TemplateOptions>({})
  const [templates, setTemplates] = useState<PersonaTemplate[]>([])

  useEffect(() => {
    const availableTemplates = templateManager.getAvailableTemplates()
    setTemplates(availableTemplates.filter(t => !t.abTestVariant)) // Only show main templates
  }, [templateManager])

  useEffect(() => {
    onTemplateChange?.(currentPersona, templateOptions)
  }, [currentPersona, templateOptions, onTemplateChange])

  const getPersonaIcon = (persona: PersonaType) => {
    switch (persona) {
      case 'patient': return <User className="h-5 w-5" />
      case 'provider': return <Stethoscope className="h-5 w-5" />
      case 'caregiver': return <Heart className="h-5 w-5" />
    }
  }

  const getPersonaColor = (persona: PersonaType) => {
    switch (persona) {
      case 'patient': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'provider': return 'bg-green-50 border-green-200 text-green-800'
      case 'caregiver': return 'bg-purple-50 border-purple-200 text-purple-800'
    }
  }

  const getCurrentTemplate = () => {
    return templates.find(t => t.persona === currentPersona)
  }

  const getEnabledSections = (template: PersonaTemplate) => {
    if (!resourceData || !template) return []

    return template.sections.filter(section => {
      if (section.conditions) {
        if (section.conditions.hasLabValues && resourceData.labValues.length === 0) {
          return false
        }
        if (section.conditions.hasChronicConditions &&
            resourceData.conditions.filter(c => c.isChronic).length === 0) {
          return false
        }
        if (section.conditions.hasActiveMedications &&
            resourceData.medications.filter(m => m.isActive).length === 0) {
          return false
        }
        if (section.conditions.hasAbnormalValues &&
            resourceData.labValues.filter(l => l.isAbnormal).length === 0) {
          return false
        }
      }
      return section.enabledByDefault
    }).sort((a, b) => b.priority - a.priority)
  }

  const validateCurrentTemplate = () => {
    const template = getCurrentTemplate()
    if (!template) return null
    return templateManager.validateTemplate(template)
  }

  const currentTemplate = getCurrentTemplate()
  const enabledSections = currentTemplate ? getEnabledSections(currentTemplate) : []
  const validation = validateCurrentTemplate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Persona Template Configuration
        </CardTitle>
        <CardDescription>
          Choose how to present the health summary based on the target audience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Persona Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Target Audience</h3>
            <div className="grid grid-cols-3 gap-3">
              {templates.filter(t => !t.abTestVariant).map(template => (
                <Button
                  key={template.persona}
                  variant={currentPersona === template.persona ? 'default' : 'outline'}
                  className={`h-auto p-4 flex-col gap-2 ${
                    currentPersona === template.persona ? '' : 'text-gray-600'
                  }`}
                  onClick={() => setCurrentPersona(template.persona)}
                >
                  {getPersonaIcon(template.persona)}
                  <div className="text-center">
                    <div className="font-medium text-sm capitalize">{template.persona}</div>
                    <div className="text-xs opacity-75">{template.targetAudience.readingLevel}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Current Template Details */}
          {currentTemplate && (
            <div className={`p-4 rounded-lg border-2 ${getPersonaColor(currentPersona)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{currentTemplate.name}</h3>
                  <p className="text-sm opacity-75">{currentTemplate.description}</p>
                </div>
                {validation && (
                  <div className="flex items-center gap-1">
                    {validation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-xs">
                      {validation.isValid ? 'Valid' : 'Issues'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Target Audience:</span>
                  <br />
                  {currentTemplate.targetAudience.primary}
                </div>
                <div>
                  <span className="font-medium">Reading Level:</span>
                  <br />
                  {currentTemplate.targetAudience.readingLevel}
                </div>
                <div>
                  <span className="font-medium">Clinical Expertise:</span>
                  <br />
                  <Badge variant="outline" className="capitalize">
                    {currentTemplate.targetAudience.clinicalExpertise}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Version:</span>
                  <br />
                  {currentTemplate.version}
                </div>
              </div>

              {/* Style Guidelines */}
              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <h4 className="font-medium text-sm mb-2">Style Guidelines</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div><strong>Tone:</strong> {currentTemplate.styleGuidelines.tone}</div>
                  <div><strong>Language:</strong> {currentTemplate.styleGuidelines.language}</div>
                  <div><strong>Technical Level:</strong> {currentTemplate.styleGuidelines.technicalLevel}</div>
                </div>
              </div>
            </div>
          )}

          {/* Section Configuration */}
          <div>
            <Tabs defaultValue="sections" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sections">Sections ({enabledSections.length})</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  {resourceData ? (
                    `Based on your data: ${resourceData.conditions.length} conditions, ${resourceData.medications.length} medications, ${resourceData.labValues.length} lab values`
                  ) : (
                    'Upload FHIR data to see personalized sections'
                  )}
                </div>

                {enabledSections.length > 0 ? (
                  <div className="space-y-2">
                    {enabledSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {index + 1}
                            </span>
                            <span className="font-medium">{section.title}</span>
                            {section.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          {section.conditions && (
                            <div className="mt-1">
                              <div className="flex flex-wrap gap-1">
                                {section.conditions.hasLabValues && (
                                  <Badge variant="outline" className="text-xs">Lab Values</Badge>
                                )}
                                {section.conditions.hasChronicConditions && (
                                  <Badge variant="outline" className="text-xs">Chronic Conditions</Badge>
                                )}
                                {section.conditions.hasActiveMedications && (
                                  <Badge variant="outline" className="text-xs">Active Medications</Badge>
                                )}
                                {section.conditions.hasAbnormalValues && (
                                  <Badge variant="outline" className="text-xs">Abnormal Values</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Priority</div>
                          <div className="font-bold text-lg">{section.priority}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {resourceData ? 'No sections match the current data' : 'No data available'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                {validation ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      {validation.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        Template {validation.isValid ? 'Valid' : 'Has Issues'}
                      </span>
                    </div>

                    {validation.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {validation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {validation.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.readingLevelCheck && (
                      <div className={`p-3 rounded-lg border ${
                        validation.readingLevelCheck.meetsTarget
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <h4 className={`font-medium mb-2 ${
                          validation.readingLevelCheck.meetsTarget
                            ? 'text-green-800'
                            : 'text-yellow-800'
                        }`}>
                          Reading Level Analysis
                        </h4>
                        <div className={`text-sm ${
                          validation.readingLevelCheck.meetsTarget
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}>
                          <div>Estimated: {validation.readingLevelCheck.estimated}</div>
                          <div>Target: {currentTemplate?.targetAudience.readingLevel}</div>
                          <div>Meets Target: {validation.readingLevelCheck.meetsTarget ? 'Yes' : 'No'}</div>
                          {validation.readingLevelCheck.suggestions.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">Suggestions:</div>
                              <ul className="mt-1 space-y-1">
                                {validation.readingLevelCheck.suggestions.map((suggestion, index) => (
                                  <li key={index}>• {suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-800 text-sm">
                          ✓ Template is valid and ready for use
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No template selected
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}