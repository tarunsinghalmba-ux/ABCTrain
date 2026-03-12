import React, { useState } from 'react'
import { X, Upload, SquareCheck as CheckSquare } from 'lucide-react'
import { courseService } from '../services/courses'
import { supabase } from '../services/supabase'
import type { CourseAssignment } from '../types'

interface CourseCompletionModalProps {
  assignment: CourseAssignment
  caregiverId: string
  onClose: () => void
  onCompleted: () => void
}

export function CourseCompletionModal({ assignment, caregiverId, onClose, onCompleted }: CourseCompletionModalProps) {
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      setCertificateFile(file)
      setError(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setCertificatePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!certificateFile) {
      setError('Please upload a certificate of completion')
      return
    }

    if (!disclaimerAccepted) {
      setError('Please accept the disclaimer')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const fileExt = certificateFile.name.split('.').pop()
      const fileName = `${caregiverId}/${assignment.course_id}/${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage
        .from('certificates')
        .upload(fileName, certificateFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName)

      await courseService.completeAssignment(
        assignment.id,
        caregiverId,
        assignment.course_id,
        new Date().toISOString(),
        urlData.publicUrl,
        certificateFile.name
      )

      onCompleted()
      onClose()
    } catch (err: any) {
      console.error('Error completing course:', err)
      setError(err.message || 'Failed to submit completion. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Course</h2>
            <p className="text-sm text-gray-600 mt-1">{assignment.course?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate of Completion *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Please upload a screenshot or image showing your course completion certificate.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {certificatePreview ? (
                  <div className="space-y-3">
                    <img
                      src={certificatePreview}
                      alt="Certificate preview"
                      className="max-h-48 mx-auto rounded border border-gray-200"
                    />
                    <div className="text-sm text-gray-600">
                      {certificateFile?.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateFile(null)
                        setCertificatePreview(null)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Completion Disclaimer</h3>
              <p className="text-sm text-gray-700 mb-3">
                By submitting this completion, I certify that:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-4">
                <li>I have fully completed all required course materials</li>
                <li>I have met all course requirements and assessments</li>
                <li>The certificate uploaded is authentic and accurate</li>
                <li>I understand this information may be verified</li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={submitting}
                />
                <span className="text-sm font-medium text-gray-900">
                  I accept the above disclaimer and certify that I have completed this course
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!certificateFile || !disclaimerAccepted || submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Completion'}
          </button>
        </div>
      </div>
    </div>
  )
}
