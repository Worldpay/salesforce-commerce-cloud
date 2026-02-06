'use strict';

/**
 * Removes the domain portion from a Worldpay payment URL, returning only the path
 * 
 * Examples:
 * - "https://try.access.worldpay.com/payments/settlements/full/abc123" → "/payments/settlements/full/abc123"
 * - "/payments/settlements/full/abc123" → "/payments/settlements/full/abc123" (already a path)
 * - "payments/settlements/full/abc123" → "/payments/settlements/full/abc123" (adds leading slash)
 * 
 * @param {string} url - The full URL or path string
 * @returns {string} The path portion starting with "/" or "/" if invalid input
 */
function getUrlPath(url) {
    // Handle invalid input - return root path as fallback
    if (!url || typeof url !== 'string') {
        return '/';
    }

    // Check if the input is already a path (doesn't start with http/https)
    const isFullUrl = /^https?:\/\//i.test(url);
    if (!isFullUrl) {
        // Ensure the path starts with a forward slash
        return url.charAt(0) === '/' ? url : '/' + url;
    }

    // Extract the path from a full URL using regex
    // Pattern: protocol://domain/path → capture the /path part
    const urlPattern = /^https?:\/\/[^/]+(\/.*)?$/i;
    const urlMatch = url.match(urlPattern);
    
    // Return the captured path or root path if no path found
    const extractedPath = urlMatch && urlMatch[1] ? urlMatch[1] : '/';
    return extractedPath;
}

module.exports = {
    getUrlPath: getUrlPath
};