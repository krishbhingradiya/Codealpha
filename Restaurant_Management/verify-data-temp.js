const path = require('path');
const workspaceDir = 'c:/Users/JBC/Desktop/Hotel Management';
require('dotenv').config({ path: path.join(workspaceDir, '.env') });
const { createClient } = require(path.join(workspaceDir, 'node_modules/@supabase/supabase-js'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking coupons...');
  const { data: coupons } = await supabase.from('coupons').select('*');
  console.table(coupons);
}

check().catch(console.error);
