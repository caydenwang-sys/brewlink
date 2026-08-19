import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Unauthorized.',
        },
        {
          status: 401,
        }
      )
    }

    const accessToken = authorization.replace('Bearer ', '')

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        'Missing Supabase environment variables.'
      )

      return NextResponse.json(
        {
          error: 'Server configuration error.',
        },
        {
          status: 500,
        }
      )
    }

    // ==========================================
    // VERIFY THE LOGGED-IN USER
    // ==========================================

    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(
      accessToken
    )

    if (userError || !user) {
      console.error(
        'Could not verify user:',
        userError
      )

      return NextResponse.json(
        {
          error: 'Unauthorized.',
        },
        {
          status: 401,
        }
      )
    }

    // ==========================================
    // CREATE SERVER-ONLY ADMIN CLIENT
    // ==========================================

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // ==========================================
    // DELETE THE VERIFIED USER
    // ==========================================

    const {
      error: deleteError,
    } =
      await adminClient.auth.admin.deleteUser(
        user.id
      )

    if (deleteError) {
      console.error(
        'Could not delete account:',
        deleteError
      )

      return NextResponse.json(
        {
          error:
            'Could not delete your account.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Unexpected account deletion error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Something went wrong while deleting your account.',
      },
      {
        status: 500,
      }
    )
  }
}