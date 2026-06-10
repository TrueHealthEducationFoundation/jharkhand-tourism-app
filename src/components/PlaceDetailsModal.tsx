'use client';

import React from 'react';
import { Place } from '@/lib/recommender';
import { 
  X, MapPin, Calendar, CreditCard, Clock, Users, Heart, 
  Compass, Navigation, ShieldCheck, HelpCircle
} from 'lucide-react';

interface PlaceDetailsModalProps {
  place: Place;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

export default function PlaceDetailsModal({ place, onClose, userLat, userLng }: PlaceDetailsModalProps) {
  const pLat = parseFloat(place.Latitude);
  const pLon = parseFloat(place.Longitude);
  
  // Directions url
  const originStr = userLat && userLng ? `${userLat},${userLng}` : 'Ranchi,Jharkhand';
  const destStr = !isNaN(pLat) && !isNaN(pLon) ? `${pLat},${pLon}` : `${place.Name},${place.District},Jharkhand`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}`;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} className="glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Cover Image */}
        <div style={styles.imageCover}>
          {place.Image1 ? (
            <img 
              src={place.Image1} 
              alt={place.Name} 
              style={styles.coverImg}
              onError={(e) => {
                // Fallback style if cloudinary link fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={styles.fallbackCover}>
              <SparklesPattern />
            </div>
          )}
          
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>

          <div style={styles.imageOverlayText}>
            <span style={styles.categoryTag}>{place.Category}</span>
            <h2 style={styles.title}>{place.Name}</h2>
            <div style={styles.districtRow}>
              <MapPin size={14} style={{ marginRight: '4px' }} />
              <span>{place.District} District, {place.State}</span>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div style={styles.contentScroll}>
          <div style={styles.gridSection}>
            {/* Quick Metrics */}
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Rating</div>
              <div style={styles.metricVal}>★ {place.Rating || 'N/A'}</div>
              <div style={styles.metricSub}>{place['Review Count'] || 0} reviews</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Budget Level</div>
              <div style={styles.metricVal}>{place['Budget Level'] || 'Medium'}</div>
              <div style={styles.metricSub}>Fee: ₹{place['Entry Fee (INR)'] ?? 0}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Trip Duration</div>
              <div style={styles.metricVal}>{place['Estimated Trip Hours'] || 2} Hrs</div>
              <div style={styles.metricSub}>Crowd: {place['Crowd Level'] || 'Medium'}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Adventure</div>
              <div style={styles.metricVal}>Level {place['Adventure Level'] || 1}/5</div>
              <div style={styles.metricSub}>
                {place['Family Friendly'] === 'YES' ? 'Family Friendly' : 'Solo/Adventure'}
              </div>
            </div>
          </div>

          <div style={styles.infoBlock}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={styles.descriptionText}>{place.Description}</p>
          </div>

          <div style={styles.infoBlock}>
            <h3 style={styles.sectionTitle}>Key Activities</h3>
            <div style={styles.tagsContainer}>
              {place.Activities ? (
                place.Activities.split(',').map((act, i) => (
                  <span key={i} style={styles.tagBadge}>
                    <Compass size={12} style={{ marginRight: '4px' }} />
                    {act.trim()}
                  </span>
                ))
              ) : (
                <span style={styles.tagBadge}>Sightseeing</span>
              )}
            </div>
          </div>

          <div style={styles.infoBlock}>
            <h3 style={styles.sectionTitle}>Traveler Details</h3>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <Calendar size={16} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailLabel}>Best Season to Visit</div>
                  <div style={styles.detailVal}>{place['Best Season'] || 'All Year'}</div>
                </div>
              </div>

              <div style={styles.detailItem}>
                <Clock size={16} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailLabel}>Opening Hours</div>
                  <div style={styles.detailVal}>{place['Opening Hours'] || 'Open Always'}</div>
                </div>
              </div>

              <div style={styles.detailItem}>
                <CreditCard size={16} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailLabel}>Entry Ticket (INR)</div>
                  <div style={styles.detailVal}>
                    {place['Entry Fee (INR)'] ? `₹${place['Entry Fee (INR)']}` : 'Free Entry'}
                  </div>
                </div>
              </div>

              <div style={styles.detailItem}>
                <ShieldCheck size={16} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailLabel}>Family Suitability</div>
                  <div style={styles.detailVal}>
                    {place['Family Friendly'] === 'YES' ? 'Perfect for family outings' : 'Recommended for friends/couples'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {place.distance !== undefined && place.distance > 0 && (
            <div style={styles.distanceAlert}>
              <Navigation size={18} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
              <span>
                Estimated distance from your location: <strong>{place.distance.toFixed(1)} km</strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div style={styles.footer}>
          <a 
            href={directionsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.directionBtn}
          >
            <Navigation size={18} style={{ marginRight: '8px' }} />
            Get Driving Directions
          </a>
        </div>
      </div>
    </div>
  );
}

// Background pattern fallback component
function SparklesPattern() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f1c12 0%, #080f0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: 'rgba(16,185,129,0.15)',
        filter: 'blur(30px)'
      }}></div>
      <span style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 500 }}>Jharkhand Eco Tourism</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    border: '1px solid var(--border-color)',
    animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  imageCover: {
    height: '240px',
    position: 'relative',
    backgroundColor: 'var(--bg-secondary)',
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  fallbackCover: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    zIndex: 10,
  },
  imageOverlayText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px',
    background: 'linear-gradient(to top, rgba(8, 15, 10, 0.95) 0%, rgba(8, 15, 10, 0.3) 70%, transparent 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '1.8rem',
    color: 'white',
    margin: 0,
  },
  districtRow: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  contentScroll: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1,
  },
  gridSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  metricVal: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  metricSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '6px',
  },
  descriptionText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid var(--border-color)',
    color: 'var(--accent-primary)',
    fontSize: '0.8rem',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  detailIcon: {
    color: 'var(--accent-primary)',
    marginTop: '3px',
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  distanceAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8,15,10,0.4)',
  },
  directionBtn: {
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
};
