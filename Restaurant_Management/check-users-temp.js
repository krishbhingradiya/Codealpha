const path = require('path');
const workspaceDir = 'c:/Users/JBC/Desktop/Hotel Management';
require('dotenv').config({ path: path.join(workspaceDir, '.env') });
const { createClient } = require(path.join(workspaceDir, 'node_modules/@supabase/supabase-js'));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkNewUser() {
  const email = 'krishbhingradiya19@gmail.com';
  console.log(`Checking details for ${email}...`);
  
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user) {
    console.log('User not found.');
    return;
  }
  console.log('User:', user);
  
  const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', user.id);
  console.log('Orders found:', orders.length, orders);
  
  const { data: coupons } = await supabase.from('coupons').select('*').eq('customer_email', email);
  console.log('Coupons found:', coupons);
}

checkNewUser().catch(console.error);
