'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Compass, MapPin, CheckCircle, Navigation, Landmark, TreePine, 
  Map, Award, ArrowRight, ArrowLeft, Loader2, Sparkles
} from 'lucide-react';

const PREFERENCE_OPTIONS = [
  { id: 'Waterfall', label: 'Waterfalls', icon: Navigation, desc: 'Spectacular falls & misty plunges' },
  { id: 'Hill & Valley', label: 'Hills & Valleys', icon: Compass, desc: 'Lush greenery and panoramic heights' },
  { id: 'Religious Site', label: 'Religious Shrines', icon: Landmark, desc: 'Sacred temples and holy monuments' },
  { id: 'Wildlife Sanctuary', label: 'Wildlife & Nature', icon: TreePine, desc: 'Forest reserves and rich animal sanctuaries' },
  { id: 'Historical Site', label: 'Heritage & History', icon: Landmark, desc: 'Ancient forts, ruins, and archeology' },
  { id: 'Dam & Lake', label: 'Dams & Lakes', icon: Map, desc: 'Scenic reservoirs and peaceful boating' },
  { id: 'Urban Park & Eco-Tourism', label: 'Eco-Parks & Gardens', icon: Award, desc: 'Modern botanical parks & leisure zones' },
];

export default function OnboardingPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  
  // Geolocation state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setSelectedPrefs(profile.preferences || []);
      setLocationEnabled(profile.location_enabled || false);
      setLocationLabel(profile.location_label || '');
      setLatitude(profile.latitude);
      setLongitude(profile.longitude);
      
      // If user has already completed onboarding, redirect to dashboard
      if (profile.onboarding_completed) {
        router.push('/');
      }
    }
  }, [profile, router]);

  const handleTogglePref = (prefId: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(prefId)
        ? prev.filter((p) => p !== prefId)
        : [...prev, prefId]
    );
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }

    setLocLoading(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setLocationEnabled(true);

        try {
          // Attempt reverse geocoding using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
              headers: {
                'User-Agent': 'JharkhandTourismApp/1.0',
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Jharkhand';
            setLocationLabel(`${city}, ${data.address.state || 'Jharkhand'}`);
          } else {
            setLocationLabel('Current Location');
          }
        } catch (err) {
          console.error('Reverse geocoding failed', err);
          setLocationLabel('Current Location');
        } finally {
          setLocLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Could not retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please search or enter a city manually.';
        }
        setLocError(errorMsg);
        setLocationEnabled(false);
        // Fallback default coordinates (Ranchi)
        setLatitude(23.3441);
        setLongitude(85.3096);
        setLocationLabel('Ranchi, Jharkhand');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCompleteOnboarding = async () => {
    if (saving) return;
    setSaving(true);

    // Default fallbacks if location is skipped
    const finalLat = latitude !== null ? latitude : 23.3441;
    const finalLon = longitude !== null ? longitude : 85.3096;
    const finalLabel = locationLabel.trim() || 'Ranchi, Jharkhand';

    const success = await updateProfile({
      name: name.trim() || user?.email?.split('@')[0] || 'Traveler',
      preferences: selectedPrefs,
      location_enabled: locationEnabled,
      location_label: finalLabel,
      latitude: finalLat,
      longitude: finalLon,
      onboarding_completed: true,
    });

    setSaving(false);
    if (success) {
      router.push('/');
    } else {
      alert('Failed to save profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Setting up explorer space...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Graphic elements */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>

      <div style={styles.progressBarWrapper}>
        <div style={{ ...styles.progressBar, width: `${(step / 3) * 100}%` }}></div>
      </div>

      <div style={styles.card} className="glass-panel">
        {step === 1 && (
          <div style={styles.stepContent}>
            <div style={styles.iconHeader}>
              <Sparkles size={40} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h2 style={styles.stepTitle}>Welcome, Adventurer!</h2>
            <p style={styles.stepSubtitle}>Let's start your journey through the natural paradise of Jharkhand. What should we call you?</p>

            <div style={{ width: '100%', marginTop: '24px' }}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginTop: '8px' }}
              />
            </div>

            <button 
              onClick={() => setStep(2)} 
              disabled={!name.trim()} 
              style={{ ...styles.nextBtn, opacity: name.trim() ? 1 : 0.6 }}
            >
              Next Step
              <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Select Your Vibes</h2>
            <p style={styles.stepSubtitle}>Choose what interests you. We will tailor recommendations based on your preferences.</p>

            <div style={styles.prefsGrid}>
              {PREFERENCE_OPTIONS.map((pref) => {
                const IconComponent = pref.icon;
                const isSelected = selectedPrefs.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => handleTogglePref(pref.id)}
                    style={{
                      ...styles.prefCard,
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <IconComponent 
                      size={24} 
                      style={{ 
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                        marginBottom: '8px'
                      }} 
                    />
                    <div style={styles.prefLabel}>{pref.label}</div>
                    <div style={styles.prefDesc}>{pref.desc}</div>
                  </button>
                );
              })}
            </div>

            <div style={styles.btnRow}>
              <button onClick={() => setStep(1)} style={styles.prevBtn}>
                <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={selectedPrefs.length === 0} 
                style={{ ...styles.nextBtn, opacity: selectedPrefs.length > 0 ? 1 : 0.6 }}
              >
                Next Step
                <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContent}>
            <div style={styles.iconHeader}>
              <MapPin size={40} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <h2 style={styles.stepTitle}>Pin Your Location</h2>
            <p style={styles.stepSubtitle}>Enable location permissions to discover waterfalls, viewpoints, and temples near you, and compute precise driving distances.</p>

            <div style={styles.locationSection}>
              {locLoading ? (
                <div style={styles.locStatus}>
                  <Loader2 size={30} style={styles.spinningIcon} />
                  <p style={{ marginTop: '12px' }}>Locating your explorer coordinates...</p>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button onClick={handleFetchLocation} style={styles.locationBtn}>
                    <Navigation size={18} style={{ marginRight: '8px' }} />
                    Detect Current Location
                  </button>

                  <div style={styles.divider}>
                    <span style={styles.dividerText}>or edit manually</span>
                  </div>

                  <div>
                    <label style={styles.label}>Location Label (City, State)</label>
                    <input
                      type="text"
                      placeholder="e.g. Jamshedpur, Jharkhand"
                      value={locationLabel}
                      onChange={(e) => {
                        setLocationLabel(e.target.value);
                        setLocationEnabled(false);
                      }}
                      style={{ marginTop: '8px' }}
                    />
                  </div>

                  {latitude !== null && longitude !== null && (
                    <div style={styles.coordsPanel}>
                      <span style={{ color: 'var(--text-muted)' }}>Coordinates: </span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                        {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
                      </span>
                    </div>
                  )}

                  {locError && (
                    <div style={styles.locError}>
                      <p>{locError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.btnRow}>
              <button onClick={() => setStep(2)} style={styles.prevBtn}>
                <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                Back
              </button>
              <button 
                onClick={handleCompleteOnboarding} 
                disabled={saving} 
                style={styles.completeBtn}
              >
                {saving ? (
                  <Loader2 size={18} style={styles.spinningIcon} />
                ) : (
                  <>
                    <CheckCircle size={18} style={{ marginRight: '8px' }} />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '450px',
    height: '450px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 75%)',
    zIndex: 1,
    filter: 'blur(50px)',
  },
  bgBlob2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '450px',
    height: '450px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 75%)',
    zIndex: 1,
    filter: 'blur(50px)',
  },
  progressBarWrapper: {
    width: '100%',
    maxWidth: '550px',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    marginBottom: '24px',
    overflow: 'hidden',
    zIndex: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--accent-primary)',
    transition: 'width 0.4s ease',
  },
  card: {
    width: '100%',
    maxWidth: '550px',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
    zIndex: 2,
    border: '1px solid var(--border-color)',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  iconHeader: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  stepTitle: {
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '8px',
  },
  stepSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '28px',
    lineHeight: '1.5',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  prefsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
    width: '100%',
    marginBottom: '28px',
  },
  prefCard: {
    padding: '16px',
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    transition: 'var(--transition)',
  },
  prefLabel: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  prefDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.3',
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    gap: '16px',
    marginTop: '12px',
  },
  prevBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  nextBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  completeBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--accent-secondary)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  locationSection: {
    width: '100%',
    marginBottom: '28px',
  },
  locationBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--accent-primary)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  locStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  spinningIcon: {
    animation: 'spin 1.5s linear infinite',
    color: 'var(--accent-primary)',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '12px 0',
  },
  dividerText: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0 12px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    position: 'relative',
    zIndex: 2,
    borderRadius: '4px',
  },
  coordsPanel: {
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
    display: 'flex',
    justifyContent: 'space-between',
  },
  locError: {
    color: '#f87171',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    marginTop: '12px',
    textAlign: 'center',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.1)',
    borderTop: '3px solid var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
