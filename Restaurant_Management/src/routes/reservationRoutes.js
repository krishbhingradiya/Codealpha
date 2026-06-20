const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');
const { validateReservation } = require('../middlewares/validator');

// Customer routes
router.get('/reservations/new', isAuthenticated, reservationController.showReservationForm);
router.post('/reservations', isAuthenticated, validateReservation, reservationController.createReservation);
router.get('/profile/reservations', isAuthenticated, reservationController.showMyReservations);

// Manager routes
router.get('/manager/reservations', isAuthenticated, requireRole('manager', 'admin'), reservationController.showAllReservations);
router.post('/manager/reservations/:id/status', isAuthenticated, requireRole('manager', 'admin'), reservationController.updateStatus);

module.exports = router;
