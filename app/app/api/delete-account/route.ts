import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: corsHeaders,
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,
      headers: corsHeaders,
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse(
        {
          error: 'Unauthorized.',
        },
        401
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

      return jsonResponse(
        {
          error: 'Server configuration error.',
        },
        500
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

      return jsonResponse(
        {
          error: 'Unauthorized.',
        },
        401
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

      return jsonResponse(
        {
          error:
            'Could not delete your account.',
        },
        500
      )
    }

    return jsonResponse({
      success: true,
    })
  } catch (error) {
    console.error(
      'Unexpected account deletion error:',
      error
    )

    return jsonResponse(
      {
        error:
          'Something went wrong while deleting your account.',
      },
      500
    )
  }
}