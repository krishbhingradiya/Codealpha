const authService = require('../services/authService');
const orderService = require('../services/orderService');
const reservationService = require('../services/reservationService');

class CustomerController {
  // Show profile
  async showProfile(req, res) {
    try {
      const user = await authService.findById(req.session.user.id);
      const allOrders = await orderService.getCustomerOrders(req.session.user.id);
      const reservations = await reservationService.getCustomerReservations(req.session.user.id);
      
      const stats = {
        totalOrders: allOrders.length,
        savingsEarned: allOrders.reduce((sum, o) => sum + parseFloat(o.discount_amount || 0), 0),
        couponsUsed: allOrders.filter(o => o.coupon_code).length
      };
      
      res.render('customer/profile', {
        title: 'My Profile',
        profile: user,
        recentOrders: allOrders.slice(0, 5),
        reservations: reservations.slice(0, 5),
        stats,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load profile');
      res.redirect('/');
    }
  }

  // Update profile
  async updateProfile(req, res) {
    try {
      const { name, mobile } = req.body;
      const updated = await authService.updateProfile(req.session.user.id, { name, mobile });
      
      // Update session
      req.session.user = { ...req.session.user, name: updated.name, mobile: updated.mobile };

      req.flash('success', 'Profile updated successfully');
      res.redirect('/profile');
    } catch (err) {
      req.flash('error', err.message || 'Failed to update profile');
      res.redirect('/profile');
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (newPassword !== confirmPassword) {
        req.flash('error', 'New passwords do not match');
        return res.redirect('/profile');
      }

      if (newPassword.length < 6) {
        req.flash('error', 'New password must be at least 6 characters');
        return res.redirect('/profile');
      }

      await authService.changePassword(req.session.user.id, currentPassword, newPassword);
      
      req.flash('success', 'Password changed successfully');
      res.redirect('/profile');
    } catch (err) {
      req.flash('error', err.message || 'Failed to change password');
      res.redirect('/profile');
    }
  }
}

module.exports = new CustomerController();
