'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const days = [
  { id: 1, name: 'Monday', short: 'M' },
  { id: 2, name: 'Tuesday', short: 'T' },
  { id: 3, name: 'Wednesday', short: 'W' },
  { id: 4, name: 'Thursday', short: 'T' },
  { id: 5, name: 'Friday', short: 'F' },
  { id: 6, name: 'Saturday', short: 'S' },
  { id: 0, name: 'Sunday', short: 'S' },
]

const times = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
]

export default function AvailabilityPage() {
  const router = useRouter()

  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('15:00')
  const [endTime, setEndTime] = useState('18:00')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleDay(dayId: number) {
    setSelectedDays((current) => {
      if (current.includes(dayId)) {
        return current.filter((day) => day !== dayId)
      }

      return [...current, dayId]
    })
  }

  async function handleContinue() {
    if (selectedDays.length === 0) {
      setError('Please select at least one day.')
      return
    }

    if (startTime >= endTime) {
      setError('End time must be later than start time.')
      return
    }

    setError('')
    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in to continue.')
      setLoading(false)
      return
    }

    // Remove the user's old availability
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      setError(`Could not update availability: ${deleteError.message}`)
      setLoading(false)
      return
    }

    // Create one row for each selected day
    const rows = selectedDays.map((day) => ({
      user_id: user.id,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    }))

    const { error: insertError } = await supabase
      .from('availability')
      .insert(rows)

    if (insertError) {
      setError(`Could not save availability: ${insertError.message}`)
      setLoading(false)
      return
    }

    setLoading(false)

    router.push('/onboarding/preferences')
  }

  function formatTime(time: string) {
    const [hourString] = time.split(':')
    const hour = Number(hourString)

    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour > 12) return `${hour - 12} PM`

    return `${hour} AM`
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">

      <div className="mx-auto max-w-2xl">

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-2 flex justify-between text-sm text-gray-500">
            <span>Step 4 of 5</span>
            <span>Availability</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-4/5 rounded-full bg-black" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            When are you usually free?
          </h1>

          <p className="mt-3 text-gray-600">
            Choose the days and time range when you'd be
            available for a BrewLink coffee chat.
          </p>
        </div>

        {/* Days */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Select your available days
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const selected = selectedDays.includes(day.id)

              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`aspect-square rounded-2xl border font-semibold transition ${
                    selected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
                  }`}
                >
                  <div className="text-xs opacity-60">
                    {day.name.slice(0, 3)}
                  </div>

                  <div className="mt-1 text-lg">
                    {day.short}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            What time are you usually available?
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="mb-2 block text-sm text-gray-500">
                Start
              </label>

              <select
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                {times.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-500">
                End
              </label>

              <select
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                {times.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Preview */}
        {selectedDays.length > 0 && (
          <div className="mb-6 rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-900">
              Your availability
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {selectedDays
                .map(
                  (dayId) =>
                    days.find((day) => day.id === dayId)?.name
                )
                .join(', ')}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {formatTime(startTime)} – {formatTime(endTime)}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

      </div>

    </main>
  )
}