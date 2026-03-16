const twilio = require('twilio');
const logger = require('../config/logger');
const { query } = require('../config/database');

// Twilio client — only initialized when real credentials are present
const hasTwilioCredentials =
  process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_AUTH_TOKEN !== 'your_twilio_token';

const twilioClient = hasTwilioCredentials
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// SMS Templates
const TEMPLATES = {
  confirmation: process.env.SMS_CONFIRMATION_TEMPLATE || 
    'Your booking for {service} on {date} at {time} is confirmed!',
  
  reminder: process.env.SMS_REMINDER_TEMPLATE || 
    'Reminder: Your {service} appointment is tomorrow at {time}. Reply STOP to unsubscribe.',
  
  cancellation: process.env.SMS_CANCELLATION_TEMPLATE || 
    'Your booking has been cancelled. We\'ll miss you!',
  
  rescheduled: 'Your {service} appointment has been rescheduled to {date} at {time}.',
  
  payment_confirmation: 'Payment of ${amount} received for your {service} booking on {date}.',
};

class TwilioService {
  
  /**
   * Send SMS message
   */
  async sendSMS(to, message, messageType = 'notification', bookingId = null, userId = null) {
    if (!twilioClient) {
      logger.warn('Twilio not configured — SMS skipped', { to, messageType });
      return { success: false, error: 'SMS service not configured' };
    }
    let logId;
    try {
      // Validate phone number format
      const formattedPhone = this.formatPhoneNumber(to);

      // Log SMS attempt
      logId = await this.logSMS({
        user_id: userId,
        booking_id: bookingId,
        phone_number: formattedPhone,
        message_type: messageType,
        message_content: message,
        status: 'pending'
      });

      // Send SMS via Twilio
      const twilioMessage = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      // Update log with Twilio SID
      await this.updateSMSLog(logId, {
        twilio_sid: twilioMessage.sid,
        status: 'sent',
        sent_at: new Date()
      });

      logger.info('SMS sent successfully', {
        messageId: twilioMessage.sid,
        to: formattedPhone,
        type: messageType,
        bookingId
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        status: 'sent'
      };

    } catch (error) {
      logger.error('SMS sending failed', {
        error: error.message,
        to,
        messageType,
        bookingId
      });

      // Update log with error
      if (logId) {
        await this.updateSMSLog(logId, {
          status: 'failed',
          error_message: error.message
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format phone number for Twilio
   */
  formatPhoneNumber(phone) {
    const trimmed = phone.trim();

    // Already in E.164 format (+countrycode number)
    if (trimmed.startsWith('+') && trimmed.length >= 10) {
      return trimmed;
    }

    // Remove non-numeric characters
    const cleaned = trimmed.replace(/\D/g, '');

    // 10-digit US number — add +1
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }

    // 11+ digits — assume country code is included, add +
    if (cleaned.length >= 11) {
      return '+' + cleaned;
    }

    throw new Error('Invalid phone number format. Include country code (e.g. +91...)');
  }

  /**
   * Log SMS to database
   */
  async logSMS(smsData) {
    try {
      const { rows } = await query(
        `INSERT INTO sms_logs 
         (user_id, booking_id, phone_number, message_type, message_content, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          smsData.user_id,
          smsData.booking_id,
          smsData.phone_number,
          smsData.message_type,
          smsData.message_content,
          smsData.status
        ]
      );
      return rows[0].id;
    } catch (error) {
      logger.error('Failed to log SMS', { error: error.message });
      return null;
    }
  }

  /**
   * Update SMS log
   */
  async updateSMSLog(logId, updates) {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      await query(
        `UPDATE sms_logs SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        [logId, ...Object.values(updates)]
      );
    } catch (error) {
      logger.error('Failed to update SMS log', { error: error.message });
    }
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(booking, user) {
    if (!user.phone_number) {
      logger.warn('User has no phone number for SMS', { userId: user.id });
      return { success: false, error: 'No phone number on file' };
    }

    const message = this.formatTemplate('confirmation', {
      service: booking.service_name,
      date: new Date(booking.booking_date).toLocaleDateString(),
      time: booking.start_time
    });

    return this.sendSMS(
      user.phone_number,
      message,
      'confirmation',
      booking.id,
      user.id
    );
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(booking, user) {
    if (!user.phone_number) {
      return { success: false, error: 'No phone number on file' };
    }

    const message = this.formatTemplate('reminder', {
      service: booking.service_name,
      time: booking.start_time
    });

    return this.sendSMS(
      user.phone_number,
      message,
      'reminder',
      booking.id,
      user.id
    );
  }

  /**
   * Send booking cancellation SMS
   */
  async sendCancellationNotice(booking, user) {
    if (!user.phone_number) {
      return { success: false, error: 'No phone number on file' };
    }

    const message = this.formatTemplate('cancellation', {
      service: booking.service_name
    });

    return this.sendSMS(
      user.phone_number,
      message,
      'cancellation',
      booking.id,
      user.id
    );
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(booking, user, amount) {
    if (!user.phone_number) {
      return { success: false, error: 'No phone number on file' };
    }

    const message = this.formatTemplate('payment_confirmation', {
      service: booking.service_name,
      date: new Date(booking.booking_date).toLocaleDateString(),
      amount: `$${amount}`
    });

    return this.sendSMS(
      user.phone_number,
      message,
      'payment_confirmation',
      booking.id,
      user.id
    );
  }

  /**
   * Format message template with variables
   */
  formatTemplate(templateType, variables) {
    let template = TEMPLATES[templateType] || '';
    
    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      template = template.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    return template;
  }

  /**
   * Check user SMS preferences
   */
  async getUserSMSPreferences(userId) {
    try {
      const { rows } = await query(
        'SELECT * FROM user_sms_preferences WHERE user_id = $1',
        [userId]
      );
      
      if (rows.length === 0) {
        // Create default preferences
        await query(
          `INSERT INTO user_sms_preferences (user_id) VALUES ($1)`,
          [userId]
        );
        
        return {
          enable_confirmations: true,
          enable_reminders: true,
          enable_cancellations: true
        };
      }
      
      return rows[0];
    } catch (error) {
      logger.error('Failed to get SMS preferences', { error: error.message });
      return null;
    }
  }

  /**
   * Update user SMS preferences
   */
  async updateSMSPreferences(userId, preferences) {
    try {
      const { rows } = await query(
        `UPDATE user_sms_preferences 
         SET enable_confirmations = $2,
             enable_reminders = $3,
             enable_cancellations = $4,
             updated_at = NOW()
         WHERE user_id = $1
         RETURNING *`,
        [
          userId,
          preferences.enable_confirmations,
          preferences.enable_reminders,
          preferences.enable_cancellations
        ]
      );
      
      return rows[0];
    } catch (error) {
      logger.error('Failed to update SMS preferences', { error: error.message });
      return null;
    }
  }

  /**
   * Get SMS delivery status from Twilio
   */
  async getMessageStatus(messageSid) {
    if (!twilioClient) return null;
    try {
      const message = await twilioClient.messages(messageSid).fetch();
      
      return {
        sid: message.sid,
        status: message.status,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      logger.error('Failed to get message status', { 
        messageSid, 
        error: error.message 
      });
      return null;
    }
  }

  /**
   * Handle Twilio webhook for delivery status
   */
  async handleDeliveryStatus(webhookData) {
    try {
      const { MessageSid, MessageStatus, ErrorCode } = webhookData;
      
      // Update SMS log with delivery status
      await query(
        `UPDATE sms_logs 
         SET status = $2, 
             error_message = $3,
             updated_at = NOW()
         WHERE twilio_sid = $1`,
        [MessageSid, MessageStatus, ErrorCode || null]
      );

      logger.info('SMS delivery status updated', {
        messageSid: MessageSid,
        status: MessageStatus
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle delivery status', { error: error.message });
      return { success: false };
    }
  }
}

module.exports = new TwilioService();
