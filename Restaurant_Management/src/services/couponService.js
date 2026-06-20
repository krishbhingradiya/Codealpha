const supabase = require('../config/supabase');
const { logActivity } = require('./notificationService');

class CouponService {
  // Generate first-order coupon if the customer is new (0 orders placed)
  async checkAndGenerateFirstOrderCoupon(user) {
    if (!user || user.role !== 'customer') return null;

    try {
      // 1. Check if user has ever placed an order
      const { data: orders, error: orderErr } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', user.id)
        .limit(1);

      if (orderErr) throw orderErr;

      // If user has orders, they are not a new customer
      if (orders && orders.length > 0) return null;

      // 2. Check if a WELCOME20 coupon already exists for this email
      const { data: existingCoupon, error: couponErr } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', 'WELCOME20')
        .eq('customer_email', user.email)
        .maybeSingle();

      if (couponErr) throw couponErr;

      // If coupon already exists, return it
      if (existingCoupon) return existingCoupon;

      // 3. Create the coupon
      const { data: newCoupon, error: createErr } = await supabase
        .from('coupons')
        .insert([{
          code: 'WELCOME20',
          customer_email: user.email,
          discount_percent: 20,
          max_discount: 200.00,
          min_order: 299.00,
          used: false,
          disabled: false
        }])
        .select()
        .single();

      if (createErr) throw createErr;

      // Log the coupon generation
      await logActivity(user.id, 'Coupon Generated', `Coupon WELCOME20 generated for ${user.email}`);

      return newCoupon;
    } catch (err) {
      console.error('Error generating first-order coupon:', err);
      return null;
    }
  }

  // Validate coupon details
  async validateCoupon(code, email, orderAmount) {
    if (!code || !email) {
      throw new Error('Coupon code and email are required');
    }

    const formattedCode = code.trim().toUpperCase();

    let { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', formattedCode)
      .eq('customer_email', email)
      .maybeSingle();

    if (error) throw error;

    // Fallback: If WELCOME20 coupon doesn't exist yet, check if the customer is eligible (0 orders)
    // and generate it on-the-fly to prevent any session/popup skip issues.
    if (!coupon && formattedCode === 'WELCOME20') {
      try {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (user && user.role === 'customer') {
          const newCoupon = await this.checkAndGenerateFirstOrderCoupon(user);
          if (newCoupon) {
            coupon = newCoupon;
          }
        }
      } catch (err) {
        console.error('Error on-the-fly welcome coupon generation:', err);
      }
    }

    if (!coupon) {
      throw new Error('Coupon code is invalid or does not belong to you');
    }
    if (coupon.disabled) {
      throw new Error('This coupon has been disabled by the administrator');
    }
    if (coupon.used) {
      throw new Error('This coupon has already been used');
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      await logActivity(null, 'Coupon Expired', `Coupon ${coupon.code} for ${email} has expired`);
      throw new Error('This coupon has expired');
    }
    if (parseFloat(orderAmount) < parseFloat(coupon.min_order)) {
      throw new Error(`Minimum order of ₹${coupon.min_order} required to use this coupon`);
    }

    // Calculate discount amount
    const discount = Math.min(
      parseFloat(orderAmount) * (parseFloat(coupon.discount_percent) / 100),
      parseFloat(coupon.max_discount)
    );

    return { coupon, discount };
  }

  // Apply coupon to an order
  async applyCoupon(code, orderId, userId, email, orderAmount) {
    const { coupon, discount } = await this.validateCoupon(code, email, orderAmount);

    // 1. Mark coupon as used
    const { error: updateErr } = await supabase
      .from('coupons')
      .update({ used: true })
      .eq('id', coupon.id);

    if (updateErr) throw updateErr;

    // 2. Insert coupon usage log
    const { error: usageErr } = await supabase
      .from('coupon_usage')
      .insert([{
        coupon_id: coupon.id,
        order_id: orderId,
        customer_id: userId,
        discount_amount: discount
      }]);

    if (usageErr) throw usageErr;

    // 3. Log activity
    await logActivity(userId, 'Coupon Applied', `Coupon ${code} applied to order ID ${orderId} (Discount: ₹${discount})`);

    return discount;
  }

  // Get Admin analytics and list
  async getAdminStats() {
    // 1. Total created
    const { data: allCoupons } = await supabase.from('coupons').select('id, used, disabled');
    const totalCreated = (allCoupons || []).length;
    const activeCount = (allCoupons || []).filter(c => !c.used && !c.disabled).length;
    const usedCount = (allCoupons || []).filter(c => c.used).length;

    // 2. Total discount given
    const { data: usage } = await supabase.from('coupon_usage').select('discount_amount');
    const totalDiscountGiven = (usage || []).reduce((sum, u) => sum + parseFloat(u.discount_amount || 0), 0);

    return {
      totalCreated,
      activeCount,
      usedCount,
      totalDiscountGiven
    };
  }

  // Get all coupons list
  async getAllCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Get coupon usage logs
  async getCouponUsageLogs() {
    const { data, error } = await supabase
      .from('coupon_usage')
      .select('*, coupons(code), users(name, email), orders(order_number)')
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Create custom coupon
  async createCoupon({ code, customer_email, discount_percent, max_discount, min_order, expires_at }) {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code: code.trim().toUpperCase(),
        customer_email: customer_email.trim(),
        discount_percent: parseInt(discount_percent),
        max_discount: parseFloat(max_discount) || 200.00,
        min_order: parseFloat(min_order) || 299.00,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        used: false,
        disabled: false
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This user already has a coupon with this code');
      }
      throw error;
    }
    return data;
  }

  // Toggle disabled status
  async toggleCoupon(id) {
    const { data: current } = await supabase
      .from('coupons')
      .select('disabled')
      .eq('id', id)
      .single();

    if (!current) throw new Error('Coupon not found');

    const { data, error } = await supabase
      .from('coupons')
      .update({ disabled: !current.disabled })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new CouponService();
