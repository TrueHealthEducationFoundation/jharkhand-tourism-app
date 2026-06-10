export interface Place {
  'Place ID': number;
  Name: string;
  District: string;
  State: string;
  Category: string;
  Description: string;
  Tags: string;
  Latitude: string;
  Longitude: string;
  'Best Season': string;
  'Budget Level': string;
  Activities: string;
  Rating: number;
  'Review Count': string;
  'Entry Fee (INR)': number;
  'Opening Hours': string;
  'Estimated Trip Hours': number;
  'Crowd Level': string;
  'Family Friendly': string;
  'Adventure Level': number;
  Image1: string | null;
  Image2: string | null;
  
  // Appended fields
  distance?: number;
  matchScore?: number;
}

// Haversine formula to calculate distance in km
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function recommendPlaces(
  places: Place[],
  userLat: number | null,
  userLon: number | null,
  userPrefs: string[]
): Place[] {
  const userLatNum = userLat ?? 23.3441; // Default to Ranchi lat
  const userLonNum = userLon ?? 85.3096; // Default to Ranchi lon
  const prefs = userPrefs || [];

  return places
    .map((place) => {
      // 1. Calculate distance
      const placeLat = parseFloat(place.Latitude);
      const placeLon = parseFloat(place.Longitude);
      let distance = 0;

      if (!isNaN(placeLat) && !isNaN(placeLon)) {
        distance = getDistance(userLatNum, userLonNum, placeLat, placeLon);
      }

      // 2. Preference scoring
      let matchScore = 0;

      // Category match (+15 points)
      if (prefs.includes(place.Category)) {
        matchScore += 15;
      }

      // Tag matching (+3 points per tag)
      if (place.Tags) {
        const placeTags = place.Tags.toLowerCase().split(',').map((t) => t.trim());
        prefs.forEach((pref) => {
          const prefLower = pref.toLowerCase();
          
          // Check for sub-tag matching (e.g. "waterfall" in tags)
          if (placeTags.some((tag) => tag.includes(prefLower) || prefLower.includes(tag))) {
            matchScore += 3;
          }
        });
      }

      // Rating bonus (+3 points per star)
      if (place.Rating) {
        matchScore += place.Rating * 3;
      }

      // Proximity bonus:
      // If closer than 50km, add 10 points
      // If closer than 150km, add 5 points
      if (distance > 0) {
        if (distance < 50) {
          matchScore += 10;
        } else if (distance < 150) {
          matchScore += 5;
        }
      }

      return {
        ...place,
        distance,
        matchScore,
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
