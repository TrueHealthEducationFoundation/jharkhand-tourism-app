'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Place, recommendPlaces } from '@/lib/recommender';
import PlaceCard from '@/components/PlaceCard';
import PlaceDetailsModal from '@/components/PlaceDetailsModal';
import { 
  Compass, Search, User, MapPin, Sparkles, Filter, 
  RefreshCw, LogOut, Sliders, Map as MapIcon, Grid, 
  HelpCircle, Check, MapPinOff, Flame
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Load Map component dynamically with SSR disabled
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div style={styles.mapFallback}>
      <div style={styles.spinner}></div>
      <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading interactive map...</p>
    </div>
  )
});

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile, updateProfile, signOut } = useAuth();
  const router = useRouter();

  // Navigation tab state: 'feature' | 'search' | 'profile'
  const [activeTab, setActiveTab] = useState<'feature' | 'search' | 'profile'>('feature');

  // Database records
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Recommendations state
  const [recommended, setRecommended] = useState<Place[]>([]);

  // Selected place details modal
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Center place in map view
  const [mapCenterPlace, setMapCenterPlace] = useState<Place | null>(null);
  const [showMapView, setShowMapView] = useState(false);

  // --- Feature Tab Filters ---
  const [maxDistance, setMaxDistance] = useState<number>(300); // in km

  // --- Search Tab Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchDistrict, setSearchDistrict] = useState('All');
  const [searchBudget, setSearchBudget] = useState('All');
  const [searchMinRating, setSearchMinRating] = useState<number>(0);

  // --- Profile Page Local State ---
  const [profileName, setProfileName] = useState('');
  const [profilePrefs, setProfilePrefs] = useState<string[]>([]);
  const [profileLocLabel, setProfileLocLabel] = useState('');
  const [profileLat, setProfileLat] = useState<number | null>(null);
  const [profileLon, setProfileLon] = useState<number | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateMsg, setProfileUpdateMsg] = useState<string | null>(null);

  // Fetch places on load
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setPlacesLoading(true);
        const { data, error } = await supabase
          .from('places')
          .select('*');

        if (error) throw error;
        setPlaces(data as Place[]);
      } catch (err: any) {
        console.error('Error fetching places:', err);
        setPlacesError(err.message || 'Failed to load destinations.');
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // Compute recommendations when places or profile data change
  useEffect(() => {
    if (places.length > 0 && profile) {
      const recs = recommendPlaces(
        places,
        profile.latitude,
        profile.longitude,
        profile.preferences || []
      );
      setRecommended(recs);
    }
  }, [places, profile]);

  // Sync profile details to local form on tab open
  useEffect(() => {
    if (profile && activeTab === 'profile') {
      setProfileName(profile.name || '');
      setProfilePrefs(profile.preferences || []);
      setProfileLocLabel(profile.location_label || '');
      setProfileLat(profile.latitude);
      setProfileLon(profile.longitude);
      setProfileUpdateMsg(null);
    }
  }, [profile, activeTab]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Authenticating credentials...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // AuthContext handles redirect to login
  }

  // --- Filter Recommendations based on max distance slider ---
  const filteredRecommended = recommended.filter((place) => {
    if (place.distance === undefined) return true;
    return place.distance <= maxDistance;
  });

  // --- Search Filtering Logic ---
  const filteredSearchPlaces = recommended.filter((place) => {
    const matchesQuery = 
      place.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.District.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.Tags && place.Tags.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = searchCategory === 'All' || place.Category === searchCategory;
    const matchesDistrict = searchDistrict === 'All' || place.District === searchDistrict;
    const matchesBudget = searchBudget === 'All' || place['Budget Level'] === searchBudget;
    const matchesRating = place.Rating >= searchMinRating;

    return matchesQuery && matchesCategory && matchesDistrict && matchesBudget && matchesRating;
  });

  // --- Profile Preference Toggles ---
  const toggleProfilePref = (prefId: string) => {
    setProfilePrefs((prev) =>
      prev.includes(prefId) ? prev.filter((p) => p !== prefId) : [...prev, prefId]
    );
  };

  // --- Save Profile Changes ---
  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileUpdateMsg(null);

    const success = await updateProfile({
      name: profileName,
      preferences: profilePrefs,
      location_label: profileLocLabel,
      latitude: profileLat,
      longitude: profileLon,
    });

    setIsUpdatingProfile(false);
    if (success) {
      setProfileUpdateMsg('Profile updated successfully!');
      setTimeout(() => setProfileUpdateMsg(null), 3000);
    } else {
      setProfileUpdateMsg('Failed to save changes. Please try again.');
    }
  };

  // --- Re-detect Location on Profile Screen ---
  const handleRefreshLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setProfileLat(lat);
        setProfileLon(lon);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'User-Agent': 'JharkhandTourismApp/1.0' } }
          );
          if (response.ok) {
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || 'Jharkhand';
            setProfileLocLabel(`${city}, ${data.address.state || 'Jharkhand'}`);
          } else {
            setProfileLocLabel('Detected Location');
          }
        } catch (err) {
          setProfileLocLabel('Detected Location');
        }
      },
      (error) => {
        console.error('Location error:', error);
        alert('Could not retrieve current coordinates. Check browser permissions.');
      }
    );
  };

  // List of all unique Categories & Districts in Jharkhand dataset for dropdowns
  const categories = Array.from(new Set(places.map((p) => p.Category)));
  const districts = Array.from(new Set(places.map((p) => p.District)));

  return (
    <div style={styles.appContainer}>
      
      {/* Top Header Navigation */}
      <header style={styles.header} className="glass-panel">
        <div style={styles.headerTitleContainer}>
          <Compass size={24} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={styles.headerLogo}>Jharkhand Tourist</h1>
        </div>
        
        <div style={styles.headerUser}>
          <MapPin size={14} style={{ marginRight: '4px', color: 'var(--accent-secondary)' }} />
          <span style={styles.headerLocText}>{profile.location_label || 'Jharkhand'}</span>
          <button style={styles.logoutBtn} onClick={signOut} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.mainContent}>
        {placesLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading tourist destinations...</p>
          </div>
        )}

        {placesError && (
          <div style={styles.errorContainer}>
            <p>Error: {placesError}</p>
          </div>
        )}

        {!placesLoading && !placesError && (
          <>
            {/* ---------------- FEATURE TAB ---------------- */}
            {activeTab === 'feature' && (
              <div style={styles.tabView}>
                
                {/* Hero Banner Section */}
                <section style={styles.heroSection}>
                  <div style={styles.heroOverlay}></div>
                  <div style={styles.heroContent}>
                    <span style={styles.heroGreetings}>Namaste, {profile.name || 'Explorer'}!</span>
                    <h2 style={styles.heroTitle}>Discover Jharkhand's Nature</h2>
                    <p style={styles.heroSubtitle}>
                      Based on your preferences for{' '}
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                        {profile.preferences && profile.preferences.length > 0
                          ? profile.preferences.join(', ')
                          : 'sightseeing'}
                      </span>
                    </p>
                  </div>
                </section>

                {/* Filter and View Toggles */}
                <div style={styles.featureControls}>
                  <div style={styles.sliderGroup}>
                    <Sliders size={16} style={{ color: 'var(--accent-primary)', marginRight: '8px' }} />
                    <span style={styles.sliderLabel}>Max Distance: <strong>{maxDistance} km</strong></span>
                    <input 
                      type="range" 
                      min="10" 
                      max="500" 
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                      style={styles.slider}
                    />
                  </div>

                  <button 
                    style={styles.viewToggleBtn}
                    onClick={() => setShowMapView(!showMapView)}
                  >
                    {showMapView ? (
                      <>
                        <Grid size={16} style={{ marginRight: '6px' }} />
                        Show Cards View
                      </>
                    ) : (
                      <>
                        <MapIcon size={16} style={{ marginRight: '6px' }} />
                        Show Map View
                      </>
                    )}
                  </button>
                </div>

                {/* Double Split View (Cards vs Map) */}
                <div style={{
                  ...styles.featureContentArea,
                  flexDirection: showMapView ? 'column' : 'column',
                  '@media (min-width: 900px)': {
                    flexDirection: 'row'
                  }
                }}>
                  {showMapView ? (
                    <div style={styles.mapSplit}>
                      <div style={styles.mapWrapper}>
                        <Map 
                          userLat={profile.latitude || 23.3441}
                          userLng={profile.longitude || 85.3096}
                          places={filteredRecommended}
                          onSelectPlace={(place) => setSelectedPlace(place)}
                          centerPlace={mapCenterPlace}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={styles.cardsGrid}>
                      {filteredRecommended.length > 0 ? (
                        filteredRecommended.map((place) => (
                          <PlaceCard
                            key={place['Place ID']}
                            place={place}
                            onClick={() => setSelectedPlace(place)}
                            onShowOnMap={() => {
                              setMapCenterPlace(place);
                              setShowMapView(true);
                            }}
                          />
                        ))
                      ) : (
                        <div style={styles.emptyResults}>
                          <MapPinOff size={40} style={{ color: 'var(--text-muted)' }} />
                          <p style={{ marginTop: '12px' }}>No places found within {maxDistance} km. Try expanding the slider range.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- SEARCH TAB ---------------- */}
            {activeTab === 'search' && (
              <div style={styles.tabView}>
                {/* Search Bar Block */}
                <section style={styles.searchFilterBlock} className="glass-panel">
                  <div style={styles.searchInputWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search by name, tags, activities, or districts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                    />
                  </div>

                  <div style={styles.filterDropdownsGrid}>
                    <div style={styles.dropdownCol}>
                      <label style={styles.dropdownLabel}>Category</label>
                      <select 
                        value={searchCategory} 
                        onChange={(e) => setSearchCategory(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.dropdownCol}>
                      <label style={styles.dropdownLabel}>District</label>
                      <select 
                        value={searchDistrict} 
                        onChange={(e) => setSearchDistrict(e.target.value)}
                      >
                        <option value="All">All Districts</option>
                        {districts.map((dist, idx) => (
                          <option key={idx} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.dropdownCol}>
                      <label style={styles.dropdownLabel}>Budget</label>
                      <select 
                        value={searchBudget} 
                        onChange={(e) => setSearchBudget(e.target.value)}
                      >
                        <option value="All">All Budgets</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div style={styles.dropdownCol}>
                      <label style={styles.dropdownLabel}>Min Rating</label>
                      <select 
                        value={searchMinRating.toString()} 
                        onChange={(e) => setSearchMinRating(parseFloat(e.target.value))}
                      >
                        <option value="0">All Ratings</option>
                        <option value="4.5">★ 4.5 & up</option>
                        <option value="4.0">★ 4.0 & up</option>
                        <option value="3.5">★ 3.5 & up</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Search Results */}
                <div style={styles.searchResultsTitle}>
                  <span>Explore Results ({filteredSearchPlaces.length})</span>
                </div>

                <div style={styles.cardsGrid}>
                  {filteredSearchPlaces.length > 0 ? (
                    filteredSearchPlaces.map((place) => (
                      <PlaceCard
                        key={place['Place ID']}
                        place={place}
                        onClick={() => setSelectedPlace(place)}
                      />
                    ))
                  ) : (
                    <div style={styles.emptyResults}>
                      <Search size={40} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ marginTop: '12px' }}>No matches found. Try adjusting search filters or text.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- PROFILE TAB ---------------- */}
            {activeTab === 'profile' && (
              <div style={styles.tabView}>
                <div style={styles.profileContainer} className="glass-panel">
                  <h2 style={styles.profileTitle}>Explorer Profile</h2>
                  <p style={styles.profileSubtitle}>Customize your coordinates, personal details, and travel preferences.</p>

                  {profileUpdateMsg && (
                    <div style={{
                      ...styles.profileAlert,
                      backgroundColor: profileUpdateMsg.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      borderColor: profileUpdateMsg.includes('success') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: profileUpdateMsg.includes('success') ? '#34d399' : '#f87171',
                    }}>
                      {profileUpdateMsg.includes('success') ? <Check size={16} style={{ marginRight: '8px' }} /> : null}
                      {profileUpdateMsg}
                    </div>
                  )}

                  <div style={styles.profileForm}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Full Name</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)} 
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Email Address</label>
                      <input type="text" value={profile.email || ''} disabled style={styles.disabledInput} />
                    </div>

                    {/* Preferences Selection */}
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Your Travel Vibes</label>
                      <div style={styles.prefGridSelector}>
                        {['Waterfall', 'Hill & Valley', 'Religious Site', 'Wildlife Sanctuary', 'Historical Site', 'Dam & Lake', 'Urban Park & Eco-Tourism'].map((cat) => {
                          const isSelected = profilePrefs.includes(cat);
                          return (
                            <button
                              key={cat}
                              onClick={() => toggleProfilePref(cat)}
                              style={{
                                ...styles.chipBtn,
                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                                borderColor: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                color: isSelected ? '#080f0a' : 'var(--text-primary)',
                              }}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Geolocation management */}
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Your Home Coordinates</label>
                      <div style={styles.geoRow}>
                        <input 
                          type="text" 
                          value={profileLocLabel} 
                          onChange={(e) => setProfileLocLabel(e.target.value)} 
                          placeholder="Detected city label"
                          style={{ flex: 1 }}
                        />
                        <button style={styles.refreshLocBtn} onClick={handleRefreshLocation} title="Detect Location">
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      
                      {profileLat !== null && profileLon !== null && (
                        <div style={styles.coordinatesPanel}>
                          <span>Lat: {profileLat.toFixed(5)}</span>
                          <span>Lon: {profileLon.toFixed(5)}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      style={styles.saveProfileBtn} 
                      onClick={handleSaveProfile}
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Details Modal */}
      {selectedPlace && (
        <PlaceDetailsModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          userLat={profile.latitude}
          userLng={profile.longitude}
        />
      )}

      {/* Bottom Nav Tab Bar */}
      <nav style={styles.bottomNav} className="glass-panel">
        <button 
          style={{ ...styles.navBtn, color: activeTab === 'feature' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('feature')}
        >
          <Compass size={22} />
          <span style={styles.navLabel}>Featured</span>
        </button>

        <button 
          style={{ ...styles.navBtn, color: activeTab === 'search' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('search')}
        >
          <Search size={22} />
          <span style={styles.navLabel}>Search</span>
        </button>

        <button 
          style={{ ...styles.navBtn, color: activeTab === 'profile' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('profile')}
        >
          <User size={22} />
          <span style={styles.navLabel}>Profile</span>
        </button>
      </nav>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    paddingBottom: '85px', // Buffer for bottom navigation bar
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid var(--border-color)',
  },
  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerLogo: {
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, white 60%, var(--accent-primary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerUser: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  headerLocText: {
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginRight: '12px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
    padding: 0,
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },
  tabView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
  },
  heroSection: {
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 32px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f1c12 0%, #050d08 100%)',
    border: '1px solid var(--border-color)',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroGreetings: {
    fontSize: '0.85rem',
    color: 'var(--accent-primary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  heroTitle: {
    fontSize: '2.2rem',
    color: 'var(--text-primary)',
    marginTop: '6px',
    marginBottom: '8px',
  },
  heroSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  featureControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  sliderGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    gap: '12px',
    flex: 1,
    maxWidth: '450px',
  },
  sliderLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  },
  slider: {
    flex: 1,
    accentColor: 'var(--accent-primary)',
    cursor: 'pointer',
  },
  viewToggleBtn: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px 18px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
  },
  featureContentArea: {
    display: 'flex',
    gap: '24px',
    width: '100%',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  mapSplit: {
    width: '100%',
    height: '500px',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-secondary)',
  },
  searchFilterBlock: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
    gap: '20px',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    paddingLeft: '48px',
  },
  filterDropdownsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  dropdownCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dropdownLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  searchResultsTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '8px',
    marginTop: '12px',
  },
  profileContainer: {
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
    padding: '32px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-color)',
  },
  profileTitle: {
    fontSize: '1.8rem',
    marginBottom: '6px',
  },
  profileSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginBottom: '24px',
  },
  profileForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  disabledInput: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.05)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  },
  prefGridSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chipBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  geoRow: {
    display: 'flex',
    gap: '10px',
  },
  refreshLocBtn: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(16,185,129,0.05)',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  coordinatesPanel: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    paddingLeft: '4px',
  },
  saveProfileBtn: {
    backgroundColor: 'var(--accent-primary)',
    color: '#080f0a',
    border: 'none',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginTop: '12px',
  },
  profileAlert: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 900,
    padding: '0 16px',
    backgroundColor: 'rgba(8, 15, 10, 0.9)',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: 'var(--transition)',
  },
  navLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  emptyResults: {
    width: '100%',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-muted)',
  },
  errorContainer: {
    padding: '24px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-md)',
    color: '#f87171',
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(16, 185, 129, 0.1)',
    borderTop: '3px solid var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
