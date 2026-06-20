const couponService = require('../services/couponService');
const supabase = require('../config/supabase');

class CouponController {
  // Check welcome popup eligibility
  async checkWelcomePopup(req, res) {
    try {
      // If customer is not logged in (guest), show welcome popup to encourage them
      if (!req.session || !req.session.user) {
        return res.json({ showPopup: true, couponCode: 'WELCOME20' });
      }

      const user = req.session.user;

      // Only show to customers
      if (user.role !== 'customer') {
        return res.json({ showPopup: false });
      }

      // Try to generate the coupon automatically if they are eligible
      await couponService.checkAndGenerateFirstOrderCoupon(user);

      // Check if they have an unused WELCOME20 coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('id, used, disabled')
        .eq('code', 'WELCOME20')
        .eq('customer_email', user.email)
        .maybeSingle();

      if (error) throw error;

      if (coupon && !coupon.used && !coupon.disabled) {
        return res.json({ showPopup: true, couponCode: 'WELCOME20' });
      }

      return res.json({ showPopup: false });
    } catch (err) {
      console.error('Error checking welcome popup eligibility:', err);
      return res.status(500).json({ error: 'Failed to verify popup eligibility' });
    }
  }

  // Validate coupon code during checkout (API endpoint)
  async validateCouponCode(req, res) {
    try {
      const { code, orderAmount } = req.body;
      
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required to apply coupons' });
      }

      if (req.session.user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can apply coupons' });
      }

      if (!code) {
        return res.status(400).json({ error: 'Coupon code is required' });
      }

      const parsedAmount = parseFloat(orderAmount) || 0;
      const { coupon, discount } = await couponService.validateCoupon(code, req.session.user.email, parsedAmount);

      return res.json({
        success: true,
        couponCode: coupon.code,
        discountPercent: coupon.discount_percent,
        maxDiscount: coupon.max_discount,
        minOrder: coupon.min_order,
        discountAmount: discount,
        finalAmount: Math.max(0, parsedAmount - discount)
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message || 'Invalid coupon' });
    }
  }
}

module.exports = new CouponController();
