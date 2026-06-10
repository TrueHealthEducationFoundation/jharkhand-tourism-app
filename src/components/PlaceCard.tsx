'use client';

import React from 'react';
import { Place } from '@/lib/recommender';
import { MapPin, Navigation, Star, Sparkles } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
  onShowOnMap?: () => void;
}

export default function PlaceCard({ place, onClick, onShowOnMap }: PlaceCardProps) {
  const hasHighMatch = place.matchScore && place.matchScore > 20;

  return (
    <div className="glass-card" style={styles.card} onClick={onClick}>
      
      {/* Badge for preferred matching spots */}
      {hasHighMatch && (
        <div style={styles.matchBadge}>
          <Sparkles size={12} style={{ marginRight: '4px' }} />
          Recommended
        </div>
      )}

      {/* Place Cover Image */}
      <div style={styles.imageWrapper}>
        {place.Image1 ? (
          <img 
            src={place.Image1} 
            alt={place.Name} 
            style={styles.cardImg}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div style={styles.fallbackImg}>
            <span>{place.Category}</span>
          </div>
        )}
        <div style={styles.cardCategoryBadge}>{place.Category}</div>
      </div>

      {/* Info Body */}
      <div style={styles.body}>
        <div style={styles.headerRow}>
          <h3 style={styles.placeName}>{place.Name}</h3>
          <div style={styles.ratingRow}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: '3px' }} />
            <span style={styles.ratingVal}>{place.Rating ? place.Rating.toFixed(1) : 'N/A'}</span>
          </div>
        </div>

        <div style={styles.districtRow}>
          <MapPin size={13} style={{ marginRight: '4px', color: 'var(--text-muted)' }} />
          <span style={styles.districtText}>{place.District} District</span>
        </div>

        <p style={styles.descriptionSnippet}>
          {place.Description && place.Description.length > 80
            ? `${place.Description.substring(0, 80)}...`
            : place.Description || 'Experience the nature and serenity of this site.'}
        </p>

        {/* Card Footer */}
        <div style={styles.cardFooter}>
          <div style={styles.feeBadge}>
            {place['Entry Fee (INR)'] ? `₹${place['Entry Fee (INR)']}` : 'Free'}
          </div>

          {place.distance !== undefined && place.distance > 0 ? (
            <div style={styles.distanceBadge}>
              <Navigation size={12} style={{ marginRight: '4px', transform: 'rotate(45deg)' }} />
              <span>{place.distance.toFixed(1)} km away</span>
            </div>
          ) : (
            <div style={styles.distanceBadge}>
              <Navigation size={12} style={{ marginRight: '4px' }} />
              <span>Jharkhand</span>
            </div>
          )}
        </div>

        {onShowOnMap && (
          <button 
            style={styles.mapLinkBtn}
            onClick={(e) => {
              e.stopPropagation();
              onShowOnMap();
            }}
          >
            Show on Map
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    cursor: 'pointer',
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    color: '#080f0a',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  imageWrapper: {
    height: '180px',
    position: 'relative',
    backgroundColor: 'var(--bg-tertiary)',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  fallbackImg: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #182b1d 0%, #0f1c12 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-primary)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  cardCategoryBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(8, 15, 10, 0.8)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'var(--text-primary)',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  body: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '10px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  placeName: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: '1.3',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  ratingVal: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  districtRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  districtText: {
    color: 'var(--text-secondary)',
  },
  descriptionSnippet: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    paddingTop: '12px',
    marginTop: '4px',
  },
  feeBadge: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--accent-secondary)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  distanceBadge: {
    fontSize: '0.8rem',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
  },
  mapLinkBtn: {
    marginTop: '6px',
    padding: '8px',
    background: 'none',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'var(--transition)',
    textAlign: 'center',
    width: '100%',
  },
};
