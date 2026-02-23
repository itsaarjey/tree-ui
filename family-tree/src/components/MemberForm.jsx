import { useState } from 'react';

const GENDER_OPTIONS = [
  { value: 'male', label: '♂ Male' },
  { value: 'female', label: '♀ Female' },
  { value: 'other', label: '⚧ Other' },
];

export default function MemberForm({ initial = {}, onSubmit, submitLabel = 'Save', loading }) {
  const [form, setForm] = useState({
    firstName:   initial.firstName   || '',
    lastName:    initial.lastName    || '',
    gender:      initial.gender      || 'male',
    birthDate:   initial.birthDate   || '',
    deathDate:   initial.deathDate   || '',
    isDeceased:  initial.isDeceased  ?? false,
    notes:       initial.notes       || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Typing a death date automatically marks the member as passed away.
  // Clearing the date does NOT uncheck — user controls that explicitly.
  const handleDeathDate = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      deathDate: val,
      isDeceased: val ? true : f.isDeceased,
    }));
  };

  const handleDeceased = (e) => {
    setForm((f) => ({ ...f, isDeceased: e.target.checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.birthDate) payload.birthDate = null;
    if (!payload.deathDate) payload.deathDate = null;
    if (!payload.notes)     payload.notes     = null;
    onSubmit(payload);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
    marginTop: 4,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gap: 14 }}>

        {/* First Name / Last Name */}
        {[
          { label: 'First Name', key: 'firstName', required: true },
          { label: 'Last Name',  key: 'lastName',  required: true },
        ].map(({ label, key, required }) => (
          <label key={key} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            {label}{required && ' *'}
            <input
              type="text"
              value={form[key]}
              onChange={set(key)}
              required={required}
              style={inputStyle}
            />
          </label>
        ))}

        {/* Gender */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Gender *
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {GENDER_OPTIONS.map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={form.gender === value}
                  onChange={set('gender')}
                />
                {label}
              </label>
            ))}
          </div>
        </label>

        {/* Birth Date / Death Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Birth Date
            <input type="date" value={form.birthDate} onChange={set('birthDate')} style={inputStyle} />
          </label>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Date of Passing
            <input type="date" value={form.deathDate} onChange={handleDeathDate} style={inputStyle} />
          </label>
        </div>

        {/* Passed away checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={form.isDeceased}
            onChange={handleDeceased}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6b7280' }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Passed away
          </span>
          {form.isDeceased && !form.deathDate && (
            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
              (date unknown)
            </span>
          )}
        </label>

        {/* Notes */}
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Notes
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '9px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
