'use client'

import {
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AvailabilitySlot = {
  id: number
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
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

const days = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export default function AvailabilityOnboardingPage() {
  const router = useRouter()

  const [userId, setUserId] =
    useState('')

  const [
    availabilitySlots,
    setAvailabilitySlots,
  ] =
    useState<AvailabilitySlot[]>([])

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

  const [day, setDay] =
    useState(1)

  const [startTime, setStartTime] =
    useState('')

  const [endTime, setEndTime] =
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

  const currentStep = 9

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  useEffect(() => {
    async function loadAvailability() {
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
          availabilityError,
      } =
        await supabase
          .from('availability')
          .select(`
            id,
            user_id,
            day_of_week,
            start_time,
            end_time
          `)
          .eq(
            'user_id',
            user.id
          )
          .order(
            'day_of_week',
            {
              ascending: true,
            }
          )
          .order(
            'start_time',
            {
              ascending: true,
            }
          )

      if (availabilityError) {
        setError(
          `Could not load availability: ${availabilityError.message}`
        )
        setLoading(false)
        return
      }

      setAvailabilitySlots(
        (data ||
          []) as AvailabilitySlot[]
      )

      setLoading(false)
    }

    loadAvailability()
  }, [])

  function getDayLabel(
    dayValue: number
  ) {
    return (
      days.find(
        (item) =>
          item.value ===
          dayValue
      )?.label ||
      `Day ${dayValue}`
    )
  }

  function formatTime(
    value: string
  ) {
    const [
      rawHour,
      rawMinute,
    ] =
      value.split(':')

    const hour =
      Number(rawHour)

    const minute =
      rawMinute ||
      '00'

    if (
      Number.isNaN(hour)
    ) {
      return value
    }

    const period =
      hour >= 12
        ? 'PM'
        : 'AM'

    const displayHour =
      hour % 12 || 12

    return `${displayHour}:${minute} ${period}`
  }

  function timesOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ) {
    return (
      startA < endB &&
      endA > startB
    )
  }

  function resetEditor() {
    setEditingId(null)
    setDay(1)
    setStartTime('')
    setEndTime('')
    setEditorOpen(false)
  }

  function openNewEditor(
    dayValue?: number
  ) {
    setError('')
    setMessage('')
    setEditingId(null)
    setDay(
      dayValue ||
      1
    )
    setStartTime('')
    setEndTime('')
    setEditorOpen(true)
  }

  function openEditEditor(
    slot: AvailabilitySlot
  ) {
    setError('')
    setMessage('')
    setEditingId(
      slot.id
    )
    setDay(
      slot.day_of_week
    )
    setStartTime(
      slot.start_time.slice(
        0,
        5
      )
    )
    setEndTime(
      slot.end_time.slice(
        0,
        5
      )
    )
    setEditorOpen(true)
  }

  async function saveSlot() {
    if (
      !userId ||
      saving
    ) {
      return
    }

    if (!startTime) {
      setError(
        'Start time is required.'
      )
      return
    }

    if (!endTime) {
      setError(
        'End time is required.'
      )
      return
    }

    if (
      startTime >= endTime
    ) {
      setError(
        'End time must be later than start time.'
      )
      return
    }

    const overlapping =
      availabilitySlots.find(
        (slot) =>
          slot.day_of_week ===
            day &&
          slot.id !==
            editingId &&
          timesOverlap(
            startTime,
            endTime,
            slot.start_time.slice(
              0,
              5
            ),
            slot.end_time.slice(
              0,
              5
            )
          )
      )

    if (overlapping) {
      setError(
        `This overlaps with another ${getDayLabel(
          day
        )} availability slot.`
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
      day_of_week:
        day,
      start_time:
        startTime,
      end_time:
        endTime,
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
          .from('availability')
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
            day_of_week,
            start_time,
            end_time
          `)
          .single()

      if (updateError) {
        setError(
          `Could not update availability: ${updateError.message}`
        )
        setSaving(false)
        return
      }

      setAvailabilitySlots(
        (current) =>
          current
            .map(
              (slot) =>
                slot.id ===
                editingId
                  ? data as AvailabilitySlot
                  : slot
            )
            .sort(
              (a, b) =>
                a.day_of_week -
                  b.day_of_week ||
                a.start_time.localeCompare(
                  b.start_time
                )
            )
      )

      setMessage(
        'Availability updated.'
      )
    } else {
      const {
        data,
        error:
          insertError,
      } =
        await supabase
          .from('availability')
          .insert(payload)
          .select(`
            id,
            user_id,
            day_of_week,
            start_time,
            end_time
          `)
          .single()

      if (insertError) {
        setError(
          `Could not add availability: ${insertError.message}`
        )
        setSaving(false)
        return
      }

      setAvailabilitySlots(
        (current) =>
          [
            ...current,
            data as AvailabilitySlot,
          ].sort(
            (a, b) =>
              a.day_of_week -
                b.day_of_week ||
              a.start_time.localeCompare(
                b.start_time
              )
          )
      )

      setMessage(
        'Availability added.'
      )
    }

    setSaving(false)
    resetEditor()
  }

  async function deleteSlot(
    slotId: number
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
      slotId
    )

    const supabase =
      createClient()

    const {
      error:
        deleteError,
    } =
      await supabase
        .from('availability')
        .delete()
        .eq(
          'id',
          slotId
        )
        .eq(
          'user_id',
          userId
        )

    if (deleteError) {
      setError(
        `Could not delete availability: ${deleteError.message}`
      )
      setDeletingId(null)
      return
    }

    setAvailabilitySlots(
      (current) =>
        current.filter(
          (slot) =>
            slot.id !==
            slotId
        )
    )

    if (
      editingId === slotId
    ) {
      resetEditor()
    }

    setMessage(
      'Availability removed.'
    )

    setDeletingId(null)
  }

  function goNext() {
    router.push(
      '/onboarding/privacy'
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            📅
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading availability...
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
                '/onboarding/matching'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            Brework
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
            When you&apos;re free
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Availability
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Add your usual weekly availability so Brework can make scheduling easier.
            You can add multiple time windows on the same day, or skip this step.
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
                Weekly schedule
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {availabilitySlots.length}{' '}
                {availabilitySlots.length === 1
                  ? 'time slot'
                  : 'time slots'} added
                • no limit
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                openNewEditor()
              }
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Add time
            </button>

          </div>

          {message && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {message}
            </p>
          )}

          {availabilitySlots.length === 0 ? (

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

              <p className="text-sm font-semibold text-gray-700">
                No availability added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                That&apos;s okay. Add your usual free times or skip this step.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {days.map(
                (dayItem) => {
                  const daySlots =
                    availabilitySlots.filter(
                      (slot) =>
                        slot.day_of_week ===
                        dayItem.value
                    )

                  if (
                    daySlots.length === 0
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={
                        dayItem.value
                      }
                      className="rounded-2xl bg-gray-50 p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-bold text-gray-900">
                          {dayItem.label}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openNewEditor(
                              dayItem.value
                            )
                          }
                          className="text-xs font-semibold text-gray-400 transition hover:text-black"
                        >
                          + Add
                        </button>

                      </div>

                      <div className="mt-3 space-y-2">

                        {daySlots.map(
                          (slot) => (

                          <div
                            key={
                              slot.id
                            }
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <p className="text-sm font-semibold text-gray-700">
                              {formatTime(
                                slot.start_time
                              )}
                              {' – '}
                              {formatTime(
                                slot.end_time
                              )}
                            </p>

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditEditor(
                                    slot
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-black"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const confirmed =
                                    window.confirm(
                                      `Remove ${dayItem.label} ${formatTime(
                                        slot.start_time
                                      )} – ${formatTime(
                                        slot.end_time
                                      )}?`
                                    )

                                  if (confirmed) {
                                    deleteSlot(
                                      slot.id
                                    )
                                  }
                                }}
                                disabled={
                                  deletingId !==
                                  null
                                }
                                className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                slot.id
                                  ? 'Removing...'
                                  : 'Remove'}
                              </button>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

          {editorOpen && (

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {editingId !== null
                      ? 'Edit availability'
                      : 'New availability'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingId !== null
                      ? 'Update time window'
                      : 'Add a time window'}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    resetEditor
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 transition hover:text-black"
                  aria-label="Close availability editor"
                >
                  ×
                </button>

              </div>

              <div className="mt-5 space-y-5">

                <div>

                  <label className="text-sm font-semibold">
                    Day
                  </label>

                  <select
                    value={
                      day
                    }
                    onChange={(event) => {
                      setDay(
                        Number(
                          event.target.value
                        )
                      )
                      setError('')
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  >
                    {days.map(
                      (dayItem) => (
                        <option
                          key={
                            dayItem.value
                          }
                          value={
                            dayItem.value
                          }
                        >
                          {dayItem.label}
                        </option>
                      )
                    )}
                  </select>

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="text-sm font-semibold">
                      Start time{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="time"
                      value={
                        startTime
                      }
                      onChange={(event) => {
                        setStartTime(
                          event.target.value
                        )
                        setError('')
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      End time{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="time"
                      value={
                        endTime
                      }
                      onChange={(event) => {
                        setEndTime(
                          event.target.value
                        )
                        setError('')
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                </div>

                <p className="text-xs leading-relaxed text-gray-400">
                  Add separate windows if you are free at multiple times on the same day.
                  Overlapping windows are prevented.
                </p>

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
                      saveSlot
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
                        : 'Add Time'}
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
                    '/onboarding/matching'
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
            Privacy & Discovery
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Choose whether you appear in discovery and which profile details other students can see.
          </p>

        </section>

      </div>

    </main>
  )
}