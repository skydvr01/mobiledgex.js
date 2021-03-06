// ------------------------------------------------------ //
// Simple JavaScript API wrapper
// https://stanko.github.io/simple-javascript-api-wrapper
// ------------------------------------------------------ //

const carrierNameDefault = "wifi";
const baseDmeHost = "dme.mobiledgex.net";
const dmePort = 38001; // HTTP REST port
const API_URL = 'https://' + carrierNameDefault + '.' + baseDmeHost + ':' + dmePort;
// const API_URL = 'https://localhost:8080';

// Custom API error to throw
function ApiError(message, data, status) {
  let response = null;
  let isObject = false;

  // We are trying to parse response
  try {
    response = JSON.parse(data);
    isObject = true;
  } catch (e) {
    response = data;
  }

  this.response = response;
  this.message = message;
  this.status = status;
  this.toString = function () {
    return `${this.message}\nResponse:\n${isObject ? JSON.stringify(this.response, null, 2) : this.response}`;
  };
}

// API wrapper function
const fetchResource = (path, userOptions = {}) => {
  // Define default options
  const defaultOptions = { mode: "no-cors" };
  // Define default headers
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Charsets': 'utf-8'
  };

  const options = {
    // Merge options
    ...defaultOptions,
    ...userOptions,
    // Merge headers
    headers: {
      ...defaultHeaders,
      ...userOptions.headers,
    },
  };

  // Build Url
  let carrier = userOptions.body['carrier_name'] ? userOptions.body['carrier_name'] : carrierNameDefault;
  const thisUrl = 'https://' + carrier + '.' + baseDmeHost + ':' + dmePort;
  const url = `${thisUrl}${path}`;
  // console.log(url);
  // console.log(userOptions);

  // Detect is we are uploading a file
  // const isFile = options.body instanceof File;

  // Stringify JSON data
  // If body is not a file
  if (options.body && typeof options.body === 'object'/* && !isFile */) {
    options.body = JSON.stringify(options.body);
  }

  // Variable which will be used for storing response
  let response = null;

  return fetch(url, options)
    .then(responseObject => {
      // Saving response for later use in lower scopes
      response = responseObject;

      // HTTP unauthorized
      if (response.status === 401) {
        // Handle unauthorized requests
        // Maybe redirect to login page?
      }

      // Check for error HTTP error codes
      if (response.status < 200 || response.status >= 300) {
        // Get response as text
        return response.text();
      }

      // Get response as json
      return response.json();
    })
    // "parsedResponse" will be either text or javascript object depending if
    // "response.text()" or "response.json()" got called in the upper scope
    .then(parsedResponse => {
      // Check for HTTP error codes
      if (response.status < 200 || response.status >= 300) {
        // Throw error
        throw parsedResponse;
      }

      // Request succeeded
      return parsedResponse;
    })
    .catch(error => {
      // Throw custom API error
      // If response exists it means HTTP error occured
      if (response) {
        throw new ApiError(`Request failed with status ${response.status}.`, error, response.status);
      } else {
        throw new ApiError(error.toString(), null, 'REQUEST_FAILED');
      }
    });
};

module.exports = { fetchResource: fetchResource };
