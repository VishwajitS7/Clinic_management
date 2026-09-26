const express = require('express');
const {
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { validateScheduleInput } = require('../validators/scheduleValidators');

const router = express.Router();

// Guard all schedule endpoints with authentication
router.use(authenticateUser);

router
  .route('/:id')
  .put(authorizeRoles('ADMIN', 'DOCTOR'), validateScheduleInput, updateSchedule)
  .delete(authorizeRoles('ADMIN', 'DOCTOR'), deleteSchedule);

module.exports = router;
