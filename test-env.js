// Test script to verify environment variables
console.log('=== Environment Variables Test ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

// Test Supabase connection
try {
  require('dotenv').config({ path: '.env.local' });
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test connection (this might fail if RLS is enabled, but that's expected)
    supabase.from('quotations').select('count').then(({ data, error }) => {
      if (error && error.code === '42501') {
        console.log('✅ Supabase connection works (RLS policy blocks access - this is normal)');
      } else if (data) {
        console.log('✅ Supabase connection and query successful');
      } else if (error) {
        console.log('⚠️ Supabase connection issue:', error.message);
      }
    }).catch(err => {
      console.log('⚠️ Connection test error:', err.message);
    });
  } else {
    console.log('❌ Cannot create Supabase client - missing URL or Key');
  }
  
} catch (error) {
  console.log('❌ Error testing Supabase:', error.message);
  console.log('Try: npm install dotenv @supabase/supabase-js');
} 