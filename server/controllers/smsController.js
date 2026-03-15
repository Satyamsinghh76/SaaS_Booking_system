const twilioService = require('../services/twilioService');
const logger = require('../config/logger');
const { query } = require('../config/database');

// ════════════════════════════════════════════════════════════
//  SMS CONTROLLERS
// ════════════════════════════════════════════════════════════

/**
 * POST /api/sms/send
 * Send SMS message to user
 */
const sendSMS = async (req, res, next) => {
  try {
    const { to, message, messageType = 'notification', bookingId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Send SMS
    const result = await twilioService.sendSMS(to, message, messageType, bookingId, userId);

    return res.json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'SMS sending failed',
      data: result.success ? {
        messageId: result.messageId,
        status: result.status
      } : null,
      error: result.success ? null : result.error
    });

  } catch (error) {
    logger.error('SMS send error', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/sms/booking/:bookingId/confirm
 * Send booking confirmation SMS
 */
const sendBookingConfirmation = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Get booking details with user info
    const { rows } = await query(
      `SELECT 
         b.id,
         b.booking_date,
         b.start_time,
         b.end_time,
         s.name as service_name,
         u.phone_number,
         u.name as user_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.user_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = rows[0];

    // Check user SMS preferences
    const preferences = await twilioService.getUserSMSPreferences(userId);
    if (!preferences?.enable_confirmations) {
      return res.json({
        success: false,
        message: 'User has disabled confirmation SMS'
      });
    }

    // Send confirmation SMS
    const result = await twilioService.sendBookingConfirmation(booking, {
      id: userId,
      phone_number: booking.phone_number,
      name: booking.user_name
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Confirmation SMS sent' : 'Failed to send confirmation SMS',
      data: result.success ? {
        messageId: result.messageId,
        phoneNumber: booking.phone_number
      } : null,
      error: result.success ? null : result.error
    });

  } catch (error) {
    logger.error('Booking confirmation SMS error', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/sms/booking/:bookingId/reminder
 * Send appointment reminder SMS
 */
const sendAppointmentReminder = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Get booking details
    const { rows } = await query(
      `SELECT 
         b.id,
         b.booking_date,
         b.start_time,
         b.end_time,
         s.name as service_name,
         u.phone_number,
         u.name as user_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.user_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = rows[0];

    // Check user SMS preferences
    const preferences = await twilioService.getUserSMSPreferences(userId);
    if (!preferences?.enable_reminders) {
      return res.json({
        success: false,
        message: 'User has disabled reminder SMS'
      });
    }

    // Send reminder SMS
    const result = await twilioService.sendAppointmentReminder(booking, {
      id: userId,
      phone_number: booking.phone_number,
      name: booking.user_name
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Reminder SMS sent' : 'Failed to send reminder SMS',
      data: result.success ? {
        messageId: result.messageId,
        phoneNumber: booking.phone_number
      } : null,
      error: result.success ? null : result.error
    });

  } catch (error) {
    logger.error('Appointment reminder SMS error', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/sms/booking/:bookingId/cancel
 * Send cancellation notice SMS
 */
const sendCancellationNotice = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Get booking details
    const { rows } = await query(
      `SELECT 
         b.id,
         b.booking_date,
         b.start_time,
         b.end_time,
         s.name as service_name,
         u.phone_number,
         u.name as user_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.user_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = rows[0];

    // Check user SMS preferences
    const preferences = await twilioService.getUserSMSPreferences(userId);
    if (!preferences?.enable_cancellations) {
      return res.json({
        success: false,
        message: 'User has disabled cancellation SMS'
      });
    }

    // Send cancellation SMS
    const result = await twilioService.sendCancellationNotice(booking, {
      id: userId,
      phone_number: booking.phone_number,
      name: booking.user_name
    });

    return res.json({
      success: result.success,
      message: result.success ? 'Cancellation SMS sent' : 'Failed to send cancellation SMS',
      data: result.success ? {
        messageId: result.messageId,
        phoneNumber: booking.phone_number
      } : null,
      error: result.success ? null : result.error
    });

  } catch (error) {
    logger.error('Cancellation notice SMS error', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/sms/preferences
 * Get user SMS preferences
 */
const getSMSPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const preferences = await twilioService.getUserSMSPreferences(userId);
    
    return res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    logger.error('Get SMS preferences error', { error: error.message });
    next(error);
  }
};

/**
 * PUT /api/sms/preferences
 * Update user SMS preferences
 */
const updateSMSPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enable_confirmations, enable_reminders, enable_cancellations } = req.body;

    const preferences = await twilioService.updateSMSPreferences(userId, {
      enable_confirmations: enable_confirmations !== false,
      enable_reminders: enable_reminders !== false,
      enable_cancellations: enable_cancellations !== false
    });

    return res.json({
      success: true,
      message: 'SMS preferences updated successfully',
      data: preferences
    });

  } catch (error) {
    logger.error('Update SMS preferences error', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/sms/logs
 * Get SMS logs for user
 */
const getSMSLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT
         id,
         booking_id,
         phone_number,
         message_type,
         message_content,
         status,
         error_message,
         sent_at,
         created_at
       FROM sms_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get total count
    const { rows: countRows } = await query(
      `SELECT COUNT(*) as total FROM sms_logs ${whereClause}`,
      params
    );

    return res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countRows[0].total),
          pages: Math.ceil(countRows[0].total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get SMS logs error', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/sms/webhook
 * Handle Twilio webhook for delivery status
 */
const handleWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    
    // Handle delivery status update
    const result = await twilioService.handleDeliveryStatus(webhookData);
    
    // Respond to Twilio immediately
    res.status(200).send('<Response></Response>');
    
    logger.info('Twilio webhook processed', {
      messageSid: webhookData.MessageSid,
      status: webhookData.MessageStatus
    });

  } catch (error) {
    logger.error('Twilio webhook error', { error: error.message });
    res.status(500).send('Error processing webhook');
  }
};

/**
 * GET /api/sms/status/:messageId
 * Get SMS delivery status
 */
const getMessageStatus = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    
    const status = await twilioService.getMessageStatus(messageId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Get message status error', { error: error.message });
    next(error);
  }
};

module.exports = {
  sendSMS,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationNotice,
  getSMSPreferences,
  updateSMSPreferences,
  getSMSLogs,
  handleWebhook,
  getMessageStatus,
};
