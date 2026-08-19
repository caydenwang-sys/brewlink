'use client'

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const onboardingSteps = [
  {
    number: 1,
    title: 'Basic info',
    shortTitle: 'Basics',
  },
  {
    number: 2,
    title: 'Academic',
    shortTitle: 'Academic',
  },
  {
    number: 3,
    title: 'Career & about',
    shortTitle: 'Career',
  },
  {
    number: 4,
    title: 'Interests',
    shortTitle: 'Interests',
  },
  {
    number: 5,
    title: 'Clubs & organizations',
    shortTitle: 'Clubs',
  },
  {
    number: 6,
    title: 'Work experience',
    shortTitle: 'Work',
  },
  {
    number: 7,
    title: 'Projects',
    shortTitle: 'Projects',
  },
  {
    number: 8,
    title: 'Matching preferences',
    shortTitle: 'Matching',
  },
  {
    number: 9,
    title: 'Availability',
    shortTitle: 'Availability',
  },
  {
    number: 10,
    title: 'Privacy',
    shortTitle: 'Privacy',
  },
  {
    number: 11,
    title: 'Preview',
    shortTitle: 'Preview',
  },
]

export default function OnboardingPage() {
  const router = useRouter()

  const [firstName, setFirstName] =
    useState('')

  const [lastName, setLastName] =
    useState('')

  const [major, setMajor] =
    useState('')

  const [year, setYear] =
    useState('')

  const [
    photoPreview,
    setPhotoPreview,
  ] =
    useState<string | null>(
      null
    )

  const [
    photoFile,
    setPhotoFile,
  ] =
    useState<File | null>(
      null
    )

  const [
    loadingProfile,
    setLoadingProfile,
  ] =
    useState(true)

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] =
    useState(false)

  const [careerGoal, setCareerGoal] =
    useState('')

  const [bio, setBio] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [currentStep, setCurrentStep] =
    useState(1)

  const progress =
    Math.round(
      (
        currentStep /
        onboardingSteps.length
      ) * 100
    )

  const requiredComplete =
    Boolean(
      firstName.trim() &&
      lastName.trim() &&
      major.trim() &&
      year
    )

  const displayName =
    `${firstName} ${lastName}`
      .trim() ||
    'Your Name'

  useEffect(() => {
    async function loadExistingProfile() {
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
        setLoadingProfile(false)
        return
      }

      const {
        data,
        error:
          profileError,
      } =
        await supabase
          .from('profiles')
          .select(`
            first_name,
            last_name,
            major,
            academic_year,
            profile_photo_url,
            career_goal,
            bio
          `)
          .eq(
            'id',
            user.id
          )
          .maybeSingle()

      if (profileError) {
        setError(
          `Could not load your saved profile: ${profileError.message}`
        )
        setLoadingProfile(false)
        return
      }

      if (data) {
        setFirstName(
          data.first_name ||
          ''
        )

        setLastName(
          data.last_name ||
          ''
        )

        setMajor(
          data.major ||
          ''
        )

        setYear(
          data.academic_year ||
          ''
        )

        setPhotoPreview(
          data.profile_photo_url ||
          null
        )

        setCareerGoal(
          data.career_goal ||
          ''
        )

        setBio(
          data.bio ||
          ''
        )
      }

      setLoadingProfile(false)
    }

    loadExistingProfile()
  }, [])

  function handlePhotoChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      setError(
        'Please choose an image file.'
      )
      return
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Profile photos must be smaller than 5MB.'
      )
      return
    }

    setPhotoFile(file)

    const previewUrl =
      URL.createObjectURL(
        file
      )

    setPhotoPreview(
      previewUrl
    )
  }

  async function uploadPhoto(
    userId: string
  ) {
    if (!photoFile) {
      return null
    }

    setUploadingPhoto(true)

    const supabase =
      createClient()

    const fileExtension =
      photoFile.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

    const filePath =
      `${userId}/profile.${fileExtension}`

    const {
      error:
        removeError,
    } =
      await supabase.storage
        .from(
          'profile-photos'
        )
        .remove([
          `${userId}/profile.jpg`,
          `${userId}/profile.jpeg`,
          `${userId}/profile.png`,
          `${userId}/profile.webp`,
        ])

    if (removeError) {
      console.log(
        'Could not remove previous profile photo:',
        removeError.message
      )
    }

    const {
      error:
        uploadError,
    } =
      await supabase.storage
        .from(
          'profile-photos'
        )
        .upload(
          filePath,
          photoFile,
          {
            upsert: true,
            contentType:
              photoFile.type,
            cacheControl:
              '0',
          }
        )

    if (uploadError) {
      setError(
        `Could not upload photo: ${uploadError.message}`
      )
      setUploadingPhoto(false)
      return null
    }

    const {
      data:
        publicUrlData,
    } =
      supabase.storage
        .from(
          'profile-photos'
        )
        .getPublicUrl(
          filePath
        )

    const photoUrl =
      `${publicUrlData.publicUrl}?v=${Date.now()}`

    setPhotoPreview(
      photoUrl
    )

    setPhotoFile(null)
    setUploadingPhoto(false)

    return photoUrl
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!firstName.trim()) {
      setError(
        'First name is required.'
      )
      return
    }

    if (!lastName.trim()) {
      setError(
        'Last name is required.'
      )
      return
    }

    if (!major.trim()) {
      setError(
        'Major is required.'
      )
      return
    }

    if (!year) {
      setError(
        'Academic year is required.'
      )
      return
    }

    setLoading(true)
    setError('')

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

    let uploadedPhotoUrl:
      string | null = null

    if (photoFile) {
      uploadedPhotoUrl =
        await uploadPhoto(
          user.id
        )

      if (!uploadedPhotoUrl) {
        setLoading(false)
        return
      }
    }

    const profilePayload: {
      id: string
      first_name: string
      last_name: string
      major: string
      academic_year: string
      profile_photo_url?: string
    } = {
      id:
        user.id,
      first_name:
        firstName.trim(),
      last_name:
        lastName.trim(),
      major:
        major.trim(),
      academic_year:
        year,
    }

    if (uploadedPhotoUrl) {
      profilePayload.profile_photo_url =
        uploadedPhotoUrl
    }

    const {
      error:
        profileError,
    } =
      await supabase
        .from('profiles')
        .upsert(
          profilePayload
        )

    if (profileError) {
      setError(
        profileError.message
      )
      setLoading(false)
      return
    }

    setLoading(false)
    setCurrentStep(2)
  }

  async function saveCareerAndContinue() {
    if (loading) {
      return
    }

    setLoading(true)
    setError('')

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

    const {
      error:
        profileError,
    } =
      await supabase
        .from('profiles')
        .update({
          career_goal:
            careerGoal.trim() ||
            null,
          bio:
            bio.trim() ||
            null,
        })
        .eq(
          'id',
          user.id
        )

    if (profileError) {
      setError(
        profileError.message
      )
      setLoading(false)
      return
    }

    setLoading(false)

    router.push(
      '/onboarding/interests'
    )
  }

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your onboarding...
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
              router.push('/')
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
            Step {currentStep} of{' '}
            {
              onboardingSteps.length
            }
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
                    {
                      step.number
                    }
                  </div>

                  <p
                    className={`mt-1 truncate text-[10px] font-medium ${
                      step.number ===
                      currentStep
                        ? 'text-black'
                        : 'text-gray-400'
                    }`}
                  >
                    {
                      step.shortTitle
                    }
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* STEP INTRO */}

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Welcome to BrewLink
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {currentStep === 1
              ? 'Let\'s build your profile'
              : 'Career & about'}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            {currentStep === 1
              ? 'Start with your identity and academic information. If you return later, BrewLink will preload what you already saved.'
              : 'Add a primary career direction and a short bio. Both are optional and can be changed later.'}
          </p>

        </section>

        {/* IMPORTANT INFO */}

        <section className="mb-5 rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
              ✨
            </div>

            <div>

              <p className="text-sm font-semibold">
                {currentStep === 1
                  ? 'Keep onboarding flexible'
                  : 'This step is optional'}
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {currentStep === 1
                  ? 'Only your name, major, and academic year are required. Your profile photo is optional and everything else later can be skipped.'
                  : 'You can add a career goal and bio now, or skip this step and complete them later from your Profile page.'}
              </p>

            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* STEP 1 FORM */}

        {currentStep === 1 && (

        <form
          onSubmit={
            handleSubmit
          }
          className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-sm"
        >

          {/* FORM HEADER */}

          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Step 1
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Basic identity & academic info
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              These fields create the foundation
              of your BrewLink profile.
            </p>

          </div>

          <div className="space-y-7 p-6 sm:p-8">

            {/* PHOTO */}

            <div>

              <label className="text-sm font-semibold">
                Profile photo
              </label>

              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                Optional. Add a photo now or skip it
                and upload one later from your Profile page.
              </p>

              <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row">

                <div className="relative">

                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-sm">

                    {photoPreview ? (

                      <img
                        src={
                          photoPreview
                        }
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <span className="text-3xl">
                        👤
                      </span>

                    )}

                  </div>

                  <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105">

                    <span className="text-xs">
                      📷
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handlePhotoChange
                      }
                      className="hidden"
                    />

                  </label>

                </div>

                <div className="text-center sm:text-left">

                  <p className="text-sm font-semibold text-gray-800">
                    {displayName}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    JPG, PNG, or WebP • maximum 5MB
                  </p>

                  {photoFile && (
                    <p className="mt-2 text-xs font-semibold text-amber-600">
                      New photo selected — it will save when you continue.
                    </p>
                  )}

                </div>

              </div>

            </div>

            {/* NAME */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="text-sm font-semibold">
                  First name{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    firstName
                  }
                  onChange={(
                    event
                  ) => {
                    setFirstName(
                      event.target.value
                    )
                    setError('')
                  }}
                  placeholder="First name"
                  maxLength={50}
                  autoComplete="given-name"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Last name{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    lastName
                  }
                  onChange={(
                    event
                  ) => {
                    setLastName(
                      event.target.value
                    )
                    setError('')
                  }}
                  placeholder="Last name"
                  maxLength={50}
                  autoComplete="family-name"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

              </div>

            </div>

            {/* MAJOR */}

            <div>

              <label className="text-sm font-semibold">
                Major{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={major}
                onChange={(
                  event
                ) => {
                  setMajor(
                    event.target.value
                  )
                  setError('')
                }}
                placeholder="e.g. Economics, Computer Science, Cognitive Science..."
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />

              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Type your actual major. You are
                not limited to a preset list.
              </p>

            </div>

            {/* YEAR */}

            <div>

              <label className="text-sm font-semibold">
                Academic year{' '}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                value={year}
                onChange={(
                  event
                ) => {
                  setYear(
                    event.target.value
                  )
                  setError('')
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >

                <option value="">
                  Select your year
                </option>

                <option value="Freshman">
                  Freshman
                </option>

                <option value="Sophomore">
                  Sophomore
                </option>

                <option value="Junior">
                  Junior
                </option>

                <option value="Senior">
                  Senior
                </option>

                <option value="Graduate">
                  Graduate
                </option>

              </select>

            </div>

            {/* COMPLETION */}

            <div className="rounded-2xl bg-gray-50 p-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-gray-700">
                    Required information
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Complete all four required fields
                    to continue.
                  </p>

                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    requiredComplete
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-500'
                  }`}
                >
                  {
                    [
                      firstName.trim(),
                      lastName.trim(),
                      major.trim(),
                      year,
                    ].filter(
                      Boolean
                    ).length
                  }
                  /4
                </span>

              </div>

            </div>

            {/* NEXT */}

            <button
              type="submit"
              disabled={
                loading ||
                uploadingPhoto
              }
              className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ||
              uploadingPhoto
                ? 'Saving...'
                : 'Save & Continue'}
            </button>

            <p className="text-center text-xs leading-relaxed text-gray-400">
              Your progress is saved to your
              BrewLink profile as you continue.
            </p>

          </div>

        </form>

        )}

        {/* STEP 2: CAREER & ABOUT */}

        {currentStep === 2 && (

          <section className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-6 sm:px-8">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Step 2
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Career & about
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Give BrewLink a little more context about what you&apos;re aiming for and what you&apos;re interested in.
              </p>

            </div>

            <div className="space-y-6 p-6 sm:p-8">

              <div>

                <label className="text-sm font-semibold">
                  Primary career goal
                </label>

                <input
                  type="text"
                  value={careerGoal}
                  onChange={(event) => {
                    setCareerGoal(
                      event.target.value
                    )
                    setError('')
                  }}
                  placeholder="e.g. Product Management"
                  maxLength={100}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  Optional. This should be your main direction, not every career you might be interested in.
                </p>

              </div>

              <div>

                <div className="flex items-center justify-between gap-3">

                  <label className="text-sm font-semibold">
                    About you
                  </label>

                  <span className={`text-xs ${
                    bio.length >= 280
                      ? 'font-semibold text-amber-600'
                      : 'text-gray-400'
                  }`}>
                    {bio.length}/300
                  </span>

                </div>

                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  Optional. Mention what you&apos;re studying, building, exploring, or the kinds of people you&apos;d like to meet.
                </p>

                <textarea
                  value={bio}
                  onChange={(event) => {
                    if (
                      event.target.value.length <= 300
                    ) {
                      setBio(
                        event.target.value
                      )
                    }
                    setError('')
                  }}
                  rows={6}
                  placeholder="Tell other students a little about yourself..."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

              </div>

              <div className="rounded-2xl bg-gray-50 p-4">

                <p className="text-sm font-semibold text-gray-700">
                  Profile preview
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {careerGoal.trim()
                    ? careerGoal.trim()
                    : 'No career goal added yet'}
                </p>

                {bio.trim() && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {bio.trim()}
                  </p>
                )}

              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep(1)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={
                    saveCareerAndContinue
                  }
                  disabled={loading}
                  className="w-full flex-1 rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Saving...'
                    : 'Save & Continue'}
                </button>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/onboarding/interests'
                  )
                }
                disabled={loading}
                className="w-full text-center text-sm font-semibold text-gray-400 transition hover:text-black disabled:opacity-50"
              >
                Skip for now
              </button>

            </div>

          </section>

        )}

        {/* UPCOMING */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Coming next
          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            {onboardingSteps
              .slice(
                currentStep
              )
              .map(
                (step) => (

                  <span
                    key={
                      step.number
                    }
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500"
                  >
                    {step.number}.{' '}
                    {
                      step.title
                    }
                  </span>

                )
              )}

          </div>

        </section>

      </div>

    </main>
  )
}