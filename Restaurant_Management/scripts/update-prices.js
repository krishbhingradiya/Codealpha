/**
 * Update menu prices to Indian Rupees in the live Supabase database
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const priceUpdates = {
  'Margherita Pizza': 149,
  'Pepperoni Pizza': 199,
  'BBQ Chicken Pizza': 229,
  'Classic Burger': 149,
  'Cheese Burger': 179,
  'Veggie Burger': 159,
  'Spaghetti Bolognese': 199,
  'Fettuccine Alfredo': 179,
  'Penne Arrabbiata': 149,
  'Club Sandwich': 149,
  'Grilled Chicken Sandwich': 179,
  'Coca Cola': 49,
  'Fresh Orange Juice': 79,
  'Iced Lemonade': 69,
  'Espresso': 79,
  'Cappuccino': 99,
  'Latte': 119,
  'Chocolate Cake': 199,
  'Tiramisu': 229,
  'Cheesecake': 199,
};

async function updatePrices() {
  console.log('💰 Updating menu prices to Indian Rupees...\n');
  let success = 0;
  let failed = 0;

  for (const [name, price] of Object.entries(priceUpdates)) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ price })
      .eq('name', name)
      .select('id, name, price');

    if (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      failed++;
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${name}: ₹${price}`);
      success++;
    } else {
      console.log(`  ⚠️  ${name}: not found`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${success} updated, ${failed} failed`);
}

updatePrices().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
