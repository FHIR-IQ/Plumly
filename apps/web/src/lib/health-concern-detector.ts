export interface HealthConcern {
  type: 'critical' | 'warning' | 'info'
  term: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

// Medical terms and conditions that should be highlighted
const concernPatterns: HealthConcern[] = [
  // Critical conditions (red)
  {
    type: 'critical',
    term: 'emergency',
    description: 'Requires immediate medical attention',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '🚨'
  },
  {
    type: 'critical',
    term: 'uncontrolled',
    description: 'Condition not well managed',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '⚠️'
  },
  {
    type: 'critical',
    term: 'severe',
    description: 'Serious medical condition',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '⚠️'
  },
  {
    type: 'critical',
    term: 'high risk',
    description: 'Elevated risk factors',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '⚠️'
  },
  {
    type: 'critical',
    term: 'critical',
    description: 'Critical medical status',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '🚨'
  },
  {
    type: 'critical',
    term: 'urgent',
    description: 'Requires urgent attention',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: '🚨'
  },

  // Warning conditions (yellow/orange)
  {
    type: 'warning',
    term: 'diabetes',
    description: 'Chronic condition requiring management',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '⚡'
  },
  {
    type: 'warning',
    term: 'hypertension',
    description: 'High blood pressure',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '💓'
  },
  {
    type: 'warning',
    term: 'elevated',
    description: 'Above normal levels',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '📈'
  },
  {
    type: 'warning',
    term: 'abnormal',
    description: 'Outside normal range',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '📊'
  },
  {
    type: 'warning',
    term: 'depression',
    description: 'Mental health condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '🧠'
  },
  {
    type: 'warning',
    term: 'anxiety',
    description: 'Mental health condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '🧠'
  },
  {
    type: 'warning',
    term: 'chronic',
    description: 'Long-term condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '⏰'
  },
  {
    type: 'warning',
    term: 'obesity',
    description: 'Weight-related health concern',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '⚖️'
  },
  {
    type: 'warning',
    term: 'COPD',
    description: 'Chronic respiratory condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '🫁'
  },
  {
    type: 'warning',
    term: 'heart disease',
    description: 'Cardiovascular condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '❤️'
  },
  {
    type: 'warning',
    term: 'arthritis',
    description: 'Joint condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '🦴'
  },
  {
    type: 'warning',
    term: 'osteoporosis',
    description: 'Bone density condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: '🦴'
  },

  // Info/monitoring conditions (blue)
  {
    type: 'info',
    term: 'monitor',
    description: 'Requires regular monitoring',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '👁️'
  },
  {
    type: 'info',
    term: 'follow-up',
    description: 'Needs follow-up care',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '📅'
  },
  {
    type: 'info',
    term: 'medication',
    description: 'Medication management',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '💊'
  },
  {
    type: 'info',
    term: 'preventive',
    description: 'Preventive care measure',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '🛡️'
  },
  {
    type: 'info',
    term: 'immunization',
    description: 'Vaccination or immunization',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '💉'
  },
  {
    type: 'info',
    term: 'screening',
    description: 'Health screening',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: '🔍'
  }
]

export function detectHealthConcerns(text: string): Map<string, HealthConcern> {
  const concerns = new Map<string, HealthConcern>()
  const lowerText = text.toLowerCase()

  for (const pattern of concernPatterns) {
    if (lowerText.includes(pattern.term.toLowerCase())) {
      concerns.set(pattern.term, pattern)
    }
  }

  return concerns
}

export interface HighlightPart {
  type: 'text' | 'concern'
  key?: string
  concern?: HealthConcern
  text: string
}

export function highlightHealthConcerns(text: string): HighlightPart[] {
  const concerns = detectHealthConcerns(text)

  if (concerns.size === 0) {
    return [{ type: 'text', text }]
  }

  // Create a regex pattern for all concern terms
  const termPattern = Array.from(concerns.keys())
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex special chars
    .join('|')

  const regex = new RegExp(`\\b(${termPattern})\\b`, 'gi')

  const parts = text.split(regex)
  const result: HighlightPart[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const concern = Array.from(concerns.values()).find(
      c => c.term.toLowerCase() === part?.toLowerCase()
    )

    if (concern) {
      result.push({
        type: 'concern',
        key: `concern-${i}`,
        concern,
        text: part
      })
    } else if (part) {
      result.push({
        type: 'text',
        text: part
      })
    }
  }

  return result
}

export function getConcernSummary(text: string): {
  critical: number
  warning: number
  info: number
  total: number
} {
  const concerns = detectHealthConcerns(text)

  let critical = 0
  let warning = 0
  let info = 0

  concerns.forEach(concern => {
    switch (concern.type) {
      case 'critical':
        critical++
        break
      case 'warning':
        warning++
        break
      case 'info':
        info++
        break
    }
  })

  return {
    critical,
    warning,
    info,
    total: concerns.size
  }
}