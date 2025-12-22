export function getCategoryIcon(category) {
  const categoryLower = category.toLowerCase()

  if (
    categoryLower.includes('typhoon') ||
    categoryLower.includes('storm') ||
    categoryLower.includes('flood')
  ) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-300',
      icon: 'ph:wind-bold',
    }
  }

  if (
    categoryLower.includes('crop') ||
    categoryLower.includes('farming') ||
    categoryLower.includes('irrigation')
  ) {
    return {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-600 dark:text-green-300',
      icon: 'ph:plant-bold',
    }
  }

  if (categoryLower.includes('health') || categoryLower.includes('safety')) {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/40',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: 'ph:first-aid-kit-bold',
    }
  }

  if (categoryLower.includes('disease')) {
    return {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-300',
      icon: 'ph:bug-bold',
    }
  }

  return {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-300',
    icon: 'ph:info-bold',
  }
}
