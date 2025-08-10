module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Ban direct fetch() usage - force use of centralized ApiClient
    'no-restricted-globals': [
      'error',
      {
        name: 'fetch',
        message: 'Use apiClient from @/lib/api/client instead of direct fetch(). This ensures consistent error handling, request formatting, and centralized API management.'
      }
    ]
  }
};