'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  major: string | null
  academic_year: string | null
  bio: string | null
  career_goal: string | null
  profile_photo_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [major, setMajor] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [bio, setBio] = useState('')

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          major,
          academic_year,
          bio,
          career_goal,
          profile_photo_url
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError(`Could not load profile: ${profileError.message}`)
        setLoading(false)
        return
      }

      setProfile(data)

      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setMajor(data.major || '')
      setAcademicYear(data.academic_year || '')
      setCareerGoal(data.career_goal || '')
      setBio(data.bio || '')

      if (data.profile_photo_url) {
        setPhotoPreview(data.profile_photo_url)
      } else {
        setPhotoPreview(null)
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photos must be smaller than 5MB.')
      return
    }

    setPhotoFile(file)

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
  }

  async function uploadPhoto() {
    if (!photoFile) {
      return null
    }

    setUploadingPhoto(true)
    setError('')

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in.')
      setUploadingPhoto(false)
      router.push('/login')
      return null
    }

    const fileExtension =
      photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'

    /*
     * Keep the storage path stable.
     * We will add a cache-busting query parameter
     * to the URL stored in the profiles table.
     */
    const filePath = `${user.id}/profile.${fileExtension}`

    /*
     * Remove old versions of the profile photo.
     */
    const { error: removeError } = await supabase.storage
      .from('profile-photos')
      .remove([
        `${user.id}/profile.jpg`,
        `${user.id}/profile.jpeg`,
        `${user.id}/profile.png`,
        `${user.id}/profile.webp`,
      ])

    if (removeError) {
      console.log(
        'Could not remove previous photo:',
        removeError.message
      )
    }

    /*
     * Upload the new photo.
     */
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, photoFile, {
        upsert: true,
        contentType: photoFile.type,
        cacheControl: '0',
      })

    if (uploadError) {
      setError(`Could not upload photo: ${uploadError.message}`)
      setUploadingPhoto(false)
      return null
    }

    /*
     * Get the public URL.
     */
    const { data: publicUrlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    /*
     * IMPORTANT:
     * Add a unique timestamp to the URL.
     *
     * This prevents the browser from displaying
     * an older cached version of the image.
     */
    const photoUrl =
      `${publicUrlData.publicUrl}?v=${Date.now()}`

    /*
     * Save the NEW cache-busted URL in the profiles table.
     */
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_photo_url: photoUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(
        `Photo uploaded, but profile could not be updated: ${updateError.message}`
      )
      setUploadingPhoto(false)
      return null
    }

    /*
     * Update local state immediately.
     */
    setProfile((current) =>
      current
        ? {
            ...current,
            profile_photo_url: photoUrl,
          }
        : current
    )

    setPhotoPreview(photoUrl)
    setPhotoFile(null)

    setUploadingPhoto(false)

    return photoUrl
  }

  async function saveProfile() {
    if (saving || uploadingPhoto) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be logged in.')
      setSaving(false)
      router.push('/login')
      return
    }

    /*
     * Upload photo first if a new photo was selected.
     */
    if (photoFile) {
      const uploadedPhotoUrl = await uploadPhoto()

      if (!uploadedPhotoUrl) {
        setSaving(false)
        return
      }
    }

    /*
     * Save all profile information.
     *
     * IMPORTANT:
     * We do NOT update profile_photo_url here.
     * uploadPhoto() already saved it.
     */
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        major: major.trim() || null,
        academic_year: academicYear.trim() || null,
        career_goal: careerGoal.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', user.id)
      .select(`
        id,
        first_name,
        last_name,
        major,
        academic_year,
        bio,
        career_goal,
        profile_photo_url
      `)
      .single()

    if (updateError) {
      setError(`Could not save profile: ${updateError.message}`)
      setSaving(false)
      return
    }

    setProfile(data)

    /*
     * Make sure the displayed photo uses the URL
     * returned from the database.
     */
    if (data.profile_photo_url) {
      setPhotoPreview(data.profile_photo_url)
    }

    setSuccess('Profile saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl">☕</div>

          <p className="mt-3 text-sm text-gray-500">
            Loading your profile...
          </p>
        </div>
      </main>
    )
  }

  const displayName =
    `${firstName} ${lastName}`.trim() || 'Your Name'

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xl font-bold tracking-tight"
          >
            BrewLink
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Done
          </button>

        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* Title */}
        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Your Profile
          </h1>

          <p className="mt-3 max-w-xl text-gray-500">
            Make a great first impression. Your profile helps
            other students find people they&apos;ll actually
            want to meet.
          </p>

        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Profile Card */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-sm">

          {/* Profile hero */}
          <div className="bg-gradient-to-b from-gray-50 to-white px-6 py-8 sm:px-8">

            <div className="flex flex-col items-center gap-6 sm:flex-row">

              {/* Photo */}
              <div className="relative">

                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">
                      👤
                    </span>
                  )}

                </div>

                {/* Camera button */}
                <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105">

                  <span className="text-sm">
                    📷
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                </label>

              </div>

              {/* Name */}
              <div className="text-center sm:text-left">

                <h2 className="text-2xl font-bold">
                  {displayName}
                </h2>

                <p className="mt-1 text-gray-500">
                  {major || 'Major not listed'}
                  {academicYear
                    ? ` • ${academicYear}`
                    : ''}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  Click the camera to change your photo
                </p>

              </div>

            </div>

          </div>

          {/* Form */}
          <div className="border-t border-gray-100 p-6 sm:p-8">

            <div className="mb-7">

              <h3 className="text-lg font-bold">
                Personal information
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Tell other students a little about yourself.
              </p>

            </div>

            <div className="space-y-6">

              {/* Names */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold">
                    First name
                  </label>

                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="First name"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Last name
                  </label>

                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    placeholder="Last name"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>

              </div>

              {/* Major + Year */}
              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold">
                    Major
                  </label>

                  <input
                    type="text"
                    value={major}
                    onChange={(e) =>
                      setMajor(e.target.value)
                    }
                    placeholder="e.g. Economics"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Academic year
                  </label>

                  <select
                    value={academicYear}
                    onChange={(e) =>
                      setAcademicYear(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  >
                    <option value="">
                      Select year
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

              </div>

              {/* Career */}
              <div>

                <label className="text-sm font-semibold">
                  Career interest
                </label>

                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) =>
                    setCareerGoal(e.target.value)
                  }
                  placeholder="e.g. Investment Banking"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  This helps BrewLink suggest relevant connections.
                </p>

              </div>

              {/* Bio */}
              <div>

                <div className="flex items-center justify-between">

                  <label className="text-sm font-semibold">
                    About you
                  </label>

                  <span className="text-xs text-gray-400">
                    {bio.length}/300
                  </span>

                </div>

                <textarea
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setBio(e.target.value)
                    }
                  }}
                  rows={5}
                  placeholder="Tell other students a little about yourself..."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

              </div>

              {/* Save */}
              <div className="pt-2">

                <button
                  onClick={saveProfile}
                  disabled={saving || uploadingPhoto}
                  className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving || uploadingPhoto
                    ? 'Saving changes...'
                    : 'Save Changes'}
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* Photo information */}
        <div className="mt-5 text-center">

          <p className="text-xs text-gray-400">
            Profile photos must be JPG, PNG, or WebP and under
            5MB.
          </p>

        </div>

      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-2xl justify-around px-6 py-4">

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Home
          </button>

          <button
            onClick={() => router.push('/connections')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Connections
          </button>

          <button
            onClick={() => router.push('/chats')}
            className="text-sm text-gray-500 transition hover:text-black"
          >
            Chats
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="text-sm font-semibold"
          >
            Profile
          </button>

        </div>

      </nav>

    </main>
  )
}