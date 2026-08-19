'use client'

import {
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type WorkExperience = {
  id: number
  user_id: string
  company_name: string
  role_title: string
  industry: string
  description: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
}

const onboardingSteps = [
  { number: 1, title: 'Basic info', shortTitle: 'Basics' },
  { number: 2, title: 'Academic', shortTitle: 'Academic' },
  { number: 3, title: 'Career & about', shortTitle: 'Career' },
  { number: 4, title: 'Interests', shortTitle: 'Interests' },
  { number: 5, title: 'Clubs & organizations', shortTitle: 'Clubs' },
  { number: 6, title: 'Work experience', shortTitle: 'Work' },
  { number: 7, title: 'Projects', shortTitle: 'Projects' },
  { number: 8, title: 'Matching preferences', shortTitle: 'Matching' },
  { number: 9, title: 'Availability', shortTitle: 'Availability' },
  { number: 10, title: 'Privacy', shortTitle: 'Privacy' },
  { number: 11, title: 'Preview', shortTitle: 'Preview' },
]

export default function WorkOnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [
    workExperiences,
    setWorkExperiences,
  ] =
    useState<WorkExperience[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false)

  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(null)

  const [companyName, setCompanyName] =
    useState('')

  const [roleTitle, setRoleTitle] =
    useState('')

  const [industry, setIndustry] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [startDate, setStartDate] =
    useState('')

  const [endDate, setEndDate] =
    useState('')

  const [isCurrent, setIsCurrent] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const currentStep = 6

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadWorkExperience() {
      const supabase =
        createClient()

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
        userError ||
        !user
      ) {
        setError(
          'You must be logged in to continue.'
        )
        setLoading(false)
        return
      }

      setUserId(
        user.id
      )

      const {
        data,
        error:
          workError,
      } =
        await supabase
          .from(
            'work_experience'
          )
          .select(`
            id,
            user_id,
            company_name,
            role_title,
            industry,
            description,
            start_date,
            end_date,
            is_current
          `)
          .eq(
            'user_id',
            user.id
          )
          .order(
            'start_date',
            {
              ascending: false,
            }
          )

      if (workError) {
        setError(
          `Could not load work experience: ${workError.message}`
        )
        setLoading(false)
        return
      }

      setWorkExperiences(
        (data ||
          []) as WorkExperience[]
      )

      setLoading(false)
    }

    loadWorkExperience()
  }, [])

  function formatDate(
    value:
      | string
      | null
  ) {
    if (!value) {
      return ''
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      [],
      {
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function resetEditor() {
    setEditingId(null)
    setCompanyName('')
    setRoleTitle('')
    setIndustry('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setEditorOpen(false)
  }

  function openNewEditor() {
    setError('')
    setMessage('')
    setEditingId(null)
    setCompanyName('')
    setRoleTitle('')
    setIndustry('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setIsCurrent(false)
    setEditorOpen(true)
  }

  function openEditEditor(
    experience: WorkExperience
  ) {
    setError('')
    setMessage('')
    setEditingId(
      experience.id
    )
    setCompanyName(
      experience.company_name ||
        ''
    )
    setRoleTitle(
      experience.role_title ||
        ''
    )
    setIndustry(
      experience.industry ||
        ''
    )
    setDescription(
      experience.description ||
        ''
    )
    setStartDate(
      experience.start_date ||
        ''
    )
    setEndDate(
      experience.end_date ||
        ''
    )
    setIsCurrent(
      experience.is_current
    )
    setEditorOpen(true)
  }

  async function saveExperience() {
    if (
      !userId ||
      saving
    ) {
      return
    }

    const cleanedCompany =
      companyName.trim()

    const cleanedRole =
      roleTitle.trim()

    const cleanedIndustry =
      industry.trim()

    if (!cleanedCompany) {
      setError(
        'Company name is required.'
      )
      return
    }

    if (!cleanedRole) {
      setError(
        'Role title is required.'
      )
      return
    }

    if (!cleanedIndustry) {
      setError(
        'Industry is required.'
      )
      return
    }

    if (!startDate) {
      setError(
        'Start date is required.'
      )
      return
    }

    if (
      !isCurrent &&
      !endDate
    ) {
      setError(
        'End date is required unless this is your current role.'
      )
      return
    }

    if (
      !isCurrent &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      setError(
        'End date cannot be before start date.'
      )
      return
    }

    setError('')
    setMessage('')
    setSaving(true)

    const supabase =
      createClient()

    const payload = {
      user_id:
        userId,
      company_name:
        cleanedCompany,
      role_title:
        cleanedRole,
      industry:
        cleanedIndustry,
      description:
        description.trim() ||
        null,
      start_date:
        startDate,
      end_date:
        isCurrent
          ? null
          : endDate,
      is_current:
        isCurrent,
    }

    if (
      editingId !== null
    ) {
      const {
        data,
        error:
          updateError,
      } =
        await supabase
          .from(
            'work_experience'
          )
          .update(payload)
          .eq(
            'id',
            editingId
          )
          .eq(
            'user_id',
            userId
          )
          .select(`
            id,
            user_id,
            company_name,
            role_title,
            industry,
            description,
            start_date,
            end_date,
            is_current
          `)
          .single()

      if (updateError) {
        setError(
          `Could not update work experience: ${updateError.message}`
        )
        setSaving(false)
        return
      }

      setWorkExperiences(
        (current) =>
          current
            .map(
              (item) =>
                item.id ===
                editingId
                  ? data as WorkExperience
                  : item
            )
            .sort(
              (a, b) =>
                new Date(
                  b.start_date
                ).getTime() -
                new Date(
                  a.start_date
                ).getTime()
            )
      )

      setMessage(
        'Work experience updated.'
      )
    } else {
      const {
        data,
        error:
          insertError,
      } =
        await supabase
          .from(
            'work_experience'
          )
          .insert(payload)
          .select(`
            id,
            user_id,
            company_name,
            role_title,
            industry,
            description,
            start_date,
            end_date,
            is_current
          `)
          .single()

      if (insertError) {
        setError(
          `Could not add work experience: ${insertError.message}`
        )
        setSaving(false)
        return
      }

      setWorkExperiences(
        (current) =>
          [
            ...current,
            data as WorkExperience,
          ].sort(
            (a, b) =>
              new Date(
                b.start_date
              ).getTime() -
              new Date(
                a.start_date
              ).getTime()
          )
      )

      setMessage(
        'Work experience added.'
      )
    }

    setSaving(false)
    resetEditor()
  }

  async function deleteExperience(
    experienceId: number
  ) {
    if (
      !userId ||
      deletingId !== null ||
      saving
    ) {
      return
    }

    setError('')
    setMessage('')
    setDeletingId(
      experienceId
    )

    const supabase =
      createClient()

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          'work_experience'
        )
        .delete()
        .eq(
          'id',
          experienceId
        )
        .eq(
          'user_id',
          userId
        )

    if (deleteError) {
      setError(
        `Could not delete work experience: ${deleteError.message}`
      )
      setDeletingId(null)
      return
    }

    setWorkExperiences(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            experienceId
        )
    )

    if (
      editingId ===
      experienceId
    ) {
      resetEditor()
    }

    setMessage(
      'Work experience deleted.'
    )

    setDeletingId(null)
  }

  function goNext() {
    router.push(
      '/onboarding/projects'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            💼
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading work experience...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      <header className="border-b border-gray-200/70 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              router.push(
                '/onboarding/clubs'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            Step {currentStep} of {onboardingSteps.length}
          </span>
        </div>
      </header>

      <div className="border-b border-gray-200/70 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-4 sm:px-6">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>

          <div className="mt-3 hidden grid-cols-11 gap-1 lg:grid">
            {onboardingSteps.map(
              (step) => (
                <div
                  key={step.number}
                  className="text-center"
                >
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                      step.number === currentStep
                        ? 'bg-black text-white'
                        : step.number < currentStep
                          ? 'bg-gray-300 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.number}
                  </div>

                  <p
                    className={`mt-1 truncate text-[10px] font-medium ${
                      step.number === currentStep
                        ? 'text-black'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.shortTitle}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Your experience
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Work Experience
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Add internships, jobs, research roles, or other experience.
            This step is optional, and you can add as many positions as you want.
          </p>
        </section>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Your experience
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {workExperiences.length}{' '}
                {workExperiences.length === 1
                  ? 'position'
                  : 'positions'} added
                • no limit
              </p>
            </div>

            <button
              type="button"
              onClick={
                openNewEditor
              }
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Add experience
            </button>
          </div>

          {message && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {message}
            </p>
          )}

          {workExperiences.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-700">
                No work experience added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                That&apos;s completely okay. Add a position or skip this step.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {workExperiences.map(
                (experience) => (
                  <div
                    key={experience.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-bold text-gray-900">
                            {experience.role_title}
                          </h3>

                          {experience.is_current && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 break-words text-sm font-semibold text-gray-700">
                          {experience.company_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {experience.industry}
                          {' • '}
                          {formatDate(
                            experience.start_date
                          )}
                          {' – '}
                          {experience.is_current
                            ? 'Present'
                            : formatDate(
                                experience.end_date
                              )}
                        </p>

                        {experience.description && (
                          <p className="mt-3 break-words text-sm leading-relaxed text-gray-500">
                            {experience.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditEditor(
                              experience
                            )
                          }
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-black"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const confirmed =
                              window.confirm(
                                `Delete ${experience.role_title} at ${experience.company_name}?`
                              )

                            if (confirmed) {
                              deleteExperience(
                                experience.id
                              )
                            }
                          }}
                          disabled={
                            deletingId !== null
                          }
                          className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          experience.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {editorOpen && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {editingId !== null
                      ? 'Edit position'
                      : 'New position'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingId !== null
                      ? 'Update work experience'
                      : 'Add work experience'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    resetEditor
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 transition hover:text-black"
                  aria-label="Close work experience editor"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-5">

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">
                      Company <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={companyName}
                      onChange={(event) => {
                        setCompanyName(
                          event.target.value
                        )
                        setError('')
                      }}
                      placeholder="e.g. Microsoft"
                      maxLength={120}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold">
                      Role title <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(event) => {
                        setRoleTitle(
                          event.target.value
                        )
                        setError('')
                      }}
                      placeholder="e.g. Product Management Intern"
                      maxLength={120}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Industry <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={industry}
                    onChange={(event) => {
                      setIndustry(
                        event.target.value
                      )
                      setError('')
                    }}
                    placeholder="e.g. Technology"
                    maxLength={100}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Use the industry label you want to be searchable by.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">
                      Start date <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => {
                        setStartDate(
                          event.target.value
                        )
                        setError('')
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold">
                      End date
                    </label>

                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => {
                        setEndDate(
                          event.target.value
                        )
                        setError('')
                      }}
                      disabled={isCurrent}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(event) => {
                      setIsCurrent(
                        event.target.checked
                      )

                      if (
                        event.target.checked
                      ) {
                        setEndDate('')
                      }

                      setError('')
                    }}
                    className="mt-0.5 h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      I currently work here
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      End date will not be required.
                    </p>
                  </div>
                </label>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold">
                      Description
                    </label>

                    <span className="text-xs text-gray-400">
                      {description.length}/500
                    </span>
                  </div>

                  <textarea
                    value={description}
                    onChange={(event) => {
                      if (
                        event.target.value.length <=
                        500
                      ) {
                        setDescription(
                          event.target.value
                        )
                      }
                    }}
                    rows={4}
                    placeholder="What did you work on or accomplish?"
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={
                      resetEditor
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveExperience
                    }
                    disabled={saving}
                    className="w-full flex-1 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : editingId !== null
                        ? 'Save Changes'
                        : 'Add Experience'}
                  </button>
                </div>

              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/clubs'
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
              >
                Back
              </button>

              <button
                type="button"
                onClick={goNext}
                className="w-full flex-1 rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Continue
              </button>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="mt-4 w-full text-center text-sm font-semibold text-gray-400 transition hover:text-black"
            >
              Skip for now
            </button>
          </div>

        </section>

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Coming next
          </p>

          <p className="mt-2 text-sm font-semibold text-gray-700">
            Projects
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Add apps, research, startups, portfolios, or other things you&apos;ve built.
          </p>
        </section>

      </div>

    </main>
  )
}