'use client'

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  major: string | null
  academic_year: string | null
  bio: string | null
  career_goal: string | null
  profile_photo_url: string | null
  is_discoverable: boolean
  show_academic_info: boolean
  show_career_goal: boolean
  linkedin_url: string | null
  instagram_username: string | null
  snapchat_username: string | null
  youtube_url: string | null
  portfolio_url: string | null
  contact_email: string | null
  resume_url: string | null
  contact_visibility: string
}

type ProfileLink = {
  id?: number
  label: string
  url: string
  sort_order: number
}

type Interest = {
  id: number
  name: string
  category: string | null
}

type Club = {
  id: number
  name: string
  description: string | null
}

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

type Project = {
  id: number
  user_id: string
  title: string
  description: string | null
}

type MatchPreferences = {
  user_id: string
  same_major: boolean
  similar_career_interests: boolean
  outside_major: boolean
  upperclassmen: boolean
  mentors: boolean
  project_collaborators: boolean
  frequency: string
  match_style: string
}

type AvailabilitySlot = {
  id: number
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [firstName, setFirstName] =
    useState('')

  const [lastName, setLastName] =
    useState('')

  const [major, setMajor] =
    useState('')

  const [academicYear, setAcademicYear] =
    useState('')

  const [careerGoal, setCareerGoal] =
    useState('')

  const [bio, setBio] =
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

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [
    savedBasicProfile,
    setSavedBasicProfile,
  ] =
    useState({
      firstName: '',
      lastName: '',
      major: '',
      academicYear: '',
      careerGoal: '',
      bio: '',
      photoUrl: '',
    })

  const [currentUserId, setCurrentUserId] =
    useState('')

  const [allInterests, setAllInterests] =
    useState<Interest[]>([])

  const [
    selectedInterests,
    setSelectedInterests,
  ] =
    useState<Interest[]>([])

  const [interestQuery, setInterestQuery] =
    useState('')

  const [
    loadingInterests,
    setLoadingInterests,
  ] =
    useState(true)

  const [
    interestActionId,
    setInterestActionId,
  ] =
    useState<number | null>(null)

  const [
    creatingInterest,
    setCreatingInterest,
  ] =
    useState(false)

  const [
    interestMessage,
    setInterestMessage,
  ] =
    useState('')

  const [allClubs, setAllClubs] =
    useState<Club[]>([])

  const [
    selectedClubs,
    setSelectedClubs,
  ] =
    useState<Club[]>([])

  const [clubQuery, setClubQuery] =
    useState('')

  const [
    loadingClubs,
    setLoadingClubs,
  ] =
    useState(true)

  const [
    clubActionId,
    setClubActionId,
  ] =
    useState<number | null>(null)

  const [
    creatingClub,
    setCreatingClub,
  ] =
    useState(false)

  const [
    clubMessage,
    setClubMessage,
  ] =
    useState('')

  const [
    workExperiences,
    setWorkExperiences,
  ] =
    useState<WorkExperience[]>([])

  const [
    loadingWorkExperience,
    setLoadingWorkExperience,
  ] =
    useState(true)

  const [
    workEditorOpen,
    setWorkEditorOpen,
  ] =
    useState(false)

  const [
    editingWorkId,
    setEditingWorkId,
  ] =
    useState<number | null>(null)

  const [
    workCompanyName,
    setWorkCompanyName,
  ] =
    useState('')

  const [
    workRoleTitle,
    setWorkRoleTitle,
  ] =
    useState('')

  const [
    workIndustry,
    setWorkIndustry,
  ] =
    useState('')

  const [
    workDescription,
    setWorkDescription,
  ] =
    useState('')

  const [
    workStartDate,
    setWorkStartDate,
  ] =
    useState('')

  const [
    workEndDate,
    setWorkEndDate,
  ] =
    useState('')

  const [
    workIsCurrent,
    setWorkIsCurrent,
  ] =
    useState(false)

  const [
    savingWorkExperience,
    setSavingWorkExperience,
  ] =
    useState(false)

  const [
    deletingWorkId,
    setDeletingWorkId,
  ] =
    useState<number | null>(null)

  const [
    workMessage,
    setWorkMessage,
  ] =
    useState('')

  const [
    projects,
    setProjects,
  ] =
    useState<Project[]>([])

  const [
    loadingProjects,
    setLoadingProjects,
  ] =
    useState(true)

  const [
    projectEditorOpen,
    setProjectEditorOpen,
  ] =
    useState(false)

  const [
    editingProjectId,
    setEditingProjectId,
  ] =
    useState<number | null>(null)

  const [
    projectTitle,
    setProjectTitle,
  ] =
    useState('')

  const [
    projectDescription,
    setProjectDescription,
  ] =
    useState('')

  const [
    savingProject,
    setSavingProject,
  ] =
    useState(false)

  const [
    deletingProjectId,
    setDeletingProjectId,
  ] =
    useState<number | null>(null)

  const [
    projectMessage,
    setProjectMessage,
  ] =
    useState('')

  const [
    matchPreferences,
    setMatchPreferences,
  ] =
    useState<MatchPreferences>({
      user_id: '',
      same_major: false,
      similar_career_interests: false,
      outside_major: false,
      upperclassmen: false,
      mentors: false,
      project_collaborators: false,
      frequency: 'weekly',
      match_style: 'balanced',
    })

  const [
    loadingPreferences,
    setLoadingPreferences,
  ] =
    useState(true)

  const [
    savingPreferences,
    setSavingPreferences,
  ] =
    useState(false)

  const [
    preferencesMessage,
    setPreferencesMessage,
  ] =
    useState('')

  const [
    availabilitySlots,
    setAvailabilitySlots,
  ] =
    useState<AvailabilitySlot[]>([])

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] =
    useState(true)

  const [
    availabilityEditorOpen,
    setAvailabilityEditorOpen,
  ] =
    useState(false)

  const [
    editingAvailabilityId,
    setEditingAvailabilityId,
  ] =
    useState<number | null>(null)

  const [
    availabilityDay,
    setAvailabilityDay,
  ] =
    useState(1)

  const [
    availabilityStartTime,
    setAvailabilityStartTime,
  ] =
    useState('')

  const [
    availabilityEndTime,
    setAvailabilityEndTime,
  ] =
    useState('')

  const [
    savingAvailability,
    setSavingAvailability,
  ] =
    useState(false)

  const [
    deletingAvailabilityId,
    setDeletingAvailabilityId,
  ] =
    useState<number | null>(null)

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] =
    useState('')

  // ============================================
  // LINKS & RESUME
  // ============================================

  const [
    profileLinks,
    setProfileLinks,
  ] =
    useState<ProfileLink[]>([])

  const [contactEmail, setContactEmail] =
    useState('')

  const [
    contactVisibility,
    setContactVisibility,
  ] =
    useState('connections')

  const [resumePath, setResumePath] =
    useState('')

  const [resumeFile, setResumeFile] =
    useState<File | null>(null)

  const [
    savingLinks,
    setSavingLinks,
  ] =
    useState(false)

  const [
    uploadingResume,
    setUploadingResume,
  ] =
    useState(false)

  const [
    removingResume,
    setRemovingResume,
  ] =
    useState(false)

  const [
    linksMessage,
    setLinksMessage,
  ] =
    useState('')

  const [
    isDiscoverable,
    setIsDiscoverable,
  ] =
    useState(true)

  const [
    showAcademicInfo,
    setShowAcademicInfo,
  ] =
    useState(true)

  const [
    showCareerGoal,
    setShowCareerGoal,
  ] =
    useState(true)

  const [
    savingPrivacy,
    setSavingPrivacy,
  ] =
    useState(false)

  const [
    privacyMessage,
    setPrivacyMessage,
  ] =
    useState('')

  const [
    profilePreviewOpen,
    setProfilePreviewOpen,
  ] =
    useState(false)

  // ============================================
  // LOAD PROFILE
  // ============================================

  useEffect(() => {
    async function loadProfile() {
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
        router.push('/login')
        return
      }

      setCurrentUserId(
        user.id
      )

      const {
        data,
        error:
          profileError,
      } =
        await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            major,
            academic_year,
            bio,
            career_goal,
            profile_photo_url,
            is_discoverable,
            show_academic_info,
            show_career_goal,
            linkedin_url,
            instagram_username,
            snapchat_username,
            youtube_url,
            portfolio_url,
            contact_email,
            resume_url,
            contact_visibility
          `)
          .eq(
            'id',
            user.id
          )
          .single()

      if (profileError) {
        setError(
          `Could not load profile: ${profileError.message}`
        )

        setLoading(false)
        return
      }

      setProfile(data)

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

      setAcademicYear(
        data.academic_year ||
        ''
      )

      setCareerGoal(
        data.career_goal ||
        ''
      )

      setBio(
        data.bio ||
        ''
      )

      setIsDiscoverable(
        data.is_discoverable ??
        true
      )

      setShowAcademicInfo(
        data.show_academic_info ??
        true
      )

      setShowCareerGoal(
        data.show_career_goal ??
        true
      )

      setContactEmail(
        data.contact_email ||
        ''
      )

      setResumePath(
        data.resume_url ||
        ''
      )

      setContactVisibility(
        data.contact_visibility ||
        'connections'
      )

      const {
        data: profileLinkData,
        error: profileLinksError,
      } =
        await supabase
          .from('profile_links')
          .select(`
            id,
            label,
            url,
            sort_order
          `)
          .eq(
            'user_id',
            user.id
          )
          .order(
            'sort_order',
            {
              ascending: true,
            }
          )
          .order(
            'id',
            {
              ascending: true,
            }
          )

      if (profileLinksError) {
        setError(
          `Could not load profile links: ${profileLinksError.message}`
        )

        setLoading(false)
        return
      }

      setProfileLinks(
        (profileLinkData || []) as ProfileLink[]
      )

      if (
        data.profile_photo_url
      ) {
        setPhotoPreview(
          data.profile_photo_url
        )
      } else {
        setPhotoPreview(
          null
        )
      }

      setSavedBasicProfile({
        firstName:
          data.first_name || '',
        lastName:
          data.last_name || '',
        major:
          data.major || '',
        academicYear:
          data.academic_year || '',
        careerGoal:
          data.career_goal || '',
        bio:
          data.bio || '',
        photoUrl:
          data.profile_photo_url || '',
      })

      // ========================================
      // LOAD INTERESTS
      // ========================================

      const {
        data: interestData,
        error: interestError,
      } =
        await supabase
          .from('interests')
          .select(`
            id,
            name,
            category
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (interestError) {
        setError(
          `Could not load interests: ${interestError.message}`
        )
        setLoadingInterests(false)
        setLoading(false)
        return
      }

      const {
        data: selectedRows,
        error: selectedError,
      } =
        await supabase
          .from(
            'user_interests'
          )
          .select(`
            interest_id
          `)
          .eq(
            'user_id',
            user.id
          )

      if (selectedError) {
        setError(
          `Could not load your interests: ${selectedError.message}`
        )
        setLoadingInterests(false)
        setLoading(false)
        return
      }

      const loadedInterests =
        (interestData ||
          []) as Interest[]

      const selectedIds =
        new Set(
          (
            selectedRows ||
            []
          ).map(
            (row) =>
              row.interest_id
          )
        )

      setAllInterests(
        loadedInterests
      )

      setSelectedInterests(
        loadedInterests.filter(
          (interest) =>
            selectedIds.has(
              interest.id
            )
        )
      )

      setLoadingInterests(false)

      // ========================================
      // LOAD CLUBS
      // ========================================

      const {
        data: clubData,
        error: clubError,
      } =
        await supabase
          .from('clubs')
          .select(`
            id,
            name,
            description
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (clubError) {
        setError(
          `Could not load clubs: ${clubError.message}`
        )
        setLoadingClubs(false)
        setLoading(false)
        return
      }

      const {
        data: selectedClubRows,
        error: selectedClubError,
      } =
        await supabase
          .from('user_clubs')
          .select(`
            club_id
          `)
          .eq(
            'user_id',
            user.id
          )

      if (selectedClubError) {
        setError(
          `Could not load your clubs: ${selectedClubError.message}`
        )
        setLoadingClubs(false)
        setLoading(false)
        return
      }

      const loadedClubs =
        (clubData ||
          []) as Club[]

      const selectedClubIds =
        new Set(
          (
            selectedClubRows ||
            []
          ).map(
            (row) =>
              row.club_id
          )
        )

      setAllClubs(
        loadedClubs
      )

      setSelectedClubs(
        loadedClubs.filter(
          (club) =>
            selectedClubIds.has(
              club.id
            )
        )
      )

      setLoadingClubs(false)

      // ========================================
      // LOAD WORK EXPERIENCE
      // ========================================

      const {
        data: workData,
        error: workError,
      } =
        await supabase
          .from('work_experience')
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
        setLoadingWorkExperience(false)
        setLoading(false)
        return
      }

      setWorkExperiences(
        (workData ||
          []) as WorkExperience[]
      )

      setLoadingWorkExperience(false)

      // ========================================
      // LOAD PROJECTS
      // ========================================

      const {
        data: projectData,
        error: projectError,
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
        setLoadingProjects(false)
        setLoading(false)
        return
      }

      setProjects(
        (projectData ||
          []) as Project[]
      )

      setLoadingProjects(false)

      // ========================================
      // LOAD MATCH PREFERENCES
      // ========================================

      const {
        data: preferencesData,
        error: preferencesError,
      } =
        await supabase
          .from(
            'match_preferences'
          )
          .select(`
            user_id,
            same_major,
            similar_career_interests,
            outside_major,
            upperclassmen,
            mentors,
            project_collaborators,
            frequency,
            match_style
          `)
          .eq(
            'user_id',
            user.id
          )
          .maybeSingle()

      if (preferencesError) {
        setError(
          `Could not load matching preferences: ${preferencesError.message}`
        )
        setLoadingPreferences(false)
        setLoading(false)
        return
      }

      setMatchPreferences({
        user_id:
          user.id,
        same_major:
          preferencesData?.same_major ??
          false,
        similar_career_interests:
          preferencesData?.similar_career_interests ??
          false,
        outside_major:
          preferencesData?.outside_major ??
          false,
        upperclassmen:
          preferencesData?.upperclassmen ??
          false,
        mentors:
          preferencesData?.mentors ??
          false,
        project_collaborators:
          preferencesData?.project_collaborators ??
          false,
        frequency:
          preferencesData?.frequency ||
          'weekly',
        match_style:
          preferencesData?.match_style ||
          'balanced',
      })

      setLoadingPreferences(false)

      // ========================================
      // LOAD AVAILABILITY
      // ========================================

      const {
        data: availabilityData,
        error: availabilityError,
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
        setLoadingAvailability(false)
        setLoading(false)
        return
      }

      setAvailabilitySlots(
        (availabilityData ||
          []) as AvailabilitySlot[]
      )

      setLoadingAvailability(false)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  // ============================================
  // LOGOUT
  // ============================================

  async function handleLogout() {
    const supabase =
      createClient()

    const {
      error:
        logoutError,
    } =
      await supabase.auth.signOut()

    if (logoutError) {
      setError(
        `Could not log out: ${logoutError.message}`
      )

      return
    }

    router.push('/login')
  }

  // ============================================
  // PHOTO SELECT
  // ============================================

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
    setSuccess('')

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

  // ============================================
  // UPLOAD PHOTO
  // ============================================

  async function uploadPhoto() {
    if (!photoFile) {
      return null
    }

    setUploadingPhoto(true)
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
        'You must be logged in.'
      )

      setUploadingPhoto(
        false
      )

      router.push('/login')

      return null
    }

    const fileExtension =
      photoFile.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

    const filePath =
      `${user.id}/profile.${fileExtension}`

    const {
      error:
        removeError,
    } =
      await supabase.storage
        .from(
          'profile-photos'
        )
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

      setUploadingPhoto(
        false
      )

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

    const {
      error:
        updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          profile_photo_url:
            photoUrl,
        })
        .eq(
          'id',
          user.id
        )

    if (updateError) {
      setError(
        `Photo uploaded, but profile could not be updated: ${updateError.message}`
      )

      setUploadingPhoto(
        false
      )

      return null
    }

    setProfile(
      (current) =>
        current
          ? {
              ...current,
              profile_photo_url:
                photoUrl,
            }
          : current
    )

    setPhotoPreview(
      photoUrl
    )

    setPhotoFile(null)

    setUploadingPhoto(
      false
    )

    return photoUrl
  }

  // ============================================
  // SAVE BASIC PROFILE
  // ============================================

  async function saveProfile() {
    if (
      saving ||
      uploadingPhoto
    ) {
      return
    }

    setError('')
    setSuccess('')

    const trimmedFirstName =
      firstName.trim()

    const trimmedLastName =
      lastName.trim()

    const trimmedMajor =
      major.trim()

    if (!trimmedFirstName) {
      setError(
        'First name is required.'
      )
      return
    }

    if (!trimmedLastName) {
      setError(
        'Last name is required.'
      )
      return
    }

    if (!trimmedMajor) {
      setError(
        'Major is required.'
      )
      return
    }

    if (!academicYear) {
      setError(
        'Academic year is required.'
      )
      return
    }

    setSaving(true)

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
        'You must be logged in.'
      )

      setSaving(false)

      router.push('/login')

      return
    }

    if (photoFile) {
      const uploadedPhotoUrl =
        await uploadPhoto()

      if (
        !uploadedPhotoUrl
      ) {
        setSaving(false)
        return
      }
    }

    const {
      data,
      error:
        updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          first_name:
            trimmedFirstName,
          last_name:
            trimmedLastName,
          major:
            trimmedMajor,
          academic_year:
            academicYear.trim() ||
            null,
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
        .select(`
          id,
          first_name,
          last_name,
          major,
          academic_year,
          bio,
          career_goal,
          profile_photo_url,
          is_discoverable,
          show_academic_info,
          show_career_goal,
          linkedin_url,
          instagram_username,
          snapchat_username,
          youtube_url,
          portfolio_url,
          contact_email,
          resume_url,
          contact_visibility
        `)
        .single()

    if (updateError) {
      setError(
        `Could not save profile: ${updateError.message}`
      )

      setSaving(false)
      return
    }

    setProfile(data)

    if (
      data.profile_photo_url
    ) {
      setPhotoPreview(
        data.profile_photo_url
      )
    }

    setSavedBasicProfile({
      firstName:
        data.first_name || '',
      lastName:
        data.last_name || '',
      major:
        data.major || '',
      academicYear:
        data.academic_year || '',
      careerGoal:
        data.career_goal || '',
      bio:
        data.bio || '',
      photoUrl:
        data.profile_photo_url || '',
    })

    setSuccess(
      'Profile saved successfully.'
    )

    setSaving(false)
  }

  // ============================================
  // INTEREST HELPERS
  // ============================================

  function normalizeInterest(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  }

  function interestMatchesQuery(
    interest: Interest,
    queryValue: string
  ) {
    const query =
      normalizeInterest(
        queryValue
      )

    if (!query) {
      return true
    }

    const name =
      normalizeInterest(
        interest.name
      )

    const category =
      normalizeInterest(
        interest.category ||
          ''
      )

    if (
      name.includes(query) ||
      category.includes(query)
    ) {
      return true
    }

    const queryWords =
      query.split(' ')

    const targetWords =
      `${name} ${category}`
        .split(' ')
        .filter(Boolean)

    return queryWords.every(
      (queryWord) =>
        targetWords.some(
          (targetWord) =>
            targetWord.startsWith(
              queryWord
            ) ||
            (
              queryWord.length >= 4 &&
              targetWord.includes(
                queryWord
              )
            )
        )
    )
  }

  const filteredInterests =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedInterests.map(
            (interest) =>
              interest.id
          )
        )

      return allInterests
        .filter(
          (interest) =>
            !selectedIds.has(
              interest.id
            )
        )
        .filter(
          (interest) =>
            interestMatchesQuery(
              interest,
              interestQuery
            )
        )
        .slice(0, 12)
    }, [
      allInterests,
      selectedInterests,
      interestQuery,
    ])

  const normalizedInterestQuery =
    normalizeInterest(
      interestQuery
    )

  const exactInterestExists =
    allInterests.some(
      (interest) =>
        normalizeInterest(
          interest.name
        ) ===
        normalizedInterestQuery
    )

  async function addInterest(
    interest: Interest
  ) {
    if (
      !currentUserId ||
      interestActionId !==
        null ||
      creatingInterest
    ) {
      return
    }

    setError('')
    setInterestMessage('')
    setInterestActionId(
      interest.id
    )

    const supabase =
      createClient()

    const {
      error:
        insertError,
    } =
      await supabase
        .from(
          'user_interests'
        )
        .insert({
          user_id:
            currentUserId,
          interest_id:
            interest.id,
        })

    if (insertError) {
      setError(
        `Could not add interest: ${insertError.message}`
      )
      setInterestActionId(
        null
      )
      return
    }

    setSelectedInterests(
      (current) =>
        [...current, interest]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setInterestQuery('')
    setInterestMessage(
      `${interest.name} added.`
    )
    setInterestActionId(null)
  }

  async function removeInterest(
    interest: Interest
  ) {
    if (
      !currentUserId ||
      interestActionId !==
        null ||
      creatingInterest
    ) {
      return
    }

    setError('')
    setInterestMessage('')
    setInterestActionId(
      interest.id
    )

    const supabase =
      createClient()

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          'user_interests'
        )
        .delete()
        .eq(
          'user_id',
          currentUserId
        )
        .eq(
          'interest_id',
          interest.id
        )

    if (deleteError) {
      setError(
        `Could not remove interest: ${deleteError.message}`
      )
      setInterestActionId(
        null
      )
      return
    }

    setSelectedInterests(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            interest.id
        )
    )

    setInterestMessage(
      `${interest.name} removed.`
    )
    setInterestActionId(null)
  }

  async function createCustomInterest() {
    const cleanedName =
      interestQuery
        .trim()
        .replace(/\s+/g, ' ')

    if (
      !cleanedName ||
      !currentUserId ||
      creatingInterest ||
      interestActionId !==
        null
    ) {
      return
    }

    setError('')
    setInterestMessage('')
    setCreatingInterest(true)

    const supabase =
      createClient()

    const existingInterest =
      allInterests.find(
        (interest) =>
          normalizeInterest(
            interest.name
          ) ===
          normalizeInterest(
            cleanedName
          )
      )

    if (existingInterest) {
      setCreatingInterest(false)
      await addInterest(
        existingInterest
      )
      return
    }

    const {
      data:
        createdInterest,
      error:
        createError,
    } =
      await supabase
        .from('interests')
        .insert({
          name:
            cleanedName,
          category:
            'Other',
        })
        .select(`
          id,
          name,
          category
        `)
        .single()

    if (createError) {
      // A matching interest may have been created
      // between the initial check and this insert.
      const {
        data:
          refreshedInterests,
        error:
          refreshError,
      } =
        await supabase
          .from('interests')
          .select(`
            id,
            name,
            category
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (
        refreshError
      ) {
        setError(
          `Could not create interest: ${createError.message}`
        )
        setCreatingInterest(
          false
        )
        return
      }

      const matchingInterest =
        (
          refreshedInterests ||
          []
        ).find(
          (interest) =>
            normalizeInterest(
              interest.name
            ) ===
            normalizeInterest(
              cleanedName
            )
        ) as
          | Interest
          | undefined

      if (!matchingInterest) {
        setError(
          `Could not create interest: ${createError.message}`
        )
        setCreatingInterest(
          false
        )
        return
      }

      setAllInterests(
        (
          refreshedInterests ||
          []
        ) as Interest[]
      )

      const {
        error:
          linkError,
      } =
        await supabase
          .from(
            'user_interests'
          )
          .insert({
            user_id:
              currentUserId,
            interest_id:
              matchingInterest.id,
          })

      if (linkError) {
        setError(
          `Interest exists, but could not be added to your profile: ${linkError.message}`
        )
        setCreatingInterest(
          false
        )
        return
      }

      setSelectedInterests(
        (current) =>
          [
            ...current,
            matchingInterest,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
      )

      setInterestQuery('')
      setInterestMessage(
        `${matchingInterest.name} added.`
      )
      setCreatingInterest(
        false
      )
      return
    }

    const newInterest =
      createdInterest as Interest

    setAllInterests(
      (current) =>
        [...current, newInterest]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    const {
      error:
        linkError,
    } =
      await supabase
        .from(
          'user_interests'
        )
        .insert({
          user_id:
            currentUserId,
          interest_id:
            newInterest.id,
        })

    if (linkError) {
      setError(
        `Interest was created, but could not be added to your profile: ${linkError.message}`
      )
      setCreatingInterest(
        false
      )
      return
    }

    setSelectedInterests(
      (current) =>
        [...current, newInterest]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setInterestQuery('')
    setInterestMessage(
      `${newInterest.name} created and added.`
    )
    setCreatingInterest(false)
  }

  // ============================================
  // CLUB HELPERS
  // ============================================

  function normalizeClub(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  }

  function clubMatchesQuery(
    club: Club,
    queryValue: string
  ) {
    const query =
      normalizeClub(
        queryValue
      )

    if (!query) {
      return true
    }

    const name =
      normalizeClub(
        club.name
      )

    const description =
      normalizeClub(
        club.description ||
          ''
      )

    if (
      name.includes(query) ||
      description.includes(query)
    ) {
      return true
    }

    const queryWords =
      query.split(' ')

    const targetWords =
      `${name} ${description}`
        .split(' ')
        .filter(Boolean)

    return queryWords.every(
      (queryWord) =>
        targetWords.some(
          (targetWord) =>
            targetWord.startsWith(
              queryWord
            ) ||
            (
              queryWord.length >= 4 &&
              targetWord.includes(
                queryWord
              )
            )
        )
    )
  }

  const filteredClubs =
    useMemo(() => {
      const selectedIds =
        new Set(
          selectedClubs.map(
            (club) =>
              club.id
          )
        )

      return allClubs
        .filter(
          (club) =>
            !selectedIds.has(
              club.id
            )
        )
        .filter(
          (club) =>
            clubMatchesQuery(
              club,
              clubQuery
            )
        )
        .slice(0, 12)
    }, [
      allClubs,
      selectedClubs,
      clubQuery,
    ])

  const normalizedClubQuery =
    normalizeClub(
      clubQuery
    )

  const exactClubExists =
    allClubs.some(
      (club) =>
        normalizeClub(
          club.name
        ) ===
        normalizedClubQuery
    )

  async function addClub(
    club: Club
  ) {
    if (
      !currentUserId ||
      clubActionId !== null ||
      creatingClub
    ) {
      return
    }

    setError('')
    setClubMessage('')
    setClubActionId(
      club.id
    )

    const supabase =
      createClient()

    const {
      error: insertError,
    } =
      await supabase
        .from('user_clubs')
        .insert({
          user_id:
            currentUserId,
          club_id:
            club.id,
        })

    if (insertError) {
      setError(
        `Could not add club: ${insertError.message}`
      )
      setClubActionId(null)
      return
    }

    setSelectedClubs(
      (current) =>
        [...current, club]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setClubQuery('')
    setClubMessage(
      `${club.name} added.`
    )
    setClubActionId(null)
  }

  async function removeClub(
    club: Club
  ) {
    if (
      !currentUserId ||
      clubActionId !== null ||
      creatingClub
    ) {
      return
    }

    setError('')
    setClubMessage('')
    setClubActionId(
      club.id
    )

    const supabase =
      createClient()

    const {
      error: deleteError,
    } =
      await supabase
        .from('user_clubs')
        .delete()
        .eq(
          'user_id',
          currentUserId
        )
        .eq(
          'club_id',
          club.id
        )

    if (deleteError) {
      setError(
        `Could not remove club: ${deleteError.message}`
      )
      setClubActionId(null)
      return
    }

    setSelectedClubs(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            club.id
        )
    )

    setClubMessage(
      `${club.name} removed.`
    )
    setClubActionId(null)
  }

  async function createCustomClub() {
    const cleanedName =
      clubQuery
        .trim()
        .replace(/\s+/g, ' ')

    if (
      !cleanedName ||
      !currentUserId ||
      creatingClub ||
      clubActionId !== null
    ) {
      return
    }

    setError('')
    setClubMessage('')
    setCreatingClub(true)

    const supabase =
      createClient()

    const existingClub =
      allClubs.find(
        (club) =>
          normalizeClub(
            club.name
          ) ===
          normalizeClub(
            cleanedName
          )
      )

    if (existingClub) {
      setCreatingClub(false)
      await addClub(
        existingClub
      )
      return
    }

    const {
      data: createdClub,
      error: createError,
    } =
      await supabase
        .from('clubs')
        .insert({
          name:
            cleanedName,
          description:
            null,
        })
        .select(`
          id,
          name,
          description
        `)
        .single()

    if (createError) {
      const {
        data: refreshedClubs,
        error: refreshError,
      } =
        await supabase
          .from('clubs')
          .select(`
            id,
            name,
            description
          `)
          .order(
            'name',
            {
              ascending: true,
            }
          )

      if (refreshError) {
        setError(
          `Could not create club: ${createError.message}`
        )
        setCreatingClub(false)
        return
      }

      const matchingClub =
        (
          refreshedClubs ||
          []
        ).find(
          (club) =>
            normalizeClub(
              club.name
            ) ===
            normalizeClub(
              cleanedName
            )
        ) as
          | Club
          | undefined

      if (!matchingClub) {
        setError(
          `Could not create club: ${createError.message}`
        )
        setCreatingClub(false)
        return
      }

      setAllClubs(
        (
          refreshedClubs ||
          []
        ) as Club[]
      )

      const {
        error: linkError,
      } =
        await supabase
          .from('user_clubs')
          .insert({
            user_id:
              currentUserId,
            club_id:
              matchingClub.id,
          })

      if (linkError) {
        setError(
          `Club exists, but could not be added to your profile: ${linkError.message}`
        )
        setCreatingClub(false)
        return
      }

      setSelectedClubs(
        (current) =>
          [
            ...current,
            matchingClub,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
      )

      setClubQuery('')
      setClubMessage(
        `${matchingClub.name} added.`
      )
      setCreatingClub(false)
      return
    }

    const newClub =
      createdClub as Club

    setAllClubs(
      (current) =>
        [...current, newClub]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    const {
      error: linkError,
    } =
      await supabase
        .from('user_clubs')
        .insert({
          user_id:
            currentUserId,
          club_id:
            newClub.id,
        })

    if (linkError) {
      setError(
        `Club was created, but could not be added to your profile: ${linkError.message}`
      )
      setCreatingClub(false)
      return
    }

    setSelectedClubs(
      (current) =>
        [...current, newClub]
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          )
    )

    setClubQuery('')
    setClubMessage(
      `${newClub.name} created and added.`
    )
    setCreatingClub(false)
  }

  // ============================================
  // WORK EXPERIENCE HELPERS
  // ============================================

  function resetWorkEditor() {
    setEditingWorkId(null)
    setWorkCompanyName('')
    setWorkRoleTitle('')
    setWorkIndustry('')
    setWorkDescription('')
    setWorkStartDate('')
    setWorkEndDate('')
    setWorkIsCurrent(false)
    setWorkEditorOpen(false)
  }

  function openNewWorkEditor() {
    setWorkMessage('')
    setError('')
    setEditingWorkId(null)
    setWorkCompanyName('')
    setWorkRoleTitle('')
    setWorkIndustry('')
    setWorkDescription('')
    setWorkStartDate('')
    setWorkEndDate('')
    setWorkIsCurrent(false)
    setWorkEditorOpen(true)
  }

  function openEditWorkEditor(
    experience: WorkExperience
  ) {
    setWorkMessage('')
    setError('')
    setEditingWorkId(
      experience.id
    )
    setWorkCompanyName(
      experience.company_name ||
        ''
    )
    setWorkRoleTitle(
      experience.role_title ||
        ''
    )
    setWorkIndustry(
      experience.industry ||
        ''
    )
    setWorkDescription(
      experience.description ||
        ''
    )
    setWorkStartDate(
      experience.start_date ||
        ''
    )
    setWorkEndDate(
      experience.end_date ||
        ''
    )
    setWorkIsCurrent(
      experience.is_current
    )
    setWorkEditorOpen(true)
  }

  async function saveWorkExperience() {
    if (
      !currentUserId ||
      savingWorkExperience
    ) {
      return
    }

    const companyName =
      workCompanyName.trim()

    const roleTitle =
      workRoleTitle.trim()

    const industry =
      workIndustry.trim()

    if (!companyName) {
      setError(
        'Company name is required.'
      )
      return
    }

    if (!roleTitle) {
      setError(
        'Role title is required.'
      )
      return
    }

    if (!industry) {
      setError(
        'Industry is required.'
      )
      return
    }

    if (!workStartDate) {
      setError(
        'Start date is required.'
      )
      return
    }

    if (
      !workIsCurrent &&
      !workEndDate
    ) {
      setError(
        'End date is required unless this is your current role.'
      )
      return
    }

    if (
      !workIsCurrent &&
      workEndDate &&
      new Date(
        workEndDate
      ) <
        new Date(
          workStartDate
        )
    ) {
      setError(
        'End date cannot be before start date.'
      )
      return
    }

    setError('')
    setWorkMessage('')
    setSavingWorkExperience(true)

    const supabase =
      createClient()

    const payload = {
      user_id:
        currentUserId,
      company_name:
        companyName,
      role_title:
        roleTitle,
      industry,
      description:
        workDescription.trim() ||
        null,
      start_date:
        workStartDate,
      end_date:
        workIsCurrent
          ? null
          : workEndDate,
      is_current:
        workIsCurrent,
    }

    if (
      editingWorkId !== null
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
            editingWorkId
          )
          .eq(
            'user_id',
            currentUserId
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
        setSavingWorkExperience(false)
        return
      }

      setWorkExperiences(
        (current) =>
          current
            .map(
              (item) =>
                item.id ===
                editingWorkId
                  ? (
                      data as WorkExperience
                    )
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

      setWorkMessage(
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
        setSavingWorkExperience(false)
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

      setWorkMessage(
        'Work experience added.'
      )
    }

    setSavingWorkExperience(false)
    resetWorkEditor()
  }

  async function deleteWorkExperience(
    experienceId: number
  ) {
    if (
      !currentUserId ||
      deletingWorkId !== null ||
      savingWorkExperience
    ) {
      return
    }

    setError('')
    setWorkMessage('')
    setDeletingWorkId(
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
          currentUserId
        )

    if (deleteError) {
      setError(
        `Could not delete work experience: ${deleteError.message}`
      )
      setDeletingWorkId(null)
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
      editingWorkId ===
      experienceId
    ) {
      resetWorkEditor()
    }

    setWorkMessage(
      'Work experience deleted.'
    )
    setDeletingWorkId(null)
  }

  function formatWorkDate(
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

  // ============================================
  // PROJECT HELPERS
  // ============================================

  function resetProjectEditor() {
    setEditingProjectId(null)
    setProjectTitle('')
    setProjectDescription('')
    setProjectEditorOpen(false)
  }

  function openNewProjectEditor() {
    setProjectMessage('')
    setError('')
    setEditingProjectId(null)
    setProjectTitle('')
    setProjectDescription('')
    setProjectEditorOpen(true)
  }

  function openEditProjectEditor(
    project: Project
  ) {
    setProjectMessage('')
    setError('')
    setEditingProjectId(
      project.id
    )
    setProjectTitle(
      project.title ||
        ''
    )
    setProjectDescription(
      project.description ||
        ''
    )
    setProjectEditorOpen(true)
  }

  async function saveProject() {
    if (
      !currentUserId ||
      savingProject
    ) {
      return
    }

    const title =
      projectTitle.trim()

    if (!title) {
      setError(
        'Project title is required.'
      )
      return
    }

    setError('')
    setProjectMessage('')
    setSavingProject(true)

    const supabase =
      createClient()

    const payload = {
      user_id:
        currentUserId,
      title,
      description:
        projectDescription.trim() ||
        null,
    }

    if (
      editingProjectId !== null
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
            editingProjectId
          )
          .eq(
            'user_id',
            currentUserId
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
        setSavingProject(false)
        return
      }

      setProjects(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              editingProjectId
                ? (
                    data as Project
                  )
                : item
          )
      )

      setProjectMessage(
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
        setSavingProject(false)
        return
      }

      setProjects(
        (current) => [
          data as Project,
          ...current,
        ]
      )

      setProjectMessage(
        'Project added.'
      )
    }

    setSavingProject(false)
    resetProjectEditor()
  }

  async function deleteProject(
    projectId: number
  ) {
    if (
      !currentUserId ||
      deletingProjectId !== null ||
      savingProject
    ) {
      return
    }

    setError('')
    setProjectMessage('')
    setDeletingProjectId(
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
          currentUserId
        )

    if (deleteError) {
      setError(
        `Could not delete project: ${deleteError.message}`
      )
      setDeletingProjectId(null)
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
      editingProjectId ===
      projectId
    ) {
      resetProjectEditor()
    }

    setProjectMessage(
      'Project deleted.'
    )
    setDeletingProjectId(null)
  }

  // ============================================
  // MATCHING PREFERENCES HELPERS
  // ============================================

  async function saveMatchPreferences() {
    if (
      !currentUserId ||
      savingPreferences
    ) {
      return
    }

    setError('')
    setPreferencesMessage('')
    setSavingPreferences(true)

    const supabase =
      createClient()

    const payload = {
      user_id:
        currentUserId,
      same_major:
        matchPreferences.same_major,
      similar_career_interests:
        matchPreferences.similar_career_interests,
      outside_major:
        matchPreferences.outside_major,
      upperclassmen:
        matchPreferences.upperclassmen,
      mentors:
        matchPreferences.mentors,
      project_collaborators:
        matchPreferences.project_collaborators,
      frequency:
        matchPreferences.frequency,
      match_style:
        matchPreferences.match_style,
    }

    const {
      data,
      error:
        upsertError,
    } =
      await supabase
        .from(
          'match_preferences'
        )
        .upsert(
          payload,
          {
            onConflict:
              'user_id',
          }
        )
        .select(`
          user_id,
          same_major,
          similar_career_interests,
          outside_major,
          upperclassmen,
          mentors,
          project_collaborators,
          frequency,
          match_style
        `)
        .single()

    if (upsertError) {
      setError(
        `Could not save matching preferences: ${upsertError.message}`
      )
      setSavingPreferences(false)
      return
    }

    setMatchPreferences(
      data as MatchPreferences
    )

    setPreferencesMessage(
      'Matching preferences saved.'
    )

    setSavingPreferences(false)
  }

  // ============================================
  // AVAILABILITY HELPERS
  // ============================================

  const availabilityDays = [
    {
      value: 1,
      label: 'Monday',
      shortLabel: 'Mon',
    },
    {
      value: 2,
      label: 'Tuesday',
      shortLabel: 'Tue',
    },
    {
      value: 3,
      label: 'Wednesday',
      shortLabel: 'Wed',
    },
    {
      value: 4,
      label: 'Thursday',
      shortLabel: 'Thu',
    },
    {
      value: 5,
      label: 'Friday',
      shortLabel: 'Fri',
    },
    {
      value: 6,
      label: 'Saturday',
      shortLabel: 'Sat',
    },
    {
      value: 7,
      label: 'Sunday',
      shortLabel: 'Sun',
    },
  ]

  function getAvailabilityDayLabel(
    day: number
  ) {
    return (
      availabilityDays.find(
        (item) =>
          item.value === day
      )?.label ||
      `Day ${day}`
    )
  }

  function formatAvailabilityTime(
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

  function resetAvailabilityEditor() {
    setEditingAvailabilityId(null)
    setAvailabilityDay(1)
    setAvailabilityStartTime('')
    setAvailabilityEndTime('')
    setAvailabilityEditorOpen(false)
  }

  function openNewAvailabilityEditor(
    day?: number
  ) {
    setError('')
    setAvailabilityMessage('')
    setEditingAvailabilityId(null)
    setAvailabilityDay(
      day || 1
    )
    setAvailabilityStartTime('')
    setAvailabilityEndTime('')
    setAvailabilityEditorOpen(true)
  }

  function openEditAvailabilityEditor(
    slot: AvailabilitySlot
  ) {
    setError('')
    setAvailabilityMessage('')
    setEditingAvailabilityId(
      slot.id
    )
    setAvailabilityDay(
      slot.day_of_week
    )
    setAvailabilityStartTime(
      slot.start_time.slice(
        0,
        5
      )
    )
    setAvailabilityEndTime(
      slot.end_time.slice(
        0,
        5
      )
    )
    setAvailabilityEditorOpen(true)
  }

  function availabilityTimesOverlap(
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

  async function saveAvailabilitySlot() {
    if (
      !currentUserId ||
      savingAvailability
    ) {
      return
    }

    if (!availabilityStartTime) {
      setError(
        'Start time is required.'
      )
      return
    }

    if (!availabilityEndTime) {
      setError(
        'End time is required.'
      )
      return
    }

    if (
      availabilityStartTime >=
      availabilityEndTime
    ) {
      setError(
        'End time must be later than start time.'
      )
      return
    }

    const overlappingSlot =
      availabilitySlots.find(
        (slot) =>
          slot.day_of_week ===
            availabilityDay &&
          slot.id !==
            editingAvailabilityId &&
          availabilityTimesOverlap(
            availabilityStartTime,
            availabilityEndTime,
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

    if (overlappingSlot) {
      setError(
        `This time overlaps with another ${getAvailabilityDayLabel(
          availabilityDay
        )} availability slot.`
      )
      return
    }

    setError('')
    setAvailabilityMessage('')
    setSavingAvailability(true)

    const supabase =
      createClient()

    const payload = {
      user_id:
        currentUserId,
      day_of_week:
        availabilityDay,
      start_time:
        availabilityStartTime,
      end_time:
        availabilityEndTime,
    }

    if (
      editingAvailabilityId !==
      null
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
            editingAvailabilityId
          )
          .eq(
            'user_id',
            currentUserId
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
        setSavingAvailability(false)
        return
      }

      setAvailabilitySlots(
        (current) =>
          current
            .map(
              (slot) =>
                slot.id ===
                editingAvailabilityId
                  ? (
                      data as AvailabilitySlot
                    )
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

      setAvailabilityMessage(
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
        setSavingAvailability(false)
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

      setAvailabilityMessage(
        'Availability added.'
      )
    }

    setSavingAvailability(false)
    resetAvailabilityEditor()
  }

  async function deleteAvailabilitySlot(
    slotId: number
  ) {
    if (
      !currentUserId ||
      deletingAvailabilityId !==
        null ||
      savingAvailability
    ) {
      return
    }

    setError('')
    setAvailabilityMessage('')
    setDeletingAvailabilityId(
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
          currentUserId
        )

    if (deleteError) {
      setError(
        `Could not delete availability: ${deleteError.message}`
      )
      setDeletingAvailabilityId(
        null
      )
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
      editingAvailabilityId ===
      slotId
    ) {
      resetAvailabilityEditor()
    }

    setAvailabilityMessage(
      'Availability removed.'
    )
    setDeletingAvailabilityId(null)
  }

  // ============================================
  // LINKS & RESUME HELPERS
  // ============================================

  function normalizeProfileLinkUrl(
    value: string
  ) {
    const cleaned =
      value.trim()

    if (!cleaned) {
      return ''
    }

    if (
      cleaned.startsWith(
        'http://'
      ) ||
      cleaned.startsWith(
        'https://'
      )
    ) {
      return cleaned
    }

    return `https://${cleaned}`
  }

  function addProfileLink() {
    setProfileLinks(
      (current) => [
        ...current,
        {
          label: '',
          url: '',
          sort_order:
            current.length,
        },
      ]
    )

    setLinksMessage('')
  }

  function updateProfileLink(
    index: number,
    field: 'label' | 'url',
    value: string
  ) {
    setProfileLinks(
      (current) =>
        current.map(
          (link, linkIndex) =>
            linkIndex === index
              ? {
                  ...link,
                  [field]: value,
                }
              : link
        )
    )

    setLinksMessage('')
  }

  function removeProfileLink(
    index: number
  ) {
    setProfileLinks(
      (current) =>
        current
          .filter(
            (_, linkIndex) =>
              linkIndex !== index
          )
          .map(
            (link, linkIndex) => ({
              ...link,
              sort_order:
                linkIndex,
            })
          )
    )

    setLinksMessage('')
  }

  function handleResumeChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')
    setLinksMessage('')

    const isPdf =
      file.type ===
        'application/pdf' ||
      file.name
        .toLowerCase()
        .endsWith('.pdf')

    if (!isPdf) {
      setError(
        'Please choose a PDF resume.'
      )

      event.target.value = ''
      return
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        'Resume files must be smaller than 10MB.'
      )

      event.target.value = ''
      return
    }

    setResumeFile(file)
  }

  async function uploadResume(
    userId: string
  ) {
    if (!resumeFile) {
      return resumePath || null
    }

    setUploadingResume(true)

    const supabase =
      createClient()

    const filePath =
      `${userId}/resume.pdf`

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from('resumes')
        .upload(
          filePath,
          resumeFile,
          {
            upsert: true,
            contentType:
              'application/pdf',
            cacheControl:
              '0',
          }
        )

    if (uploadError) {
      setError(
        `Could not upload resume: ${uploadError.message}`
      )

      setUploadingResume(false)
      return null
    }

    setResumePath(filePath)
    setResumeFile(null)
    setUploadingResume(false)

    return filePath
  }

  async function saveLinksAndResume() {
    if (
      !currentUserId ||
      savingLinks ||
      uploadingResume ||
      removingResume
    ) {
      return
    }

    setError('')
    setLinksMessage('')
    setSavingLinks(true)

    const supabase =
      createClient()

    const cleanedLinks =
      profileLinks
        .map(
          (link, index) => ({
            label:
              link.label.trim(),
            url:
              normalizeProfileLinkUrl(
                link.url
              ),
            sort_order:
              index,
          })
        )
        .filter(
          (link) =>
            link.label ||
            link.url
        )

    const incompleteLink =
      cleanedLinks.find(
        (link) =>
          !link.label ||
          !link.url
      )

    if (incompleteLink) {
      setError(
        'Each social link needs both a label and a link.'
      )

      setSavingLinks(false)
      return
    }

    const cleanedContactEmail =
      contactEmail.trim()

    if (
      cleanedContactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanedContactEmail
      )
    ) {
      setError(
        'Please enter a valid contact email.'
      )

      setSavingLinks(false)
      return
    }

    let savedResumePath =
      resumePath || null

    if (resumeFile) {
      savedResumePath =
        await uploadResume(
          currentUserId
        )

      if (!savedResumePath) {
        setSavingLinks(false)
        return
      }
    }

    const {
      error: deleteLinksError,
    } =
      await supabase
        .from('profile_links')
        .delete()
        .eq(
          'user_id',
          currentUserId
        )

    if (deleteLinksError) {
      setError(
        `Could not update profile links: ${deleteLinksError.message}`
      )

      setSavingLinks(false)
      return
    }

    let savedLinks:
      ProfileLink[] = []

    if (cleanedLinks.length > 0) {
      const {
        data: insertedLinks,
        error: insertLinksError,
      } =
        await supabase
          .from('profile_links')
          .insert(
            cleanedLinks.map(
              (link) => ({
                user_id:
                  currentUserId,
                label:
                  link.label,
                url:
                  link.url,
                sort_order:
                  link.sort_order,
              })
            )
          )
          .select(`
            id,
            label,
            url,
            sort_order
          `)

      if (insertLinksError) {
        setError(
          `Could not save profile links: ${insertLinksError.message}`
        )

        setSavingLinks(false)
        return
      }

      savedLinks =
        (insertedLinks ||
          []) as ProfileLink[]
    }

    const {
      data,
      error: updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          contact_email:
            cleanedContactEmail ||
            null,
          resume_url:
            savedResumePath,
          contact_visibility:
            contactVisibility,
        })
        .eq(
          'id',
          currentUserId
        )
        .select(`
          id,
          first_name,
          last_name,
          major,
          academic_year,
          bio,
          career_goal,
          profile_photo_url,
          is_discoverable,
          show_academic_info,
          show_career_goal,
          linkedin_url,
          instagram_username,
          snapchat_username,
          youtube_url,
          portfolio_url,
          contact_email,
          resume_url,
          contact_visibility
        `)
        .single()

    if (updateError) {
      setError(
        `Could not save links and resume: ${updateError.message}`
      )

      setSavingLinks(false)
      return
    }

    setProfile(
      data as Profile
    )

    setProfileLinks(
      savedLinks
    )

    setContactEmail(
      data.contact_email ||
      ''
    )

    setResumePath(
      data.resume_url ||
      ''
    )

    setContactVisibility(
      data.contact_visibility ||
      'connections'
    )

    setLinksMessage(
      'Links and resume saved.'
    )

    setSavingLinks(false)
  }

  async function viewResume() {
    if (!resumePath) {
      return
    }

    setError('')

    const supabase =
      createClient()

    const {
      data,
      error: signedUrlError,
    } =
      await supabase.storage
        .from('resumes')
        .createSignedUrl(
          resumePath,
          60
        )

    if (
      signedUrlError ||
      !data?.signedUrl
    ) {
      setError(
        `Could not open resume: ${
          signedUrlError?.message ||
          'Signed URL could not be created.'
        }`
      )

      return
    }

    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  async function removeResume() {
    if (
      !currentUserId ||
      !resumePath ||
      removingResume
    ) {
      return
    }

    const confirmed =
      window.confirm(
        'Remove your uploaded resume?'
      )

    if (!confirmed) {
      return
    }

    setError('')
    setLinksMessage('')
    setRemovingResume(true)

    const supabase =
      createClient()

    const {
      error: storageError,
    } =
      await supabase.storage
        .from('resumes')
        .remove([
          resumePath,
        ])

    if (storageError) {
      setError(
        `Could not remove resume: ${storageError.message}`
      )

      setRemovingResume(false)
      return
    }

    const {
      error: updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          resume_url: null,
        })
        .eq(
          'id',
          currentUserId
        )

    if (updateError) {
      setError(
        `Resume was removed from storage, but your profile could not be updated: ${updateError.message}`
      )

      setRemovingResume(false)
      return
    }

    setProfile(
      (current) =>
        current
          ? {
              ...current,
              resume_url: null,
            }
          : current
    )

    setResumePath('')
    setResumeFile(null)
    setLinksMessage(
      'Resume removed.'
    )
    setRemovingResume(false)
  }

  // ============================================
  // PRIVACY & DISCOVERY HELPERS
  // ============================================

  async function savePrivacySettings() {
    if (
      !currentUserId ||
      savingPrivacy
    ) {
      return
    }

    setError('')
    setPrivacyMessage('')
    setSavingPrivacy(true)

    const supabase =
      createClient()

    const {
      data,
      error:
        updateError,
    } =
      await supabase
        .from('profiles')
        .update({
          is_discoverable:
            isDiscoverable,
          show_academic_info:
            showAcademicInfo,
          show_career_goal:
            showCareerGoal,
        })
        .eq(
          'id',
          currentUserId
        )
        .select(`
          id,
          first_name,
          last_name,
          major,
          academic_year,
          bio,
          career_goal,
          profile_photo_url,
          is_discoverable,
          show_academic_info,
          show_career_goal,
          linkedin_url,
          instagram_username,
          snapchat_username,
          youtube_url,
          portfolio_url,
          contact_email,
          resume_url,
          contact_visibility
        `)
        .single()

    if (updateError) {
      setError(
        `Could not save privacy settings: ${updateError.message}`
      )
      setSavingPrivacy(false)
      return
    }

    setProfile(
      data as Profile
    )

    setIsDiscoverable(
      data.is_discoverable
    )

    setShowAcademicInfo(
      data.show_academic_info
    )

    setShowCareerGoal(
      data.show_career_goal
    )

    setPrivacyMessage(
      'Privacy settings saved.'
    )

    setSavingPrivacy(false)
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            ☕
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your profile...
          </p>

        </div>

      </main>
    )
  }

  const displayName =
    `${firstName} ${lastName}`
      .trim() ||
    'Your Name'

  const requiredFieldsCompleted =
    [
      firstName.trim(),
      lastName.trim(),
      major.trim(),
      academicYear,
    ].filter(Boolean).length

  const basicCompletionItems = [
    Boolean(firstName.trim()),
    Boolean(lastName.trim()),
    Boolean(major.trim()),
    Boolean(academicYear),
    Boolean(careerGoal.trim()),
    Boolean(bio.trim()),
    Boolean(photoPreview),
  ]

  const basicProfileCompletion =
    Math.round(
      (
        basicCompletionItems.filter(
          Boolean
        ).length /
        basicCompletionItems.length
      ) * 100
    )

  const hasUnsavedBasicChanges =
    firstName !==
      savedBasicProfile.firstName ||
    lastName !==
      savedBasicProfile.lastName ||
    major !==
      savedBasicProfile.major ||
    academicYear !==
      savedBasicProfile.academicYear ||
    careerGoal !==
      savedBasicProfile.careerGoal ||
    bio !==
      savedBasicProfile.bio ||
    Boolean(photoFile)

  const canSaveBasicProfile =
    requiredFieldsCompleted === 4 &&
    hasUnsavedBasicChanges &&
    !saving &&
    !uploadingPhoto

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#f7f7f5] pb-28">

      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 backdrop-blur">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/dashboard'
              )
            }
            className="text-xl font-bold tracking-tight transition hover:opacity-70"
          >
            BrewLink
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/dashboard'
              )
            }
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            Done
          </button>

        </div>

      </header>

      {/* MAIN */}

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* TITLE */}

        <section className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Your BrewLink
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Profile
          </h1>

          <p className="mt-3 max-w-xl leading-relaxed text-gray-500">
            Build a profile that helps BrewLink
            find the right people, opportunities,
            and conversations for you.
          </p>

        </section>

        {/* ALERTS */}

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

        {/* PROFILE HEADER */}

        <section className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white shadow-sm">

          <div className="bg-gradient-to-b from-gray-50 to-white px-6 py-8 sm:px-8">

            <div className="flex flex-col items-center gap-6 sm:flex-row">

              {/* PHOTO */}

              <div className="relative">

                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">

                  {photoPreview ? (
                    <img
                      src={
                        photoPreview
                      }
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">
                      👤
                    </span>
                  )}

                </div>

                <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105">

                  <span className="text-sm">
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

              {/* IDENTITY */}

              <div className="min-w-0 flex-1 text-center sm:text-left">

                <h2 className="break-words text-2xl font-bold">
                  {displayName}
                </h2>

                <p className="mt-1 text-gray-500">
                  {major ||
                    'Major not listed'}

                  {academicYear
                    ? ` • ${academicYear}`
                    : ''}
                </p>

                {careerGoal && (
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {careerGoal}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">

                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                    {basicProfileCompletion}% basic profile complete
                  </span>

                  {hasUnsavedBasicChanges && (
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Unsaved changes
                    </span>
                  )}

                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{
                      width:
                        `${basicProfileCompletion}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ABOUT */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-7">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              About
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Basic information
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Your core profile information.
              BrewLink uses this to introduce
              you to other students.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                {requiredFieldsCompleted}/4 required fields complete
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                Career goal, bio, and photo are optional
              </span>

            </div>

          </div>

          <div className="space-y-6">

            {/* NAMES */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="text-sm font-semibold">
                  First name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={
                    firstName
                  }
                  onChange={(
                    event
                  ) =>
                    setFirstName(
                      event.target.value
                    )
                  }
                  placeholder="First name"
                  maxLength={50}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Required
                </p>

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Last name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={
                    lastName
                  }
                  onChange={(
                    event
                  ) =>
                    setLastName(
                      event.target.value
                    )
                  }
                  placeholder="Last name"
                  maxLength={50}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Required
                </p>

              </div>

            </div>

            {/* MAJOR + YEAR */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label className="text-sm font-semibold">
                  Major <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={major}
                  onChange={(
                    event
                  ) =>
                    setMajor(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Cognitive Science"
                  maxLength={100}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Required. Type your major exactly as you want it displayed.
                </p>

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Academic year <span className="text-red-500">*</span>
                </label>

                <select
                  value={
                    academicYear
                  }
                  onChange={(
                    event
                  ) =>
                    setAcademicYear(
                      event.target.value
                    )
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

            {/* CAREER */}

            <div>

              <label className="text-sm font-semibold">
                Primary career goal
              </label>

              <input
                type="text"
                value={
                  careerGoal
                }
                onChange={(
                  event
                ) =>
                  setCareerGoal(
                    event.target.value
                  )
                }
                placeholder="e.g. Product Management"
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />

              <p className="mt-2 text-xs text-gray-400">
                This is your primary career direction.
                You&apos;ll be able to add broader
                interests separately.
              </p>

            </div>

            {/* BIO */}

            <div>

              <div className="flex items-center justify-between">

                <label className="text-sm font-semibold">
                  About you
                </label>

                <span
                  className={`text-xs ${
                    bio.length >= 280
                      ? 'font-semibold text-amber-600'
                      : 'text-gray-400'
                  }`}
                >
                  {bio.length}/300
                </span>

              </div>

              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Optional. A strong bio can mention what you&apos;re studying,
                what you&apos;re building, and what kinds of people you want
                to meet.
              </p>

              <textarea
                value={bio}
                onChange={(
                  event
                ) => {
                  if (
                    event.target.value
                      .length <= 300
                  ) {
                    setBio(
                      event.target.value
                    )
                  }
                }}
                rows={5}
                placeholder="Tell other students a little about yourself..."
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 leading-relaxed outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />

            </div>

            {/* SAVE */}

            <div className="rounded-2xl bg-gray-50 p-4">

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

                <p className="text-sm font-semibold text-gray-700">
                  {hasUnsavedBasicChanges
                    ? 'You have unsaved changes.'
                    : 'Your basic information is up to date.'}
                </p>

                <span className="text-xs font-medium text-gray-400">
                  {requiredFieldsCompleted}/4 required
                </span>

              </div>

              <button
                type="button"
                onClick={
                  saveProfile
                }
                disabled={
                  saving ||
                  uploadingPhoto
                }
                className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ||
                uploadingPhoto
                  ? 'Saving changes...'
                  : hasUnsavedBasicChanges
                    ? 'Save Basic Information'
                    : 'Save Basic Information'}
              </button>

            </div>

          </div>

        </section>

        {/* INTERESTS */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Interests
              </p>

              <h2 className="mt-2 text-xl font-bold">
                What are you into?
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Add as few or as many interests as you want.
                These directly improve BrewLink search and
                matching.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              ✨
            </div>

          </div>

          {/* SELECTED INTERESTS */}

          <div className="mt-6">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <p className="text-sm font-semibold text-gray-900">
                  Your interests
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedInterests.length}{' '}
                  {selectedInterests.length === 1
                    ? 'interest'
                    : 'interests'} selected
                  • no limit
                </p>

              </div>

              {selectedInterests.length > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                  Saved automatically
                </span>
              )}

            </div>

            {loadingInterests ? (

              <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                Loading interests...
              </div>

            ) : selectedInterests.length === 0 ? (

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-700">
                  No interests added yet
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Search below or create your own. You can
                  always change these later.
                </p>

              </div>

            ) : (

              <div className="mt-4 flex flex-wrap gap-2">

                {selectedInterests.map(
                  (interest) => (

                  <button
                    key={interest.id}
                    type="button"
                    onClick={() =>
                      removeInterest(
                        interest
                      )
                    }
                    disabled={
                      interestActionId !== null ||
                      creatingInterest
                    }
                    className="group flex max-w-full items-center gap-2 rounded-full bg-black px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Remove ${interest.name}`}
                  >

                    <span className="break-words">
                      {interest.name}
                    </span>

                    <span className="text-gray-300 transition group-hover:text-white">
                      ×
                    </span>

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* SEARCH / ADD */}

          <div className="mt-7 border-t border-gray-100 pt-6">

            <label className="text-sm font-semibold">
              Find or add an interest
            </label>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Search existing interests by name or category.
              If yours does not exist, create it.
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">

              <span className="shrink-0 text-lg">
                🔎
              </span>

              <input
                type="text"
                value={interestQuery}
                onChange={(event) => {
                  setInterestQuery(
                    event.target.value
                  )
                  setInterestMessage('')
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    normalizedInterestQuery &&
                    !exactInterestExists &&
                    !creatingInterest
                  ) {
                    event.preventDefault()
                    createCustomInterest()
                  }
                }}
                placeholder="Try AI, finance, startups, research..."
                maxLength={80}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />

              {interestQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setInterestQuery('')
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-black"
                  aria-label="Clear interest search"
                >
                  ×
                </button>
              )}

            </div>

            {interestMessage && (
              <p className="mt-3 text-sm font-medium text-green-700">
                ✓ {interestMessage}
              </p>
            )}

            {/* MATCHES */}

            {!loadingInterests && (
              <div className="mt-4">

                {interestQuery.trim() ? (

                  <>
                    {filteredInterests.length > 0 && (

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                          Suggestions
                        </p>

                        <div className="mt-3 space-y-2">

                          {filteredInterests.map(
                            (interest) => (

                            <button
                              key={interest.id}
                              type="button"
                              onClick={() =>
                                addInterest(
                                  interest
                                )
                              }
                              disabled={
                                interestActionId !== null ||
                                creatingInterest
                              }
                              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              <div className="min-w-0">

                                <p className="break-words text-sm font-semibold text-gray-900">
                                  {interest.name}
                                </p>

                                {interest.category && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    {interest.category}
                                  </p>
                                )}

                              </div>

                              <span className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                                {interestActionId === interest.id
                                  ? 'Adding...'
                                  : '+ Add'}
                              </span>

                            </button>

                          ))}

                        </div>

                      </div>

                    )}

                    {!exactInterestExists &&
                      normalizedInterestQuery && (

                      <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                        <p className="text-sm font-semibold text-gray-800">
                          Don&apos;t see your interest?
                        </p>

                        <p className="mt-1 break-words text-sm text-gray-500">
                          Create “{interestQuery.trim()}” and add it
                          to your profile.
                        </p>

                        <button
                          type="button"
                          onClick={
                            createCustomInterest
                          }
                          disabled={
                            creatingInterest ||
                            interestActionId !== null
                          }
                          className="mt-3 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creatingInterest
                            ? 'Creating...'
                            : `+ Create "${interestQuery.trim()}"`}
                        </button>

                      </div>

                    )}

                    {filteredInterests.length === 0 &&
                      exactInterestExists && (

                      <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                        That interest is already in your profile.
                      </p>

                    )}

                  </>

                ) : (

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      Browse interests
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {filteredInterests
                        .slice(0, 10)
                        .map(
                          (interest) => (

                          <button
                            key={interest.id}
                            type="button"
                            onClick={() =>
                              addInterest(
                                interest
                              )
                            }
                            disabled={
                              interestActionId !== null ||
                              creatingInterest
                            }
                            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            + {interest.name}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>
            )}

          </div>

        </section>

        {/* CLUBS */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Community
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Clubs & Organizations
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Add as few or as many clubs, organizations,
                teams, and communities as you want.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              👥
            </div>

          </div>

          {/* SELECTED CLUBS */}

          <div className="mt-6">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>

                <p className="text-sm font-semibold text-gray-900">
                  Your clubs
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedClubs.length}{' '}
                  {selectedClubs.length === 1
                    ? 'club'
                    : 'clubs'} selected
                  • no limit
                </p>

              </div>

              {selectedClubs.length > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                  Saved automatically
                </span>
              )}

            </div>

            {loadingClubs ? (

              <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
                Loading clubs...
              </div>

            ) : selectedClubs.length === 0 ? (

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-semibold text-gray-700">
                  No clubs added yet
                </p>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Search below or create an organization if
                  it is not already on BrewLink.
                </p>

              </div>

            ) : (

              <div className="mt-4 flex flex-wrap gap-2">

                {selectedClubs.map(
                  (club) => (

                  <button
                    key={club.id}
                    type="button"
                    onClick={() =>
                      removeClub(
                        club
                      )
                    }
                    disabled={
                      clubActionId !== null ||
                      creatingClub
                    }
                    className="group flex max-w-full items-center gap-2 rounded-full bg-black px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Remove ${club.name}`}
                  >

                    <span className="break-words">
                      {club.name}
                    </span>

                    <span className="text-gray-300 transition group-hover:text-white">
                      ×
                    </span>

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* SEARCH / ADD */}

          <div className="mt-7 border-t border-gray-100 pt-6">

            <label className="text-sm font-semibold">
              Find or add a club
            </label>

            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Search existing clubs by name or description.
              If yours does not exist, create it.
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">

              <span className="shrink-0 text-lg">
                🔎
              </span>

              <input
                type="text"
                value={clubQuery}
                onChange={(event) => {
                  setClubQuery(
                    event.target.value
                  )
                  setClubMessage('')
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    normalizedClubQuery &&
                    !exactClubExists &&
                    !creatingClub
                  ) {
                    event.preventDefault()
                    createCustomClub()
                  }
                }}
                placeholder="Try tennis, consulting, AI club..."
                maxLength={100}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />

              {clubQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setClubQuery('')
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-black"
                  aria-label="Clear club search"
                >
                  ×
                </button>
              )}

            </div>

            {clubMessage && (
              <p className="mt-3 text-sm font-medium text-green-700">
                ✓ {clubMessage}
              </p>
            )}

            {!loadingClubs && (
              <div className="mt-4">

                {clubQuery.trim() ? (

                  <>
                    {filteredClubs.length > 0 && (

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                          Suggestions
                        </p>

                        <div className="mt-3 space-y-2">

                          {filteredClubs.map(
                            (club) => (

                            <button
                              key={club.id}
                              type="button"
                              onClick={() =>
                                addClub(
                                  club
                                )
                              }
                              disabled={
                                clubActionId !== null ||
                                creatingClub
                              }
                              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              <div className="min-w-0">

                                <p className="break-words text-sm font-semibold text-gray-900">
                                  {club.name}
                                </p>

                                {club.description && (
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                                    {club.description}
                                  </p>
                                )}

                              </div>

                              <span className="shrink-0 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                                {clubActionId === club.id
                                  ? 'Adding...'
                                  : '+ Add'}
                              </span>

                            </button>

                          ))}

                        </div>

                      </div>

                    )}

                    {!exactClubExists &&
                      normalizedClubQuery && (

                      <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                        <p className="text-sm font-semibold text-gray-800">
                          Don&apos;t see your organization?
                        </p>

                        <p className="mt-1 break-words text-sm text-gray-500">
                          Create “{clubQuery.trim()}” and add it
                          to your profile.
                        </p>

                        <button
                          type="button"
                          onClick={
                            createCustomClub
                          }
                          disabled={
                            creatingClub ||
                            clubActionId !== null
                          }
                          className="mt-3 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creatingClub
                            ? 'Creating...'
                            : `+ Create "${clubQuery.trim()}"`}
                        </button>

                      </div>

                    )}

                    {filteredClubs.length === 0 &&
                      exactClubExists && (

                      <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                        That club is already in your profile.
                      </p>

                    )}

                  </>

                ) : (

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                      Browse clubs
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {filteredClubs
                        .slice(0, 10)
                        .map(
                          (club) => (

                          <button
                            key={club.id}
                            type="button"
                            onClick={() =>
                              addClub(
                                club
                              )
                            }
                            disabled={
                              clubActionId !== null ||
                              creatingClub
                            }
                            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            + {club.name}
                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>
            )}

          </div>

        </section>

        {/* WORK EXPERIENCE */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Experience
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Work Experience
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Add internships, jobs, research positions,
                part-time work, or other professional experience.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              💼
            </div>

          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

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
                openNewWorkEditor
              }
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Add experience
            </button>

          </div>

          {workMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {workMessage}
            </p>
          )}

          {loadingWorkExperience ? (

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              Loading work experience...
            </div>

          ) : workExperiences.length === 0 ? (

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

              <p className="text-sm font-semibold text-gray-700">
                No work experience added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                This section is optional. Add roles that help other
                BrewLink users understand your background.
              </p>

            </div>

          ) : (

            <div className="mt-4 space-y-3">

              {workExperiences.map(
                (experience) => (

                <div
                  key={
                    experience.id
                  }
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
                        {formatWorkDate(
                          experience.start_date
                        )}
                        {' – '}
                        {experience.is_current
                          ? 'Present'
                          : formatWorkDate(
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
                          openEditWorkEditor(
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
                            deleteWorkExperience(
                              experience.id
                            )
                          }
                        }}
                        disabled={
                          deletingWorkId !== null
                        }
                        className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingWorkId ===
                        experience.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

          {workEditorOpen && (

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {editingWorkId !== null
                      ? 'Edit position'
                      : 'New position'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingWorkId !== null
                      ? 'Update work experience'
                      : 'Add work experience'}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    resetWorkEditor
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
                      value={
                        workCompanyName
                      }
                      onChange={(event) =>
                        setWorkCompanyName(
                          event.target.value
                        )
                      }
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
                      value={
                        workRoleTitle
                      }
                      onChange={(event) =>
                        setWorkRoleTitle(
                          event.target.value
                        )
                      }
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
                    value={
                      workIndustry
                    }
                    onChange={(event) =>
                      setWorkIndustry(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Technology"
                    maxLength={100}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Use the industry label you want people to find you by in Search.
                  </p>

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="text-sm font-semibold">
                      Start date <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      value={
                        workStartDate
                      }
                      onChange={(event) =>
                        setWorkStartDate(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      End date
                    </label>

                    <input
                      type="date"
                      value={
                        workEndDate
                      }
                      onChange={(event) =>
                        setWorkEndDate(
                          event.target.value
                        )
                      }
                      disabled={
                        workIsCurrent
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    />

                  </div>

                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">

                  <input
                    type="checkbox"
                    checked={
                      workIsCurrent
                    }
                    onChange={(event) => {
                      setWorkIsCurrent(
                        event.target.checked
                      )

                      if (
                        event.target.checked
                      ) {
                        setWorkEndDate('')
                      }
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
                      {workDescription.length}/500
                    </span>

                  </div>

                  <textarea
                    value={
                      workDescription
                    }
                    onChange={(event) => {
                      if (
                        event.target.value.length <=
                        500
                      ) {
                        setWorkDescription(
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
                      resetWorkEditor
                    }
                    disabled={
                      savingWorkExperience
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveWorkExperience
                    }
                    disabled={
                      savingWorkExperience
                    }
                    className="w-full flex-1 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingWorkExperience
                      ? 'Saving...'
                      : editingWorkId !== null
                        ? 'Save Changes'
                        : 'Add Experience'}
                  </button>

                </div>

              </div>

            </div>

          )}

        </section>

        {/* PROJECTS */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Build
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Projects
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Highlight apps, research, startups, portfolios,
                case studies, or anything else you&apos;ve built.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              🚀
            </div>

          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

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
                openNewProjectEditor
              }
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Add project
            </button>

          </div>

          {projectMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {projectMessage}
            </p>
          )}

          {loadingProjects ? (

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              Loading projects...
            </div>

          ) : projects.length === 0 ? (

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

              <p className="text-sm font-semibold text-gray-700">
                No projects added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Projects are optional, but they can make your profile
                much stronger for collaborators, recruiters, and other students.
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
                          openEditProjectEditor(
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
                          deletingProjectId !== null
                        }
                        className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingProjectId ===
                        project.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

          {projectEditorOpen && (

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {editingProjectId !== null
                      ? 'Edit project'
                      : 'New project'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingProjectId !== null
                      ? 'Update project'
                      : 'Add a project'}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    resetProjectEditor
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
                    Project title <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={
                      projectTitle
                    }
                    onChange={(event) =>
                      setProjectTitle(
                        event.target.value
                      )
                    }
                    placeholder="e.g. BrewLink"
                    maxLength={120}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-400">
                    Use a short title that clearly identifies the project.
                  </p>

                </div>

                <div>

                  <div className="flex items-center justify-between gap-3">

                    <label className="text-sm font-semibold">
                      Description
                    </label>

                    <span className="text-xs text-gray-400">
                      {projectDescription.length}/700
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    Optional. Explain what you built, what problem it solves,
                    your role, or what you learned.
                  </p>

                  <textarea
                    value={
                      projectDescription
                    }
                    onChange={(event) => {
                      if (
                        event.target.value.length <=
                        700
                      ) {
                        setProjectDescription(
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
                      resetProjectEditor
                    }
                    disabled={
                      savingProject
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
                      savingProject
                    }
                    className="w-full flex-1 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingProject
                      ? 'Saving...'
                      : editingProjectId !== null
                        ? 'Save Changes'
                        : 'Add Project'}
                  </button>

                </div>

              </div>

            </div>

          )}

        </section>

        {/* MATCHING PREFERENCES */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Matching
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Matching Preferences
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Choose as many or as few preferences as you want.
                BrewLink uses these to personalize discovery and ranking.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              🎯
            </div>

          </div>

          {preferencesMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {preferencesMessage}
            </p>
          )}

          {loadingPreferences ? (

            <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              Loading matching preferences...
            </div>

          ) : (

            <div className="mt-6 space-y-7">

              {/* WHO TO PRIORITIZE */}

              <div>

                <p className="text-sm font-semibold text-gray-900">
                  Who should BrewLink prioritize?
                </p>

                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Select any combination. Leaving everything off means you are open to anyone.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  {[
                    {
                      key: 'same_major',
                      title: 'Same major',
                      description:
                        'Prioritize students in your major.',
                    },
                    {
                      key: 'similar_career_interests',
                      title: 'Similar career interests',
                      description:
                        'Prioritize people pursuing similar career paths.',
                    },
                    {
                      key: 'outside_major',
                      title: 'Outside my major',
                      description:
                        'Meet people from different academic backgrounds.',
                    },
                    {
                      key: 'upperclassmen',
                      title: 'Upperclassmen',
                      description:
                        'Prioritize students further along in school.',
                    },
                    {
                      key: 'mentors',
                      title: 'Mentors',
                      description:
                        'Find people who may be able to guide or advise you.',
                    },
                    {
                      key: 'project_collaborators',
                      title: 'Project collaborators',
                      description:
                        'Find students who may want to build something together.',
                    },
                  ].map(
                    (option) => {
                      const key =
                        option.key as
                          | 'same_major'
                          | 'similar_career_interests'
                          | 'outside_major'
                          | 'upperclassmen'
                          | 'mentors'
                          | 'project_collaborators'

                      const checked =
                        matchPreferences[
                          key
                        ]

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setPreferencesMessage('')
                            setMatchPreferences(
                              (current) => ({
                                ...current,
                                [key]:
                                  !current[
                                    key
                                  ],
                              })
                            )
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            checked
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <p className={`text-sm font-semibold ${
                                checked
                                  ? 'text-white'
                                  : 'text-gray-900'
                              }`}>
                                {option.title}
                              </p>

                              <p className={`mt-1 text-xs leading-relaxed ${
                                checked
                                  ? 'text-gray-300'
                                  : 'text-gray-400'
                              }`}>
                                {option.description}
                              </p>

                            </div>

                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                              checked
                                ? 'border-white bg-white text-black'
                                : 'border-gray-300 text-transparent'
                            }`}>
                              ✓
                            </div>

                          </div>

                        </button>
                      )
                    }
                  )}

                </div>

              </div>

              {/* MATCH STYLE */}

              <div className="border-t border-gray-100 pt-6">

                <p className="text-sm font-semibold text-gray-900">
                  Matching style
                </p>

                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  This controls how strongly compatibility affects your discovery ranking.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  {[
                    {
                      value:
                        'similar',
                      title:
                        'Similar',
                      description:
                        'Prioritize people most like your profile and preferences.',
                    },
                    {
                      value:
                        'balanced',
                      title:
                        'Balanced',
                      description:
                        'Mix compatibility with variety.',
                    },
                    {
                      value:
                        'explore',
                      title:
                        'Explore',
                      description:
                        'Show a wider variety of people and backgrounds.',
                    },
                  ].map(
                    (option) => {
                      const selected =
                        matchPreferences.match_style ===
                        option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPreferencesMessage('')
                            setMatchPreferences(
                              (current) => ({
                                ...current,
                                match_style:
                                  option.value,
                              })
                            )
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >

                          <p className={`text-sm font-semibold ${
                            selected
                              ? 'text-white'
                              : 'text-gray-900'
                          }`}>
                            {option.title}
                          </p>

                          <p className={`mt-1 text-xs leading-relaxed ${
                            selected
                              ? 'text-gray-300'
                              : 'text-gray-400'
                          }`}>
                            {option.description}
                          </p>

                        </button>
                      )
                    }
                  )}

                </div>

              </div>

              {/* FREQUENCY */}

              <div className="border-t border-gray-100 pt-6">

                <label className="text-sm font-semibold">
                  How often do you want new matches?
                </label>

                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  This will be used by BrewLink&apos;s matching flow later.
                </p>

                <select
                  value={
                    matchPreferences.frequency
                  }
                  onChange={(event) => {
                    setPreferencesMessage('')
                    setMatchPreferences(
                      (current) => ({
                        ...current,
                        frequency:
                          event.target.value,
                      })
                    )
                  }}
                  className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                >
                  <option value="daily">
                    Daily
                  </option>

                  <option value="twice_weekly">
                    Twice a week
                  </option>

                  <option value="weekly">
                    Weekly
                  </option>

                  <option value="biweekly">
                    Every two weeks
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="manual">
                    Only when I choose
                  </option>
                </select>

              </div>

              {/* SAVE */}

              <div className="border-t border-gray-100 pt-6">

                <button
                  type="button"
                  onClick={
                    saveMatchPreferences
                  }
                  disabled={
                    savingPreferences
                  }
                  className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPreferences
                    ? 'Saving preferences...'
                    : 'Save Matching Preferences'}
                </button>

              </div>

            </div>

          )}

        </section>

        {/* AVAILABILITY */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Schedule
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Availability
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Add as many weekly time windows as you need.
                BrewLink uses these to find times that overlap with
                other students.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              📅
            </div>

          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

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
                openNewAvailabilityEditor()
              }
              className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Add time
            </button>

          </div>

          {availabilityMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {availabilityMessage}
            </p>
          )}

          {loadingAvailability ? (

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              Loading availability...
            </div>

          ) : availabilitySlots.length === 0 ? (

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

              <p className="text-sm font-semibold text-gray-700">
                No availability added yet
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                This is optional. Add your usual free times so
                BrewLink can make scheduling easier later.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {availabilityDays.map(
                (day) => {
                  const daySlots =
                    availabilitySlots.filter(
                      (slot) =>
                        slot.day_of_week ===
                        day.value
                    )

                  if (
                    daySlots.length === 0
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={
                        day.value
                      }
                      className="rounded-2xl bg-gray-50 p-4"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-sm font-bold text-gray-900">
                          {day.label}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openNewAvailabilityEditor(
                              day.value
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
                              {formatAvailabilityTime(
                                slot.start_time
                              )}
                              {' – '}
                              {formatAvailabilityTime(
                                slot.end_time
                              )}
                            </p>

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditAvailabilityEditor(
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
                                      `Remove ${day.label} ${formatAvailabilityTime(
                                        slot.start_time
                                      )} – ${formatAvailabilityTime(
                                        slot.end_time
                                      )}?`
                                    )

                                  if (confirmed) {
                                    deleteAvailabilitySlot(
                                      slot.id
                                    )
                                  }
                                }}
                                disabled={
                                  deletingAvailabilityId !==
                                  null
                                }
                                className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingAvailabilityId ===
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

          {availabilityEditorOpen && (

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {editingAvailabilityId !== null
                      ? 'Edit availability'
                      : 'New availability'}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {editingAvailabilityId !== null
                      ? 'Update time window'
                      : 'Add a time window'}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={
                    resetAvailabilityEditor
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
                      availabilityDay
                    }
                    onChange={(event) =>
                      setAvailabilityDay(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  >
                    {availabilityDays.map(
                      (day) => (
                        <option
                          key={
                            day.value
                          }
                          value={
                            day.value
                          }
                        >
                          {day.label}
                        </option>
                      )
                    )}
                  </select>

                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="text-sm font-semibold">
                      Start time <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      value={
                        availabilityStartTime
                      }
                      onChange={(event) =>
                        setAvailabilityStartTime(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      End time <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      value={
                        availabilityEndTime
                      }
                      onChange={(event) =>
                        setAvailabilityEndTime(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                </div>

                <p className="text-xs leading-relaxed text-gray-400">
                  Add separate windows if you are free at multiple times
                  on the same day. Overlapping windows are prevented.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={
                      resetAvailabilityEditor
                    }
                    disabled={
                      savingAvailability
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveAvailabilitySlot
                    }
                    disabled={
                      savingAvailability
                    }
                    className="w-full flex-1 rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingAvailability
                      ? 'Saving...'
                      : editingAvailabilityId !== null
                        ? 'Save Changes'
                        : 'Add Time'}
                  </button>

                </div>

              </div>

            </div>

          )}

        </section>

        {/* LINKS & RESUME */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Contact
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Links & Resume
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Add any social profile, professional link, or personal website
                you want to share. Everything here is optional.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              🔗
            </div>

          </div>

          {linksMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {linksMessage}
            </p>
          )}

          <div className="mt-6 space-y-6">

            <div>

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                  <label className="text-sm font-semibold">
                    Social links
                  </label>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Add any platform you use — LinkedIn, GitHub, Instagram,
                    TikTok, YouTube, Handshake, a personal website, or anything else.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    addProfileLink
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  + Add link
                </button>

              </div>

              {profileLinks.length === 0 ? (

                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">

                  <p className="text-sm font-semibold text-gray-700">
                    No social links added yet
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Add only the accounts or websites you actually want to share.
                  </p>

                  <button
                    type="button"
                    onClick={
                      addProfileLink
                    }
                    className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                  >
                    Add your first link
                  </button>

                </div>

              ) : (

                <div className="mt-4 space-y-3">

                  {profileLinks.map(
                    (link, index) => (

                      <div
                        key={
                          link.id ??
                          `new-link-${index}`
                        }
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >

                        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.5fr_auto] sm:items-end">

                          <div>

                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Label
                            </label>

                            <input
                              type="text"
                              value={
                                link.label
                              }
                              onChange={(event) =>
                                updateProfileLink(
                                  index,
                                  'label',
                                  event.target.value
                                )
                              }
                              placeholder="e.g. GitHub"
                              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            />

                          </div>

                          <div>

                            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Link
                            </label>

                            <input
                              type="text"
                              value={
                                link.url
                              }
                              onChange={(event) =>
                                updateProfileLink(
                                  index,
                                  'url',
                                  event.target.value
                                )
                              }
                              placeholder="github.com/yourname"
                              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            />

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeProfileLink(
                                index
                              )
                            }
                            className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    )
                  )}

                  <button
                    type="button"
                    onClick={
                      addProfileLink
                    }
                    className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    + Add another link
                  </button>

                </div>

              )}

            </div>

            <div>

              <label className="text-sm font-semibold">
                Contact email
              </label>

              <input
                type="email"
                value={
                  contactEmail
                }
                onChange={(event) => {
                  setContactEmail(
                    event.target.value
                  )
                  setLinksMessage('')
                }}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />

              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                This is separate from your BrewLink login email.
              </p>

            </div>

            <div>

              <label className="text-sm font-semibold">
                Who can see my links and resume?
              </label>

              <select
                value={
                  contactVisibility
                }
                onChange={(event) => {
                  setContactVisibility(
                    event.target.value
                  )
                  setLinksMessage('')
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="connections">
                  Connections only
                </option>

                <option value="everyone">
                  Everyone
                </option>

                <option value="hidden">
                  Hidden
                </option>
              </select>

              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Connections only is recommended. BrewLink will use this
                setting when other-user profile pages are enabled.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Resume
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Upload one PDF, up to 10MB. Uploading a new resume replaces
                    the previous file.
                  </p>

                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  📄
                </div>

              </div>

              <div className="mt-4">

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={
                    handleResumeChange
                  }
                  disabled={
                    savingLinks ||
                    uploadingResume ||
                    removingResume
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-gray-700 file:shadow-sm hover:file:bg-gray-100 disabled:opacity-50"
                />

                {resumeFile && (
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Selected: {resumeFile.name}
                  </p>
                )}

                {resumePath && !resumeFile && (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-gray-800">
                        Resume uploaded
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Private BrewLink resume
                      </p>

                    </div>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={
                          viewResume
                        }
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={
                          removeResume
                        }
                        disabled={
                          removingResume
                        }
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingResume
                          ? 'Removing...'
                          : 'Remove'}
                      </button>

                    </div>

                  </div>
                )}

              </div>

            </div>

            <button
              type="button"
              onClick={
                saveLinksAndResume
              }
              disabled={
                savingLinks ||
                uploadingResume ||
                removingResume
              }
              className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingLinks ||
              uploadingResume
                ? 'Saving...'
                : 'Save Links & Resume'}
            </button>

          </div>

        </section>

        {/* PRIVACY */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Privacy
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Privacy & Discovery
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Control whether people can find you and which
                parts of your profile are visible in Search,
                Discovery, and profile previews.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              🔒
            </div>

          </div>

          {privacyMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              ✓ {privacyMessage}
            </p>
          )}

          <div className="mt-6 space-y-4">

            {/* DISCOVERABILITY */}

            <button
              type="button"
              onClick={() => {
                setPrivacyMessage('')
                setIsDiscoverable(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                isDiscoverable
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className={`text-sm font-semibold ${
                    isDiscoverable
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    Appear in Search & Discovery
                  </p>

                  <p className={`mt-1 text-xs leading-relaxed ${
                    isDiscoverable
                      ? 'text-gray-300'
                      : 'text-gray-400'
                  }`}>
                    {isDiscoverable
                      ? 'Other BrewLink students can discover your profile.'
                      : 'You will be hidden from new Search and Discovery results. Existing connections are not removed.'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  isDiscoverable
                    ? 'bg-white'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full transition ${
                    isDiscoverable
                      ? 'translate-x-5 bg-black'
                      : 'translate-x-0 bg-white'
                  }`} />

                </div>

              </div>

            </button>

            {/* ACADEMIC */}

            <button
              type="button"
              onClick={() => {
                setPrivacyMessage('')
                setShowAcademicInfo(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                showAcademicInfo
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Show academic information
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Controls whether your major and academic year
                    appear to other students.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Currently: {showAcademicInfo
                      ? 'Visible'
                      : 'Hidden'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  showAcademicInfo
                    ? 'bg-black'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full bg-white transition ${
                    showAcademicInfo
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`} />

                </div>

              </div>

            </button>

            {/* CAREER */}

            <button
              type="button"
              onClick={() => {
                setPrivacyMessage('')
                setShowCareerGoal(
                  (current) =>
                    !current
                )
              }}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                showCareerGoal
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Show career goal
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    Controls whether your primary career direction
                    appears to other students.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    Currently: {showCareerGoal
                      ? 'Visible'
                      : 'Hidden'}
                  </p>

                </div>

                <div className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  showCareerGoal
                    ? 'bg-black'
                    : 'bg-gray-200'
                }`}>

                  <div className={`h-5 w-5 rounded-full bg-white transition ${
                    showCareerGoal
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`} />

                </div>

              </div>

            </button>

          </div>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
              Privacy preview
            </p>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isDiscoverable
                ? 'Your profile can appear to new people.'
                : 'Your profile is hidden from new discovery.'}
              {' '}
              {showAcademicInfo
                ? 'Academic info is visible.'
                : 'Academic info is hidden.'}
              {' '}
              {showCareerGoal
                ? 'Career goal is visible.'
                : 'Career goal is hidden.'}
            </p>

          </div>

          <button
            type="button"
            onClick={
              savePrivacySettings
            }
            disabled={
              savingPrivacy
            }
            className="mt-5 w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPrivacy
              ? 'Saving privacy settings...'
              : 'Save Privacy Settings'}
          </button>

        </section>

        {/* PREVIEW */}

        <section
          role="button"
          tabIndex={0}
          onClick={() =>
            setProfilePreviewOpen(
              true
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault()
              setProfilePreviewOpen(
                true
              )
            }
          }}
          className="mt-5 cursor-pointer rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Preview
              </p>

              <h2 className="mt-2 text-xl font-bold">
                See Your Public Profile
              </h2>

              <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
                Preview your profile using the same information other
                BrewLink students see in Search and Discovery.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              👀
            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
              Visibility status
            </p>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isDiscoverable
                ? 'Your profile is discoverable.'
                : 'Your profile is currently hidden from new Search and Discovery results.'}
              {' '}
              {showAcademicInfo
                ? 'Academic information is visible.'
                : 'Academic information is hidden.'}
              {' '}
              {showCareerGoal
                ? 'Career goal is visible.'
                : 'Career goal is hidden.'}
            </p>

          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setProfilePreviewOpen(
                true
              )
            }}
            className="mt-5 w-full rounded-xl bg-black px-5 py-4 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99]"
          >
            Preview My Profile
          </button>

        </section>

        {/* ACCOUNT */}

        <section className="mt-5 rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Account
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Account Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your BrewLink session.
          </p>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="mt-6 w-full rounded-xl border border-red-200 bg-white px-5 py-4 font-semibold text-red-600 transition hover:bg-red-50"
          >
            Log Out
          </button>

        </section>

        {/* PHOTO INFO */}

        <p className="mt-5 text-center text-xs text-gray-400">
          Profile photos must be JPG,
          PNG, or WebP and under 5MB.
        </p>

      </div>

      {/* PUBLIC PROFILE PREVIEW MODAL */}

      {profilePreviewOpen && (

        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() =>
            setProfilePreviewOpen(
              false
            )
          }
        >

          <div
            className="h-[94vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Public profile preview
                </p>

                <p className="mt-0.5 text-sm font-semibold text-gray-700">
                  BrewLink
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setProfilePreviewOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 transition hover:bg-gray-200 hover:text-black"
                aria-label="Close profile preview"
              >
                ×
              </button>

            </div>

            <div className="p-5 sm:p-7">

              {/* PROFILE HEADER */}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">

                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                  {photoPreview ? (

                    <img
                      src={
                        photoPreview
                      }
                      alt={`${displayName} profile`}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <span className="text-2xl font-bold text-gray-500">
                      {`${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?'}
                    </span>

                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <h2 className="break-words text-2xl font-bold tracking-tight">
                    {displayName}
                  </h2>

                  {showAcademicInfo && (
                    <p className="mt-1 break-words text-sm text-gray-500">
                      {major ||
                        'Major not listed'}
                      {academicYear
                        ? ` • ${academicYear}`
                        : ''}
                    </p>
                  )}

                  {showCareerGoal &&
                    careerGoal && (
                    <p className="mt-2 break-words text-sm font-semibold text-gray-700">
                      {careerGoal}
                    </p>
                  )}

                  {!isDiscoverable && (
                    <span className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                      Hidden from discovery
                    </span>
                  )}

                </div>

              </div>

              {/* BIO */}

              {bio && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    About
                  </p>

                  <p className="mt-2 break-words text-sm leading-relaxed text-gray-600">
                    {bio}
                  </p>

                </div>
              )}

              {/* INTERESTS */}

              {selectedInterests.length > 0 && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Interests
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {selectedInterests.map(
                      (interest) => (
                        <span
                          key={interest.id}
                          className="max-w-full break-words rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                        >
                          {interest.name}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* CLUBS */}

              {selectedClubs.length > 0 && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Clubs & Organizations
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {selectedClubs.map(
                      (club) => (
                        <span
                          key={club.id}
                          className="max-w-full break-words rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                        >
                          {club.name}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* WORK EXPERIENCE */}

              {workExperiences.length > 0 && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Work experience
                  </p>

                  <div className="mt-3 space-y-3">

                    {workExperiences.map(
                      (experience) => (
                        <div
                          key={experience.id}
                          className="rounded-2xl bg-gray-50 p-4"
                        >

                          <div className="flex flex-wrap items-start justify-between gap-2">

                            <div>

                              <p className="break-words text-sm font-bold text-gray-900">
                                {experience.company_name}
                              </p>

                              <p className="mt-1 break-words text-sm font-medium text-gray-700">
                                {experience.role_title}
                              </p>

                            </div>

                            {experience.is_current && (
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                                Current
                              </span>
                            )}

                          </div>

                          <p className="mt-2 text-xs text-gray-400">
                            {experience.industry}
                            {' • '}
                            {formatWorkDate(
                              experience.start_date
                            )}
                            {' – '}
                            {experience.is_current
                              ? 'Present'
                              : formatWorkDate(
                                  experience.end_date
                                )}
                          </p>

                          {experience.description && (
                            <p className="mt-2 break-words text-sm leading-relaxed text-gray-500">
                              {experience.description}
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* PROJECTS */}

              {projects.length > 0 && (
                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Projects
                  </p>

                  <div className="mt-3 space-y-3">

                    {projects.map(
                      (project) => (
                        <div
                          key={project.id}
                          className="rounded-2xl bg-gray-50 p-4"
                        >

                          <p className="break-words text-sm font-bold text-gray-900">
                            {project.title}
                          </p>

                          {project.description && (
                            <p className="mt-2 break-words text-sm leading-relaxed text-gray-500">
                              {project.description}
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

              {/* LINKS & RESUME */}

              {contactVisibility !==
                'hidden' &&
                (
                  profileLinks.length > 0 ||
                  contactEmail ||
                  resumePath
                ) && (

                <div className="mt-6">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Links & Resume
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {profileLinks.map(
                      (link, index) => (

                        <span
                          key={
                            link.id ??
                            `preview-link-${index}`
                          }
                          className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600"
                        >
                          {link.label ||
                            'Link'}
                        </span>

                      )
                    )}

                    {contactEmail && (
                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                        Email
                      </span>
                    )}

                    {resumePath && (
                      <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                        Resume
                      </span>
                    )}

                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    Visibility: {
                      contactVisibility ===
                      'everyone'
                        ? 'Everyone'
                        : 'Connections only'
                    }
                  </p>

                </div>

              )}

              {/* EMPTY PROFILE FALLBACK */}

              {!bio &&
                selectedInterests.length === 0 &&
                selectedClubs.length === 0 &&
                workExperiences.length === 0 &&
                projects.length === 0 &&
                profileLinks.length === 0 &&
                !contactEmail &&
                !resumePath && (

                <div className="mt-6 rounded-2xl bg-gray-50 p-4">

                  <p className="text-sm font-semibold text-gray-700">
                    Your profile is still pretty light.
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Add interests, clubs, work experience, or projects to make
                    this preview stronger.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

      <BottomNav />

    </main>
  )
}