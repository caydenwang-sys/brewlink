'use client'

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createClient,
} from '@/lib/supabase/client'
import {
  useParams,
  useRouter,
} from 'next/navigation'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
}

type Message = {
  id: number
  match_id: number
  sender_id: string
  message: string
  created_at: string
  read_at: string | null
}

export default function ConversationPage() {
  const router = useRouter()

  const params =
    useParams<{ matchId: string }>()

  const matchId = Number(params.matchId)

  // ============================================
  // STATE
  // ============================================

  const [currentUserId, setCurrentUserId] =
    useState('')

  const [otherUser, setOtherUser] =
    useState<Profile | null>(null)

  const [messages, setMessages] =
    useState<Message[]>([])

  const [newMessage, setNewMessage] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  const [error, setError] =
    useState('')

  // ============================================
  // AUTO-SCROLL REF
  // ============================================

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================

  function scrollToBottom(
    behavior: ScrollBehavior = 'smooth'
  ) {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    })
  }

  // ============================================
  // LOAD CONVERSATION
  // ============================================

  async function loadConversation() {
    const supabase = createClient()

    setLoading(true)
    setError('')

    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    // ============================================
    // LOAD MATCH
    // ============================================

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from('matches')
      .select(`
        id,
        user_1_id,
        user_2_id,
        status
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error(
        'Could not load match:',
        matchError
      )

      setError(
        'Could not load this conversation.'
      )

      setLoading(false)
      return
    }

    // ============================================
    // VERIFY USER IS IN MATCH
    // ============================================

    const isUserInMatch =
      match.user_1_id === user.id ||
      match.user_2_id === user.id

    if (!isUserInMatch) {
      setError(
        'You do not have access to this conversation.'
      )

      setLoading(false)
      return
    }

    // ============================================
    // FIND OTHER USER
    // ============================================

    const otherUserId =
      match.user_1_id === user.id
        ? match.user_2_id
        : match.user_1_id

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name
      `)
      .eq('id', otherUserId)
      .single()

    if (profileError) {
      console.error(
        'Could not load profile:',
        profileError
      )

      setError(
        'Could not load the other user.'
      )

      setLoading(false)
      return
    }

    setOtherUser(profile)

    // ============================================
    // LOAD MESSAGES
    // ============================================

    const {
      data: messageData,
      error: messagesError,
    } = await supabase
      .from('messages')
      .select(`
        id,
        match_id,
        sender_id,
        message,
        created_at,
        read_at
      `)
      .eq('match_id', matchId)
      .order('created_at', {
        ascending: true,
      })

    if (messagesError) {
      console.error(
        'Could not load messages:',
        messagesError
      )

      setError(
        'Could not load your messages.'
      )

      setLoading(false)
      return
    }

    setMessages(messageData || [])

    // ============================================
    // MARK OTHER USER'S MESSAGES AS READ
    // ============================================

    const unreadMessageIds =
      (messageData || [])
        .filter(
          (message) =>
            message.sender_id !== user.id &&
            !message.read_at
        )
        .map(
          (message) => message.id
        )

    if (unreadMessageIds.length > 0) {
      const readAt =
        new Date().toISOString()

      const {
        error: readError,
      } = await supabase
        .from('messages')
        .update({
          read_at: readAt,
        })
        .in(
          'id',
          unreadMessageIds
        )

      if (readError) {
        console.error(
          'Could not mark messages as read:',
          readError
        )
      } else {
        // Update local state immediately
        setMessages(
          (currentMessages) =>
            currentMessages.map(
              (message) =>
                unreadMessageIds.includes(
                  message.id
                )
                  ? {
                      ...message,
                      read_at: readAt,
                    }
                  : message
            )
        )
      }
    }

    setLoading(false)
  }

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    if (!matchId || Number.isNaN(matchId)) {
      setError(
        'Invalid conversation.'
      )

      setLoading(false)
      return
    }

    loadConversation()
  }, [matchId])

  // ============================================
  // AUTO-SCROLL WHEN MESSAGES CHANGE
  // ============================================

  useEffect(() => {
    if (loading) {
      return
    }

    const timeout =
      setTimeout(() => {
        scrollToBottom('smooth')
      }, 50)

    return () => {
      clearTimeout(timeout)
    }
  }, [messages, loading])

  // ============================================
  // REALTIME MESSAGE LISTENER
  // ============================================

  useEffect(() => {
    if (
      !matchId ||
      Number.isNaN(matchId) ||
      !currentUserId
    ) {
      return
    }

    const supabase = createClient()

    let isMounted = true

    console.log(
      `Starting realtime listener for match ${matchId}`
    )

    const channel =
      supabase
        .channel(
          `messages-match-${matchId}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          async (payload) => {

            console.log(
              'Realtime message received:',
              payload
            )

            if (!isMounted) {
              return
            }

            const newMessage =
              payload.new as Message

            // ========================================
            // PREVENT DUPLICATES
            // ========================================

            setMessages(
              (currentMessages) => {

                if (
                  currentMessages.some(
                    (message) =>
                      message.id ===
                      newMessage.id
                  )
                ) {
                  return currentMessages
                }

                return [
                  ...currentMessages,
                  newMessage,
                ]
              }
            )

            // ========================================
            // MARK OTHER USER'S MESSAGE AS READ
            // ========================================

            if (
              newMessage.sender_id !==
              currentUserId
            ) {

              const readAt =
                new Date().toISOString()

              const {
                error: readError,
              } = await supabase
                .from('messages')
                .update({
                  read_at: readAt,
                })
                .eq(
                  'id',
                  newMessage.id
                )

              if (readError) {
                console.error(
                  'Could not mark realtime message as read:',
                  readError
                )

                return
              }

              if (!isMounted) {
                return
              }

              // ======================================
              // UPDATE LOCAL MESSAGE
              // ======================================

              setMessages(
                (currentMessages) =>
                  currentMessages.map(
                    (message) =>
                      message.id ===
                      newMessage.id
                        ? {
                            ...message,
                            read_at:
                              readAt,
                          }
                        : message
                  )
              )

              console.log(
                'Realtime message marked as read'
              )
            }
          }
        )
        .subscribe(
          async (status) => {

            console.log(
              `Realtime status for match ${matchId}:`,
              status
            )

            if (status === 'SUBSCRIBED') {

              console.log(
                `Realtime successfully connected for match ${matchId}`
              )

              // ======================================
              // REFRESH MESSAGES AFTER SUBSCRIBING
              // ======================================
              //
              // This catches any message that may
              // have been inserted while the page
              // was loading or before Realtime
              // finished connecting.
              //
              // ======================================

              const {
                data: refreshedMessages,
                error: refreshError,
              } = await supabase
                .from('messages')
                .select(`
                  id,
                  match_id,
                  sender_id,
                  message,
                  created_at,
                  read_at
                `)
                .eq(
                  'match_id',
                  matchId
                )
                .order('created_at', {
                  ascending: true,
                })

              if (
                refreshError ||
                !refreshedMessages ||
                !isMounted
              ) {
                if (refreshError) {
                  console.error(
                    'Could not refresh messages after realtime connection:',
                    refreshError
                  )
                }

                return
              }

              // ======================================
              // MERGE REFRESHED MESSAGES
              // ======================================

              setMessages(
                (currentMessages) => {

                  const messageMap =
                    new Map<number, Message>()

                  currentMessages.forEach(
                    (message) => {
                      messageMap.set(
                        message.id,
                        message
                      )
                    }
                  )

                  refreshedMessages.forEach(
                    (message) => {
                      messageMap.set(
                        message.id,
                        message
                      )
                    }
                  )

                  return Array.from(
                    messageMap.values()
                  ).sort(
                    (a, b) =>
                      new Date(
                        a.created_at
                      ).getTime() -
                      new Date(
                        b.created_at
                      ).getTime()
                  )
                }
              )
            }

            if (
              status ===
              'CHANNEL_ERROR'
            ) {
              console.error(
                `Realtime channel error for match ${matchId}`
              )
            }

            if (
              status ===
              'TIMED_OUT'
            ) {
              console.error(
                `Realtime connection timed out for match ${matchId}`
              )
            }
          }
        )

    // ============================================
    // CLEANUP
    // ============================================

    return () => {

      isMounted = false

      console.log(
        `Removing realtime listener for match ${matchId}`
      )

      supabase.removeChannel(
        channel
      )
    }

  }, [matchId, currentUserId])

  // ============================================
  // SEND MESSAGE
  // ============================================

  async function sendMessage(
    event: FormEvent
  ) {
    event.preventDefault()

    const trimmedMessage =
      newMessage.trim()

    if (
      !trimmedMessage ||
      sending ||
      !currentUserId
    ) {
      return
    }

    const supabase = createClient()

    setSending(true)
    setError('')

    const {
      data: insertedMessage,
      error: sendError,
    } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUserId,
        message: trimmedMessage,
      })
      .select(`
        id,
        match_id,
        sender_id,
        message,
        created_at,
        read_at
      `)
      .single()

    if (sendError) {
      console.error(
        'Could not send message:',
        sendError
      )

      setError(
        'Could not send your message. Please try again.'
      )

      setSending(false)
      return
    }

    // ============================================
    // ADD MESSAGE LOCALLY
    // ============================================

    setMessages(
      (currentMessages) => {

        if (
          currentMessages.some(
            (message) =>
              message.id ===
              insertedMessage.id
          )
        ) {
          return currentMessages
        }

        return [
          ...currentMessages,
          insertedMessage,
        ]
      }
    )

    setNewMessage('')
    setSending(false)

    // ============================================
    // SCROLL TO NEW MESSAGE
    // ============================================

    setTimeout(() => {
      scrollToBottom('smooth')
    }, 50)
  }

  // ============================================
  // FORMAT MESSAGE TIME
  // ============================================

  function formatMessageTime(
    timestamp: string
  ) {
    const date =
      new Date(timestamp)

    const now =
      new Date()

    // ============================================
    // TODAY
    // ============================================

    const isToday =
      date.toDateString() ===
      now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )
    }

    // ============================================
    // YESTERDAY
    // ============================================

    const yesterday =
      new Date(now)

    yesterday.setDate(
      now.getDate() - 1
    )

    const isYesterday =
      date.toDateString() ===
      yesterday.toDateString()

    if (isYesterday) {
      return `Yesterday · ${date.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )}`
    }

    // ============================================
    // WITHIN LAST 7 DAYS
    // ============================================

    const sevenDaysAgo =
      new Date(now)

    sevenDaysAgo.setDate(
      now.getDate() - 7
    )

    if (date >= sevenDaysAgo) {
      return `${date.toLocaleDateString(
        [],
        {
          weekday: 'long',
        }
      )} · ${date.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      )}`
    }

    // ============================================
    // OLDER THAN 7 DAYS
    // ============================================

    return `${date.toLocaleDateString(
      [],
      {
        month: 'short',
        day: 'numeric',
      }
    )} · ${date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )}`
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            💬
          </div>

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading conversation...
          </p>

        </div>

      </main>
    )
  }

  // ============================================
  // NAME
  // ============================================

  const firstName =
    otherUser?.first_name ||
    'Unknown'

  const lastName =
    otherUser?.last_name ||
    ''

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase()

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push('/chats')
            }
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:bg-gray-100"
          >
            ←
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
            {initials}
          </div>

          <div className="min-w-0">

            <h1 className="truncate font-bold">
              {firstName} {lastName}
            </h1>

            <p className="text-xs text-gray-400">
              BrewLink connection
            </p>

          </div>

        </div>

      </header>

      {/* ======================================== */}
      {/* MESSAGES */}
      {/* ======================================== */}

      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-3xl flex-col px-5 pb-32 pt-6 sm:px-6">

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {messages.length === 0 ? (

          <div className="flex flex-1 items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                💬
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                Start the conversation
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                Send {firstName} a message and
                start getting to know your
                BrewLink connection.
              </p>

            </div>

          </div>

        ) : (

          <div className="flex flex-1 flex-col justify-end gap-3">

            {messages.map((message) => {

              const isMine =
                message.sender_id ===
                currentUserId

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isMine
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  <div
                    className={`max-w-[80%] sm:max-w-[65%] ${
                      isMine
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >

                    {/* MESSAGE BUBBLE */}

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isMine
                          ? 'rounded-br-md bg-black text-white'
                          : 'rounded-bl-md bg-white text-gray-900 shadow-sm'
                      }`}
                    >
                      {message.message}
                    </div>

                    {/* TIME + READ RECEIPT */}

                    <div
                      className={`mt-1 flex items-center gap-1 px-1 text-[10px] text-gray-400 ${
                        isMine
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >

                      <span>
                        {formatMessageTime(
                          message.created_at
                        )}
                      </span>

                      {isMine && (
                        <span
                          className={
                            message.read_at
                              ? 'font-bold text-black'
                              : 'text-gray-400'
                          }
                          title={
                            message.read_at
                              ? `Read ${formatMessageTime(
                                  message.read_at
                                )}`
                              : 'Sent'
                          }
                        >
                          {message.read_at
                            ? '✓✓'
                            : '✓'}
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              )
            })}

            {/* ================================== */}
            {/* SCROLL TARGET */}
            {/* ================================== */}

            <div
              ref={messagesEndRef}
              className="h-px"
              aria-hidden="true"
            />

          </div>

        )}

      </div>

      {/* ======================================== */}
      {/* MESSAGE INPUT */}
      {/* ======================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur">

        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-3xl items-end gap-3 px-5 py-4 sm:px-6"
        >

          <input
            type="text"
            value={newMessage}
            onChange={(event) =>
              setNewMessage(
                event.target.value
              )
            }
            placeholder={`Message ${firstName}...`}
            disabled={sending}
            className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
          />

          <button
            type="submit"
            disabled={
              sending ||
              !newMessage.trim()
            }
            className="rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending
              ? 'Sending...'
              : 'Send'}
          </button>

        </form>

      </div>

    </main>
  )
}