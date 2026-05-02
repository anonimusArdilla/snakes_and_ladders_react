/**
 * Chat Types — JSDoc type definitions for the chat system.
 *
 * @typedef {Object} ChatMessage
 * @property {string} id            - Unique message identifier
 * @property {string} roomId        - Room the message belongs to
 * @property {string} senderId      - player1 | player2
 * @property {string} senderName    - Display name of sender
 * @property {string} text          - Sanitized message text (plain text only)
 * @property {'sent'|'delivered'|'error'} status - Message delivery status
 * @property {number} timestamp     - Unix ms when the message was created
 * @property {boolean} isMine       - Whether the message was sent by the local player
 *
 * @typedef {'idle'|'sending'|'error'} ChatSendStatus
 *
 * @typedef {Object} ChatState
 * @property {ChatMessage[]} messages  - Ordered list of chat messages
 * @property {ChatSendStatus} sendStatus - Current send operation status
 * @property {string|null} sendError    - Error message if last send failed
 */

// Rate limiting constants
export const CHAT_MAX_LENGTH = 500;
export const CHAT_MIN_LENGTH = 1;
export const CHAT_SEND_COOLDOWN_MS = 1000; // 1 second between messages
export const CHAT_MAX_RECENT_MESSAGES = 200; // Keep last 200 messages in memory