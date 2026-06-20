const reservationService = require('../services/reservationService');
const tableService = require('../services/tableService');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../services/notificationService');

class ReservationController {
  // CUSTOMER: Show reservation page
  async showReservationForm(req, res) {
    try {
      const tables = await tableService.getAllTables();
      
      res.render('customer/reservations', {
        title: 'Make a Reservation',
        tables,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load reservation form');
      res.redirect('/');
    }
  }

  // CUSTOMER: Create reservation
  async createReservation(req, res) {
    try {
      const { table_id, reservation_date, reservation_time, guests, notes } = req.body;
      
      const reservation = await reservationService.createReservation(req.session.user.id, {
        table_id, reservation_date, reservation_time, guests, notes
      });

      // Notify managers
      await notificationService.notifyManagers({
        title: 'New Reservation',
        message: `Reservation for ${guests} guests on ${reservation_date} at ${reservation_time}`,
        type: 'reservation'
      });

      await logActivity(req.session.user.id, 'Created a reservation');

      if (req.path.startsWith('/api/')) {
        return res.status(201).json(reservation);
      }

      req.flash('success', 'Reservation submitted successfully! Waiting for confirmation.');
      res.redirect('/profile/reservations');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to create reservation');
      res.redirect('/reservations/new');
    }
  }

  // CUSTOMER: View my reservations
  async showMyReservations(req, res) {
    try {
      const reservations = await reservationService.getCustomerReservations(req.session.user.id);
      
      res.render('customer/reservations', {
        title: 'My Reservations',
        reservations,
        tables: await tableService.getAllTables(),
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load reservations');
      res.redirect('/');
    }
  }

  // MANAGER: View all reservations
  async showAllReservations(req, res) {
    try {
      const filters = {
        status: req.query.status || null,
        date: req.query.date || null
      };
      
      const reservations = await reservationService.getAllReservations(filters);
      
      res.render('manager/reservations', {
        title: 'Manage Reservations',
        reservations,
        currentStatus: req.query.status || 'all',
        currentDate: req.query.date || '',
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load reservations');
      res.redirect('/manager');
    }
  }

  // MANAGER: Update reservation status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const reservation = await reservationService.updateStatus(req.params.id, status);

      // Notify customer
      if (reservation.customer_id) {
        const statusMessages = {
          confirmed: 'Your reservation has been confirmed!',
          cancelled: 'Your reservation has been cancelled.',
          completed: 'Your reservation is marked as completed. Thank you!'
        };
        
        if (statusMessages[status]) {
          await notificationService.notifyCustomer(reservation.customer_id, {
            title: 'Reservation Update',
            message: statusMessages[status],
            type: 'reservation'
          });
        }
      }

      if (req.session.user) {
        await logActivity(req.session.user.id, `Updated reservation status to ${status}`);
      }

      if (req.path.startsWith('/api/')) {
        return res.json(reservation);
      }

      req.flash('success', `Reservation ${status}`);
      res.redirect('/manager/reservations');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to update reservation');
      res.redirect('/manager/reservations');
    }
  }

  // API
  async apiGetAll(req, res) {
    try {
      const reservations = await reservationService.getAllReservations(req.query);
      res.json(reservations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ReservationController();
