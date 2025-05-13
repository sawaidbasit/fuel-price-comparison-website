import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Parse request body
    const body = await req.json()
    
    // Validate required fields
    if (!body.station_name || !body.station_location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Insert into submissions table
    const { data, error } = await supabaseClient
      .from('submissions')
      .insert([{
        station_name: body.station_name,
        station_location: body.station_location,
        petrol_price: body.petrol_price,
        diesel_price: body.diesel_price,
        kerosene_price: body.kerosene_price,
        submitted_by: body.email || 'anonymous',
        status: 'pending'
      }])
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify(data), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})