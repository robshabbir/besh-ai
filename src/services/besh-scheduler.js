/**
 * Besh Scheduler — Fires due reminders via Twilio SMS
 * Runs on a setInterval in the main server process.
 */

const logger = require('../utils/logger');
const { computeNextFire } = require('./besh-reminders');

function createBeshScheduler({ store, twilioClient, fromNumber, intervalMs = 60000 } = {}) {
  let timer = null;
  let running = false;

  async function tick() {
    if (running) return; // prevent overlapping ticks
    running = true;

    try {
      const due = await store.getDueReminders(new Date());
      if (due.length === 0) { running = false; return; }

      logger.info(`⏰ ${due.length} reminder(s) due`);

      for (const reminder of due) {
        const phone = reminder.besh_users?.phone;
        const name = reminder.besh_users?.display_name || 'there';

        if (!phone) {
          logger.warn('Reminder has no phone, deactivating', { id: reminder.id });
          await store.advanceReminder(reminder.id, null);
          continue;
        }

        const message = `Hey ${name}! Reminder: ${reminder.text} 💪`;

        try {
          if (twilioClient) {
            await twilioClient.messages.create({
              body: message,
              from: fromNumber,
              to: phone
            });
            logger.info('📤 Reminder sent', { to: phone, text: reminder.text });
          } else {
            logger.info('📤 Reminder (dry run)', { to: phone, text: reminder.text });
          }

          // Store outbound
          if (store.appendConversation) {
            const user = reminder.besh_users;
            await store.appendConversation({
              userId: reminder.user_id,
              direction: 'outbound',
              content: message,
              meta: { type: 'reminder', reminderId: reminder.id }
            });
          }
        } catch (sendErr) {
          logger.error('Failed to send reminder', { id: reminder.id, error: sendErr.message });
        }

        // Advance: recurring → next day, one-shot → deactivate
        const schedule = reminder.schedule_json || {};
        if (schedule.recurring) {
          const nextFire = computeNextFire(
            schedule.hour,
            schedule.minute,
            reminder.besh_users?.timezone || 'UTC'
          );
          await store.advanceReminder(reminder.id, nextFire);
        } else {
          await store.advanceReminder(reminder.id, null);
        }
      }
    } catch (err) {
      logger.error('Scheduler tick error', { error: err.message });
    }

    running = false;
  }

  function start() {
    if (timer) return;
    logger.info(`⏰ Besh scheduler started (every ${intervalMs / 1000}s)`);
    timer = setInterval(tick, intervalMs);
    // Run immediately on start
    tick();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
      logger.info('⏰ Besh scheduler stopped');
    }
  }

  return { start, stop, tick };
}

module.exports = { createBeshScheduler };
