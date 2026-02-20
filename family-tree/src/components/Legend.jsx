export default function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 12,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        color: '#374151',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
      <Row color="#dbeafe" border="#3b82f6" label="Male member" />
      <Row color="#fce7f3" border="#ec4899" label="Female member" />
      <Row color="#f3f4f6" border="#6b7280" label="Other gender" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="#ec4899" strokeWidth="2" /></svg>
        <span>Current spouse</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" /></svg>
        <span>Divorced</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <svg width="30" height="12">
          <defs>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
            </marker>
          </defs>
          <line x1="0" y1="6" x2="24" y2="6" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arr)" />
        </svg>
        <span>Parent → Child</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>Right-click nodes/links for actions</div>
    </div>
  );
}

function Row({ color, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <div style={{ width: 16, height: 16, background: color, border: `2px solid ${border}`, borderRadius: 3 }} />
      <span>{label}</span>
    </div>
  );
}
