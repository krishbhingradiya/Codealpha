/**
 * ============================================
 * ShortLink Pro — Supabase Database Client
 * ============================================
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Test database connectivity at startup.
 */
async function testConnection() {
  try {
    const { data, error } = await supabase.from('urls').select('id').limit(1);

    if (error) {
      const isTableMissing =
        error.code === '42P01' ||
        (error.message && error.message.toLowerCase().includes('schema cache')) ||
        (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('does not exist')) ||
        error.code === 'PGRST204';

      if (isTableMissing) {
        console.warn('⚠️  Table "urls" does not exist yet. Run the SQL setup script.');
        console.warn('   See: database/setup.sql');
        return true;
      }
      throw error;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return false;
  }
}

module.exports = { supabase, testConnection };
