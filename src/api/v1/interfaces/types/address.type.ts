/**
 * Address
 */
export type Address = {

    /**
     * City, district, suburb, town, or village.
     */
    city: String;

    /**
     * Two-letter country code (ISO 3166-1 alpha-2).
     * 
     * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
     */
    country: String;

    /**
     * Address line 1 (e.g., street, PO Box, or company name).
     */
    line1: String;

    /**
     * Address line 2 (e.g., apartment, suite, unit, or building).
     */
    line2: String;

    /**
     * ZIP or postal code.
     */
    postal_code: String;

    /**
     * State, county, province, or region.
     */
    state: String;



};

