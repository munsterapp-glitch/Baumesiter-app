export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Searches coordinates for a given address using free OpenStreetMap Nominatim API
 */
export async function searchAddressCoordinates(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        displayName: first.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinates from Nominatim:', error);
    return null;
  }
}
