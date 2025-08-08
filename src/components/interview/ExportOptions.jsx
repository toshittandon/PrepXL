import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Printer,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { Button, Modal } from '../common'

const ExportOptions = ({ 
  session, 
  interactions = [], 
  isOpen, 
  onClose,
  className = '' 
}) => {
  const [exportFormat, setExportFormat] = useState('json')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const exportFormats = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Machine-readable format with complete data',
      icon: FileJson,
      extension: 'json'
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Spreadsheet format for data analysis',
      icon: FileSpreadsheet,
      extension: 'csv'
    },
    {
      id: 'txt',
      name: 'Text',
      description: 'Plain text format for easy reading',
      icon: FileText,
      extension: 'txt'
    }
  ]

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  }

  const generateFileName = (format) => {
    const date = formatDate(session?.startedAt || new Date())
    const sessionType = session?.sessionType?.replace(/\s+/g, '-').toLowerCase() || 'interview'
    return `interview-report-${sessionType}-${date}.${format}`
  }

  const exportToJSON = () => {
    const exportData = {
      session: {
        id: session.$id,
        type: session.sessionType,
        role: session.role,
        status: session.status,
        finalScore: session.finalScore,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        duration: session.completedAt 
          ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / (1000 * 60))
          : null
      },
      interactions: interactions.map((interaction, index) => ({
        order: interaction.order || index + 1,
        question: interaction.questionText,
        answer: interaction.userAnswerText || '',
        timestamp: interaction.timestamp,
        wordCount: interaction.userAnswerText ? interaction.userAnswerText.split(' ').length : 0
      })),
      exportedAt: new Date().toISOString(),
      totalQuestions: interactions.length,
      answeredQuestions: interactions.filter(i => i.userAnswerText).length
    }

    return JSON.stringify(exportData, null, 2)
  }

  const exportToCSV = () => {
    const headers = ['Order', 'Question', 'Answer', 'Word Count', 'Timestamp']
    const rows = interactions.map((interaction, index) => [
      interaction.order || index + 1,
      `"${interaction.questionText?.replace(/"/g, '""') || ''}"`,
      `"${interaction.userAnswerText?.replace(/"/g, '""') || ''}"`,
      interaction.userAnswerText ? interaction.userAnswerText.split(' ').length : 0,
      interaction.timestamp || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csvContent
  }

  const exportToTXT = () => {
    const header = `INTERVIEW REPORT
================

Session Details:
- Type: ${session.sessionType} Interview
- Role: ${session.role}
- Date: ${new Date(session.startedAt).toLocaleDateString()}
- Duration: ${session.completedAt 
  ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / (1000 * 60)) + ' minutes'
  : 'In progress'}
- Final Score: ${session.finalScore || 'N/A'}%
- Questions: ${interactions.length}

INTERVIEW TRANSCRIPT
===================

`

    const transcript = interactions.map((interaction, index) => {
      const orderNum = interaction.order || index + 1
      const timestamp = interaction.timestamp 
        ? new Date(interaction.timestamp).toLocaleTimeString()
        : ''
      
      return `Question ${orderNum} ${timestamp ? `(${timestamp})` : ''}:
${interaction.questionText || 'No question text'}

Your Answer:
${interaction.userAnswerText || 'No answer provided'}

---

`
    }).join('')

    const footer = `
Report generated on: ${new Date().toLocaleString()}
`

    return header + transcript + footer
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      let content = ''
      let mimeType = ''

      switch (exportFormat) {
        case 'json':
          content = exportToJSON()
          mimeType = 'application/json'
          break
        case 'csv':
          content = exportToCSV()
          mimeType = 'text/csv'
          break
        case 'txt':
          content = exportToTXT()
          mimeType = 'text/plain'
          break
        default:
          throw new Error('Unsupported export format')
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = generateFileName(exportFormats.find(f => f.id === exportFormat)?.extension)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Export failed:', error)
      // Could add error state here
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!session) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Report">
      <div className={`space-y-6 ${className}`}>
        {/* Export Format Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Choose Export Format
          </h3>
          <div className="space-y-3">
            {exportFormats.map((format) => {
              const Icon = format.icon
              return (
                <motion.div
                  key={format.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    exportFormat === format.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setExportFormat(format.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${
                      exportFormat === format.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          exportFormat === format.id
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {format.name}
                        </span>
                        {exportFormat === format.id && (
                          <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      <p className={`text-sm ${
                        exportFormat === format.id
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {format.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* File Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            File Preview
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Filename:</strong> {generateFileName(exportFormats.find(f => f.id === exportFormat)?.extension)}</p>
            <p><strong>Content:</strong> Session details and {interactions.length} interactions</p>
            <p><strong>Size:</strong> ~{Math.round(JSON.stringify({ session, interactions }).length / 1024)} KB</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handlePrint}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </Button>

          <div className="flex items-center space-x-3">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              variant="primary"
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <AnimatePresence mode="wait">
                {isExporting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </motion.div>
                ) : exportSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="download"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span>
                {isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ExportOptions