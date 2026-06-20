// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({ errors });
    }
    req.flash('error', errors.join('. '));
    return res.redirect('back');
  }

  next();
};

const validateMenuItem = (req, res, next) => {
  const { name, price } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Item name is required');
  }

  if (!price || isNaN(price) || parseFloat(price) <= 0) {
    errors.push('Price must be a positive number');
  }

  if (errors.length > 0) {
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({ errors });
    }
    req.flash('error', errors.join('. '));
    return res.redirect('back');
  }

  next();
};

const validateReservation = (req, res, next) => {
  const { reservation_date, reservation_time, guests } = req.body;
  const errors = [];

  if (!reservation_date) errors.push('Date is required');
  if (!reservation_time) errors.push('Time is required');
  if (!guests || parseInt(guests) < 1) errors.push('Number of guests must be at least 1');

  if (reservation_date) {
    const selectedDate = new Date(reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.push('Reservation date cannot be in the past');
    }
  }

  if (errors.length > 0) {
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({ errors });
    }
    req.flash('error', errors.join('. '));
    return res.redirect('back');
  }

  next();
};

module.exports = { validateRegistration, validateMenuItem, validateReservation };
