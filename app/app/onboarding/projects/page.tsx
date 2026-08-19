'use client'

import {
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Project = {
  id: number
  user_id: string
  title: string
  description: string | null
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

export default function ProjectsOnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [projects, setProjects] =
    useState<Project[]>([])

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

  const [title, setTitle] =
    useState('')

  const [
    description,
    setDescription,
  ] =
    useState('')

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

  const currentStep = 7

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadProjects() {
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
          projectError,
      } =
        await supabase
          .from('projects')
          .select(`
            id,
            user_id,
            title,
            description
          `)
          .eq(
            'user_id',
            user.id
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          )

      if (projectError) {
        setError(
          `Could not load projects: ${projectError.message}`
        )
        setLoading(false)
        return
      }

      setProjects(
        (data ||
          []) as Project[]
      )

      setLoading(false)
    }

    loadProjects()
  }, [])

  function resetEditor() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setEditorOpen(false)
  }

  function openNewEditor() {
    setError('')
    setMessage('')
    setEditingId(null)
    setTitle('')
    setDescription('')
    setEditorOpen(true)
  }

  function openEditEditor(
    project: Project
  ) {
    setError('')
    setMessage('')
    setEditingId(
      project.id
    )
    setTitle(
      project.title ||
        ''
    )
    setDescription(
      project.description ||
        ''
    )
    setEditorOpen(true)
  }

  async function saveProject() {
    if (
      !userId ||
      saving
    ) {
      return
    }

    const cleanedTitle =
      title.trim()

    if (!cleanedTitle) {
      setError(
        'Project title is required.'
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
      title:
        cleanedTitle,
      description:
        description.trim() ||
        null,
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
          .from('projects')
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
            title,
            description
          `)
          .single()

      if (updateError) {
        setError(
          `Could not update project: ${updateError.message}`
        )
        setSaving(false)
        return
      }

      setProjects(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              editingId
                ? data as Project
                : item
          )
      )

      setMessage(
        'Project updated.'
      )
    } else {
      const {
        data,
        error:
          insertError,
      } =
        await supabase
          .from('projects')
          .insert(payload)
          .select(`
            id,
            user_id,
            title,
            description
          `)
          .single()

      if (insertError) {
        setError(
          `Could not add project: ${insertError.message}`
        )
        setSaving(false)
        return
      }

      setProjects(
        (current) => [
          data as Project,
          ...current,
        ]
      )

      setMessage(
        'Project added.'
      )
    }

    setSaving(false)
    resetEditor()
  }

  async function deleteProject(
    projectId: number
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
      projectId
    )

    const supabase =
      createClient()

    const {
      error:
        deleteError,
    } =
      await supabase
        .from('projects')
        .delete()
        .eq(
          'id',
          projectId
        )
        .eq(
          'user_id',
          userId
        )

    if (deleteError) {
      setError(
        `Could not delete project: ${deleteError.message}`
      )
      setDeletingId(null)
      return
    }

    setProjects(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            projectId
        )
    )

    if (
      editingId ===
      projectId
    ) {
      resetEditor()
    }

    setMessage(
      'Project deleted.'
    )

    setDeletingId(null)
  }

  function goNext() {
    router.push(
      '/onboarding/matching'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🚀
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading projects...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      {/* HEADER */}

      <header className="border-b border-gray-200/70 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/onboarding/work'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            Step {currentStep} of{' '}
            {onboardingSteps.length}
          </span>

        </div>

      </header>

      {/* PROGRESS */}

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
                  key={
                    step.number
                  }
                  className="text-center"
                >

                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                      step.number ===
                      currentStep
                        ? 'bg-black text-white'
                        : step.number <
                          currentStep
                          ? 'bg-gray-300 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.number}
                  </div>

                  <p
                    className={`mt-1 truncate text-[10px] font-medium ${
                      step.number ===
                      currentStep
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

      {/* CONTENT */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            What you&apos;ve built
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Projects
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Add apps, research, startups, portfolios, case studies,
            or anything else you&apos;ve built. This step is optional.
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
                Your projects
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {projects.length}{' '}
                {projects.length === 1
                  ? 'project'
                  : 'projects'} added
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
              + Add project
            </button>

          </div>

          {message && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {message}
            </p>
          )}

          {projects.length === 0 ? (

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

              <p className="text-sm font-semibold text-gray-700">
                No projects added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                That&apos;s okay. Add something you&apos;ve built,
                or skip this step and come back later.
              </p>

            </div>

          ) : (

            <div className="mt-4 space-y-3">

              {projects.map(
                (project) => (

                  <div
                    key={
                      project.id
                    }
                    className="rounded-2xl border border-gray-200 bg-white p-5"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0 flex-1">

                        <h3 className="break-words text-base font-bold text-gray-900">
                          {project.title}
                        </h3>

                        {project.description ? (

                          <p className="mt-2 break-words text-sm leading-relaxed text-gray-500">
                            {project.description}
                          </p>

                        ) : (

                          <p className="mt-2 text-sm text-gray-400">
                            No description added.
                          </p>

                        )}

                      </div>

                      <div className="flex shrink-0 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditEditor(
                              project
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
                                `Delete "${project.title}"?`
                              )

                            if (confirmed) {
                              deleteProject(
                                project.id
                              )
                            }
                          }}
                          disabled={
                            deletingId !==
                            null
                          }
                          className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          project.id
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
                      ? 'Edit project'
                      : 'New project'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingId !== null
                      ? 'Update project'
                      : 'Add a project'}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    resetEditor
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 transition hover:text-black"
                  aria-label="Close project editor"
                >
                  ×
                </button>

              </div>

              <div className="mt-5 space-y-5">

                <div>

                  <label className="text-sm font-semibold">
                    Project title{' '}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      title
                    }
                    onChange={(event) => {
                      setTitle(
                        event.target.value
                      )
                      setError('')
                    }}
                    placeholder="e.g. BrewLink"
                    maxLength={120}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                </div>

                <div>

                  <div className="flex items-center justify-between gap-3">

                    <label className="text-sm font-semibold">
                      Description
                    </label>

                    <span className="text-xs text-gray-400">
                      {description.length}/700
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    Optional. Explain what you built, the problem it solves,
                    your role, or what you learned.
                  </p>

                  <textarea
                    value={
                      description
                    }
                    onChange={(event) => {
                      if (
                        event.target.value.length <=
                        700
                      ) {
                        setDescription(
                          event.target.value
                        )
                      }
                    }}
                    rows={5}
                    placeholder="Describe your project..."
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={
                      resetEditor
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveProject
                    }
                    disabled={
                      saving
                    }
                    className="w-full flex-1 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : editingId !== null
                        ? 'Save Changes'
                        : 'Add Project'}
                  </button>

                </div>

              </div>

            </div>

          )}

          {/* NAVIGATION */}

          <div className="mt-8 border-t border-gray-100 pt-6">

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/work'
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  goNext
                }
                className="w-full flex-1 rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Continue
              </button>

            </div>

            <button
              type="button"
              onClick={
                goNext
              }
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
            Matching Preferences
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Tell BrewLink what kinds of people and connections
            you want to prioritize.
          </p>

        </section>

      </div>

    </main>
  )
}