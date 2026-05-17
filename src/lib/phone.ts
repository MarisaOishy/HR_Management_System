export type SupportedCountryCode = 'BD' | 'IN' | 'US'

export interface PhoneCountry {
  code: SupportedCountryCode
  name: string
  dialCode: string
  nationalLength: number
  placeholder: string
  pattern: RegExp
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    code: 'BD',
    name: 'Bangladesh',
    dialCode: '+880',
    nationalLength: 10,
    placeholder: '1712345678',
    pattern: /^1\d{9}$/,
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    nationalLength: 10,
    placeholder: '9876543210',
    pattern: /^[6-9]\d{9}$/,
  },
  {
    code: 'US',
    name: 'USA',
    dialCode: '+1',
    nationalLength: 10,
    placeholder: '5551234567',
    pattern: /^[2-9]\d{9}$/,
  },
]

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0]

export function getPhoneCountry(countryCode: string) {
  return PHONE_COUNTRIES.find((country) => country.code === countryCode) ?? DEFAULT_PHONE_COUNTRY
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export function inferPhoneCountry(value: string) {
  const trimmed = value.trim()
  const digits = digitsOnly(trimmed)

  if (trimmed.startsWith('+880') || digits.startsWith('880')) return getPhoneCountry('BD')
  if (trimmed.startsWith('+91') || digits.startsWith('91')) return getPhoneCountry('IN')
  if (trimmed.startsWith('+1') || (digits.length === 11 && digits.startsWith('1'))) return getPhoneCountry('US')

  return DEFAULT_PHONE_COUNTRY
}

export function getNationalPhoneDigits(value: string, country = inferPhoneCountry(value)) {
  let digits = digitsOnly(value)
  const countryDigits = digitsOnly(country.dialCode)

  if (digits.startsWith(countryDigits)) {
    digits = digits.slice(countryDigits.length)
  }

  if (country.code === 'BD' && digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  if (country.code === 'US' && digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, country.nationalLength + 4)
}

export function formatNationalPhone(value: string, country: PhoneCountry) {
  const digits = getNationalPhoneDigits(value, country)

  if (country.code === 'US') {
    const area = digits.slice(0, 3)
    const prefix = digits.slice(3, 6)
    const line = digits.slice(6, 10)
    return [area, prefix, line].filter(Boolean).join(prefix && line ? '-' : ' ')
  }

  if (country.code === 'BD') {
    const carrier = digits.slice(0, 2)
    const rest = digits.slice(2)
    return [carrier, rest].filter(Boolean).join(' ')
  }

  const first = digits.slice(0, 5)
  const second = digits.slice(5)
  return [first, second].filter(Boolean).join(' ')
}

export function validatePhoneNumber(value: string, country: PhoneCountry): string | null {
  const nationalDigits = getNationalPhoneDigits(value, country)

  if (nationalDigits.length !== country.nationalLength) {
    return `${country.name} phone numbers must contain exactly ${country.nationalLength} digits after ${country.dialCode}.`
  }

  if (!country.pattern.test(nationalDigits)) {
    return `Enter a valid ${country.name} phone number.`
  }

  return null
}

export function toInternationalPhone(value: string, country: PhoneCountry) {
  const validationError = validatePhoneNumber(value, country)
  if (validationError) throw new Error(validationError)
  return `${country.dialCode}${getNationalPhoneDigits(value, country)}`
}
