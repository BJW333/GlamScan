import { AMAZON_ASSOCIATE_TAG } from "./_publicConfigs";

const VALID_AMAZON_DOMAINS = [
  "amazon.com",
  "amazon.co.uk",
  "amazon.de",
  "amazon.fr",
  "amazon.it",
  "amazon.es",
  "amazon.ca",
  "amazon.co.jp",
  "amazon.in",
  "amazon.com.au",
  "amazon.com.br",
  "amazon.com.mx",
];

/**
 * Checks if the Amazon affiliate tag is properly configured in the application.
 * @returns {boolean} `true` if the tag is configured, `false` otherwise.
 */
export const isAffiliateConfigured = (): boolean => {
  return !!AMAZON_ASSOCIATE_TAG && AMAZON_ASSOCIATE_TAG !== "none";
};

/**
 * Validates if a given URL belongs to a recognized Amazon domain.
 * @param urlString The URL to validate.
 * @returns {boolean} `true` if the URL is a valid Amazon domain, `false` otherwise.
 */
export const isValidAmazonUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return VALID_AMAZON_DOMAINS.some(domain => url.hostname.endsWith(domain));
  } catch (error) {
    console.error("Invalid URL string provided to isValidAmazonUrl:", urlString);
    return false;
  }
};

/**
 * Appends the configured Amazon affiliate tag to a given URL.
 * If the tag is not configured, or the URL is not a valid Amazon URL,
 * it returns the original URL. It correctly handles existing query parameters.
 * @param urlString The original product URL.
 * @returns {string} The URL with the affiliate tag appended, or the original URL.
 */
export const addAffiliateTag = (urlString: string): string => {
  if (!isAffiliateConfigured() || !isValidAmazonUrl(urlString)) {
    return urlString;
  }

  try {
    const url = new URL(urlString);
    
    // Avoid adding the tag if it's already present with the correct value
    if (url.searchParams.get("tag") === AMAZON_ASSOCIATE_TAG) {
        return urlString;
    }

    url.searchParams.set("tag", AMAZON_ASSOCIATE_TAG);
    return url.toString();
  } catch (error) {
    console.error("Failed to add affiliate tag to URL:", urlString, error);
    return urlString; // Return original URL on failure
  }
};