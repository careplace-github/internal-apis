import countries from "../../../assets/data/countries.js";

export default class CountryUtils {


  static getCountryLabel(country_code) {
    const country = countries.find((country) => country.code === country_code);

    return country.label;
  }

  static getCountryPhone(country_code){
    const country = countries.find((country) => country.code === country_code);

    return country.phone;
  }

  

  static getCountryPhones() {

    return countries.map((country) => country.phone);

  }

  static getCountryCodes(){
    return countries.map((country) => country.code);
  }


}
