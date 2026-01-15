/**
 * Temperature Parser Utility
 * Parses temperature strings and converts between Celsius and Fahrenheit
 */

/**
 * Convert Celsius to Fahrenheit
 * Formula: F = (C × 9/5) + 32
 */
export function celsiusToFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 * Formula: C = (F − 32) × 5/9
 */
export function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5 / 9;
}

/**
 * Parse a temperature string (e.g., "32C" or "100F")
 * Returns an object with original value, celsius, and fahrenheit
 */
export function parseTemperature(tempString) {
  // Remove whitespace and convert to uppercase
  const cleaned = tempString.trim().toUpperCase();
  
  // Match pattern: number followed by C or F
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)(C|F)$/);
  
  if (!match) {
    return null; // Invalid format
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  let celsius, fahrenheit;
  
  if (unit === 'C') {
    celsius = value;
    fahrenheit = celsiusToFahrenheit(value);
  } else { // unit === 'F'
    fahrenheit = value;
    celsius = fahrenheitToCelsius(value);
  }
  
  return {
    original: tempString.trim(),
    celsius: Math.round(celsius * 100) / 100, // Round to 2 decimal places
    fahrenheit: Math.round(fahrenheit * 100) / 100
  };
}

/**
 * Parse multiple temperature lines from file content
 * Returns array of temperature objects, filtering out invalid lines
 */
export function parseTemperatureFile(fileContent) {
  const lines = fileContent.split('\n');
  const temperatures = [];
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }
    
    const parsed = parseTemperature(line);
    if (parsed) {
      temperatures.push(parsed);
    } else {
      console.warn(`Invalid temperature format: "${line}"`);
    }
  }
  
  return temperatures;
}
