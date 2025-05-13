// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// serve(async (req) => {
//   try {
//     // Create Supabase admin client
//     const supabase = createClient(
      // Deno.env.get('SUPABASE_URL') ?? '',
      // Deno.env.get('SUPABASE_ANON_KEY') ?? '',
//     )

//     // 1. Get latest submission timestamp
//     const { data: latestSubmission, error: latestError } = await supabase
//       .from('pending_submissions')
//       .select('submitted_at')
//       .order('submitted_at', { ascending: false })
//       .limit(1)
//       .single()

//     if (latestError) throw latestError

//     // 2. Fetch from Google Sheets
//     const sheetId = '1irB6iVfprUHA200qAYSE3saKDf6j_P3xCnB_o5GXkVk'
//     const sheetName = 'Form Responses 1'
//     const response = await fetch(`https://opensheet.elk.sh/${sheetId}/${sheetName}`)
    
//     if (!response.ok) throw new Error('Failed to fetch Google Sheets data')
    
//     const formData = await response.json()

//     // 3. Date parsing function
//     const parseCustomDate = (dateString: string) => {
//       const [day, month, year] = dateString.split(' ')[0].split('/')
//       return new Date(`${year}-${month}-${day}T${dateString.split(' ')[1]}`)
//     }

//     // 4. Process submissions
//     const newSubmissions = formData
//       .filter(item => {
//         if (!item.Timestamp) return false
        
//         const submissionTime = parseCustomDate(item.Timestamp)
//         const lastDbTime = latestSubmission?.submitted_at ? new Date(latestSubmission.submitted_at) : null
        
//         return !lastDbTime || submissionTime > lastDbTime
//       })
//       .map(item => ({
//         station_name: item['Station Name']?.trim() || '',
//         station_location: item['Location']?.trim() || '',
//         petrol_price: parseFloat(item['Petrol Price']) || null,
//         diesel_price: parseFloat(item['Diesel Price']) || null,
//         kerosene_price: parseFloat(item['Kerosene Price']) || null,
//         submitted_by: item['Email']?.trim() || 'anonymous',
//         status: 'pending',
//         submitted_at: item.Timestamp ? parseCustomDate(item.Timestamp).toISOString() : new Date().toISOString()
//       }))

//     // 5. Insert new submissions
//     if (newSubmissions.length > 0) {
//       const { data, error } = await supabase
//         .from('pending_submissions')
//         .insert(newSubmissions)
//         .select()

//       if (error) throw error

//       return new Response(JSON.stringify({
//         success: true,
//         inserted_count: data.length,
//         first_record: data[0]
//       }), {
//         headers: { 'Content-Type': 'application/json' }
//       })
//     }

//     return new Response(JSON.stringify({
//       success: true,
//       message: 'No new submissions found'
//     }), {
//       headers: { 'Content-Type': 'application/json' }
//     })

//   } catch (error) {
//     return new Response(JSON.stringify({
//       success: false,
//       error: error.message
//     }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     })
//   }
// })

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabase = createClient(
      // Deno.env.get('SUPABASE_URL')!,
      // Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // [Keep your existing function logic here...]

    return new Response(JSON.stringify({
      success: true,
      inserted_count: data?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})