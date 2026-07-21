export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar (USD)', rate: 1.0, locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', rate: 0.92, locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', rate: 0.79, locale: 'en-GB' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', rate: 83.5, locale: 'en-IN' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)', rate: 1.36, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', rate: 1.52, locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', rate: 155.0, locale: 'ja-JP' },
}

export const getActiveCurrency = () => {
  return localStorage.getItem('active_currency') || 'USD'
}

export const setActiveCurrency = (code) => {
  if (CURRENCIES[code]) {
    localStorage.setItem('active_currency', code)
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: code }))
  }
}

export const formatCurrency = (amount, currencyCode = null, convert = false) => {
  const code = currencyCode || getActiveCurrency()
  const config = CURRENCIES[code] || CURRENCIES.USD
  const numericVal = Number(amount) || 0

  const finalVal = convert ? numericVal * config.rate : numericVal

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: config.code === 'JPY' ? 0 : 2,
    }).format(finalVal)
  } catch (e) {
    return `${config.symbol}${finalVal.toFixed(2)}`
  }
}
