const adminService = require('../services/adminService');
const reportService = require('../services/reportService');
const { logActivity } = require('../services/notificationService');

class AdminController {
  // Show admin dashboard
  async showDashboard(req, res) {
    try {
      const stats = await adminService.getSystemStats();
      
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load admin dashboard');
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats: { totalUsers: 0, customers: 0, managers: 0, admins: 0, totalOrders: 0, totalRevenue: 0, totalReservations: 0, totalMenuItems: 0 },
        layout: 'layouts/main'
      });
    }
  }

  // Show users management
  async showUsers(req, res) {
    try {
      const filters = {
        role: req.query.role || null,
        search: req.query.search || null
      };
      const users = await adminService.getAllUsers(filters);
      
      res.render('admin/users', {
        title: 'Manage Users',
        users,
        currentRole: req.query.role || 'all',
        searchQuery: req.query.search || '',
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load users');
      res.redirect('/admin');
    }
  }

  // Update user role
  async updateRole(req, res) {
    try {
      const { role } = req.body;
      const user = await adminService.updateUserRole(req.params.id, role);

      await logActivity(req.session.user.id, `Changed ${user.name}'s role to ${role}`);

      if (req.path.startsWith('/api/')) {
        return res.json(user);
      }

      req.flash('success', `${user.name}'s role updated to ${role}`);
      res.redirect('/admin/users');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to update user role');
      res.redirect('/admin/users');
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      // Prevent self-deletion
      if (req.params.id === req.session.user.id) {
        req.flash('error', 'You cannot delete your own account');
        return res.redirect('/admin/users');
      }

      await adminService.deleteUser(req.params.id);
      await logActivity(req.session.user.id, 'Deleted a user');

      req.flash('success', 'User deleted');
      res.redirect('/admin/users');
    } catch (err) {
      req.flash('error', 'Failed to delete user');
      res.redirect('/admin/users');
    }
  }

  // Show activity logs
  async showActivityLogs(req, res) {
    try {
      const logs = await adminService.getActivityLogs(100);
      
      res.render('admin/activity-logs', {
        title: 'Activity Logs',
        logs,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load activity logs');
      res.redirect('/admin');
    }
  }

  // API: Get users
  async apiGetUsers(req, res) {
    try {
      const users = await adminService.getAllUsers(req.query);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // ADMIN: Show coupons page
  async showCoupons(req, res) {
    try {
      const couponService = require('../services/couponService');
      const stats = await couponService.getAdminStats();
      const coupons = await couponService.getAllCoupons();
      const usageLogs = await couponService.getCouponUsageLogs();

      res.render('admin/coupons', {
        title: 'Manage Coupons',
        stats,
        coupons,
        usageLogs,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Error loading coupons page:', err);
      req.flash('error', 'Failed to load coupon management');
      res.redirect('/admin');
    }
  }

  // ADMIN: Create custom coupon
  async createCoupon(req, res) {
    try {
      const couponService = require('../services/couponService');
      const { code, customer_email, discount_percent, max_discount, min_order, expires_at } = req.body;

      if (!code || !customer_email || !discount_percent) {
        req.flash('error', 'Code, email and discount percent are required');
        return res.redirect('/admin/coupons');
      }

      await couponService.createCoupon({
        code,
        customer_email,
        discount_percent,
        max_discount,
        min_order,
        expires_at
      });

      await logActivity(req.session.user.id, 'Coupon Created', `Created coupon ${code} for ${customer_email}`);
      req.flash('success', `Coupon ${code.toUpperCase()} created successfully`);
      res.redirect('/admin/coupons');
    } catch (err) {
      console.error('Error creating coupon:', err);
      req.flash('error', err.message || 'Failed to create coupon');
      res.redirect('/admin/coupons');
    }
  }

  // ADMIN: Toggle coupon status
  async toggleCoupon(req, res) {
    try {
      const couponService = require('../services/couponService');
      const coupon = await couponService.toggleCoupon(req.params.id);

      await logActivity(
        req.session.user.id, 
        coupon.disabled ? 'Coupon Disabled' : 'Coupon Enabled', 
        `Toggled status of coupon ${coupon.code} for ${coupon.customer_email}`
      );

      req.flash('success', `Coupon ${coupon.code} has been ${coupon.disabled ? 'disabled' : 'enabled'}`);
      res.redirect('/admin/coupons');
    } catch (err) {
      console.error('Error toggling coupon:', err);
      req.flash('error', 'Failed to update coupon status');
      res.redirect('/admin/coupons');
    }
  }
}

module.exports = new AdminController();
