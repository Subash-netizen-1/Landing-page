// Utility Helper Functions for ApexEvents

/**
 * Generate a unique event code in the format EVT-YYYYMMDD-XXXX
 */
export const generateEventCode = (category = 'EVT') => {
  const prefix = category.substring(0, 3).toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
};

/**
 * Generate a unique ticket code in the format TKT-XXXX-XXXX
 */
export const generateTicketCode = () => {
  const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${p1}-${p2}`;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

/**
 * Format date to standard readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Format time to readable format (12 hour)
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    // If format is HH:MM:SS or HH:MM
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return timeString;
  }
};

/**
 * Generate a working QR Code image URL using a free public API
 */
export const getQRCodeUrl = (data, size = '150x150') => {
  if (!data) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(data)}`;
};

/**
 * Sleep helper (for simulating loading states)
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
