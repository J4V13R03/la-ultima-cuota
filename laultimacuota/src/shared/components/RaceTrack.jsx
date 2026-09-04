import React from 'react';

const LANE_HEIGHT = 44;
const LANE_COLORS = ['#15BD0F', '#0d6efd', '#fd7e14', '#dc3545', '#6f42c1', '#20c997', '#e83e8c', '#ffc107', '#17a2b8', '#343a40', '#007bff', '#28a745'];

function RaceTrack({ inscriptions = [], positions = {} }) {
  const trackHeight = inscriptions.length * LANE_HEIGHT + 16;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          minWidth: '600px',
          maxWidth: '820px',
          height: `${trackHeight}px`,
          backgroundColor: '#f5f0e8',
          borderRadius: '10px',
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #d4c9b8',
          margin: '0 auto',
        }}
      >
        {inscriptions.map((_, i) => (
          <div
            key={`lane-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${i * LANE_HEIGHT + 8}px`,
              height: `${LANE_HEIGHT}px`,
              borderBottom: i < inscriptions.length - 1 ? '1px dashed #c9bfb0' : 'none',
            }}
          />
        ))}

        {[0.25, 0.5, 0.75].map((pct) => (
          <div
            key={`mark-${pct}`}
            style={{
              position: 'absolute',
              left: `${pct * 100}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'repeating-linear-gradient(to bottom, #bbb 0, #bbb 6px, transparent 6px, transparent 12px)',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            background: 'repeating-conic-gradient(#222 0% 25%, #fff 0% 50%) 0 0 / 6px 12px',
          }}
        />

        {inscriptions.map((insc, idx) => {
          const pos = positions[insc.caballo_id] || 0;
          const laneTop = idx * LANE_HEIGHT + 8 + (LANE_HEIGHT - 28) / 2;
          const color = LANE_COLORS[idx % LANE_COLORS.length];
          return (
            <div
              key={insc.caballo_id || idx}
              style={{
                position: 'absolute',
                left: `${pos}px`,
                top: `${laneTop}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'left 1s ease-out',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <span
                className="fw-bold"
                style={{
                  fontSize: '0.72rem',
                  color: '#333',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {insc.caballo_nombre || insc.nombre || `Caballo ${insc.caballo_id}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RaceTrack;
