// ============================================================================
// File: src/utils/phoneUtils.js
// ============================================================================

/**
 * Validates if a phone number is in the correct Philippine format
 * Accepts: +639XXXXXXXXX, 09XXXXXXXXX, or 639XXXXXXXXX
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false
  const cleaned = phone.replace(/\s+/g, '')
  return /^(\+639|09|639)\d{9}$/.test(cleaned)
}

/**
 * Formats a phone number to the standard +639XXXXXXXXX format
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''

  const cleaned = phone.replace(/\s+/g, '')

  if (cleaned.startsWith('+63')) return cleaned
  if (cleaned.startsWith('09')) return '+63' + cleaned.substring(1)
  if (cleaned.startsWith('639')) return '+' + cleaned

  return cleaned
}

/**
 * Validates a phone number and returns an error message if invalid
 */
export function validatePhoneNumber(phone) {
  if (!phone) return 'Phone number is required'
  if (!isValidPhoneNumber(phone)) {
    return 'Invalid format. Use 09171234567 or +639171234567'
  }
  return ''
}

/**
 * Checks if a phone number is a duplicate in a list
 */
export function isDuplicateNumber(phone, phoneList, currentIndex) {
  if (!phone || !phoneList) return false

  const formatted = formatPhoneNumber(phone)

  return phoneList.some(
    (p, index) => index !== currentIndex && formatPhoneNumber(p.number) === formatted,
  )
}
