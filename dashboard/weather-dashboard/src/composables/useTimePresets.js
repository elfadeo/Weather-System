export function useTimePresets() {
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const timePresets = [
    {
      value: 'last3h',
      label: 'Last 3 Hours',
      icon: 'ph:clock-bold',
      hours: 3,
    },
    {
      value: 'last6h',
      label: 'Last 6 Hours',
      icon: 'ph:clock-bold',
      hours: 6,
    },
    {
      value: 'last12h',
      label: 'Last 12 Hours',
      icon: 'ph:clock-bold',
      hours: 12,
    },
    {
      value: 'last24h',
      label: 'Last 24 Hours',
      icon: 'ph:clock-bold',
      hours: 24,
    },
    {
      value: 'last7d',
      label: 'Last 7 Days',
      icon: 'ph:calendar-blank-bold',
      days: 7,
    },
    {
      value: 'last30d',
      label: 'Last 30 Days',
      icon: 'ph:calendar-blank-bold',
      days: 30,
    },
    {
      value: 'custom',
      label: 'Custom Range',
      icon: 'ph:funnel-bold',
    },
  ]

  return {
    formatDateTimeLocal,
    timePresets,
  }
}
