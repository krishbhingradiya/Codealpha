#!/usr/bin/env node
/**
 * Add real food photos to all menu items using Unsplash image URLs
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const imageMap = {
  'Margherita Pizza':         'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
  'Pepperoni Pizza':          'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
  'BBQ Chicken Pizza':        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'Classic Burger':           'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  'Cheese Burger':            'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
  'Veggie Burger':            'https://images.unsplash.com/photo-1520072959219-c595e6cdc07a?w=400&h=300&fit=crop',
  'Spaghetti Bolognese':      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
  'Fettuccine Alfredo':       'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&fit=crop',
  'Penne Arrabbiata':         'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop',
  'Club Sandwich':            'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
  'Grilled Chicken Sandwich': 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=400&h=300&fit=crop',
  'Coca Cola':                'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
  'Fresh Orange Juice':       'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop',
  'Iced Lemonade':            'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&h=300&fit=crop',
  'Espresso':                 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop',
  'Cappuccino':               'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
  'Latte':                    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  'Chocolate Cake':           'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  'Tiramisu':                 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
  'Cheesecake':               'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop',
};

async function addImages() {
  console.log('🖼️  Adding photos to menu items...\n');

  let success = 0;
  let failed = 0;

  for (const [name, url] of Object.entries(imageMap)) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ image_url: url })
      .eq('name', name)
      .select('id, name');

    if (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      failed++;
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${name}`);
      success++;
    } else {
      console.log(`  ⚠️  ${name}: not found in database`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${success} updated, ${failed} failed`);
}

addImages().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
