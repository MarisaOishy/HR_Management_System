import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatNationalPhone,
  getNationalPhoneDigits,
  getPhoneCountry,
  inferPhoneCountry,
  toInternationalPhone,
  validatePhoneNumber,
} from "../../lib/phone";
import type { SupportedCountryCode } from "../../lib/phone";

interface PhoneInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function PhoneInput({ id, label, value, onChange, required }: PhoneInputProps) {
  const initialCountry = useMemo(() => inferPhoneCountry(value), []);
  const [countryCode, setCountryCode] = useState<SupportedCountryCode>(initialCountry.code);
  const country = getPhoneCountry(countryCode);
  const nationalDigits = getNationalPhoneDigits(value, country);
  const error = value || required ? validatePhoneNumber(value, country) : null;

  useEffect(() => {
    if (!value) {
      setCountryCode(DEFAULT_PHONE_COUNTRY.code);
      return;
    }
    setCountryCode(inferPhoneCountry(value).code);
  }, []);

  const handleCountryChange = (nextCode: string) => {
    const nextCountry = getPhoneCountry(nextCode);
    setCountryCode(nextCountry.code);
    const digits = nationalDigits.slice(0, nextCountry.nationalLength);
    onChange(digits ? `${nextCountry.dialCode}${digits}` : "");
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = getNationalPhoneDigits(event.target.value, country).slice(0, country.nationalLength);
    onChange(digits ? `${country.dialCode}${digits}` : "");
  };

  const displayValue = formatNationalPhone(value, country);
  const standardizedValue = !error && value ? toInternationalPhone(value, country) : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{required ? " *" : ""}</Label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={countryCode} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_COUNTRIES.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.name} {item.dialCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-1">
          <div className={`flex items-center px-3 rounded-l-md border border-r-0 bg-gray-50 text-sm ${error ? "border-red-300 text-red-600" : "border-gray-300 text-gray-600"}`}>
            {country.dialCode}
          </div>
          <Input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={displayValue}
            onChange={handlePhoneChange}
            placeholder={country.placeholder}
            required={required}
            className={`rounded-l-none ${error ? "border-red-300 focus-visible:ring-red-500" : ""}`}
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : standardizedValue ? (
        <p className="text-xs text-gray-500">Saved as {standardizedValue}</p>
      ) : null}
    </div>
  );
}
