const notificationService = require('../services/notificationService');

class NotificationController {
  // Show notifications page
  async showNotifications(req, res) {
    try {
      const notifications = await notificationService.getUserNotifications(req.session.user.id, 50);
      
      res.render('manager/notifications', {
        title: 'Notifications',
        notifications,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load notifications');
      res.redirect('/manager');
    }
  }

  // Mark as read
  async markAsRead(req, res) {
    try {
      await notificationService.markAsRead(req.params.id);
      
      if (req.path.startsWith('/api/')) {
        return res.json({ success: true });
      }
      res.redirect('back');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      res.redirect('back');
    }
  }

  // Mark all as read
  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.session.user.id);
      
      if (req.path.startsWith('/api/')) {
        return res.json({ success: true });
      }
      req.flash('success', 'All notifications marked as read');
      res.redirect('back');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      res.redirect('back');
    }
  }

  // API: Get notifications
  async apiGetNotifications(req, res) {
    try {
      const notifications = await notificationService.getUserNotifications(req.session.user.id);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // API: Get unread count
  async apiGetUnreadCount(req, res) {
    try {
      const count = await notificationService.getUnreadCount(req.session.user.id);
      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new NotificationController();
