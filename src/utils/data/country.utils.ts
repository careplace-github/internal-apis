import { countries } from '../../assets/data/countries';

/**
 * Class with utility functions for countries.
 */
export default class CountryUtils {
  async getCountryLabel(country_code: string) {
    const country = countries.find((country) => country.code === country_code);

    return country?.label;
  }

  async getCountryPhone(country_code: string) {
    const country = countries.find((country) => country.code === country_code);

    return country?.phone;
  }

  async getCountryPhones() {
    return countries.map((country) => country.phone);
  }

  async getCountryCodes() {
    return countries.map((country) => country.code);
  }
}
