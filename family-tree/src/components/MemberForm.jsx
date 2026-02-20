import { useState } from 'react';

const FIELD = (label, key, type = 'text', required = false) => ({ label, key, type, required });

const FIELDS = [
  FIELD('First Name', 'firstName', 'text', true),
  FIELD('Last Name', 'lastName', 'text', true),
  FIELD('Birth Date', 'birthDate', 'date'),
  FIELD('Death Date', 'deathDate', 'date'),
  FIELD('Notes', 'notes', 'textarea'),
];

const GENDER_OPTIONS = [
  { value: 'male', label: '♂ Male' },
  { value: 'female', label: '♀ Female' },
  { value: 'other', label: '⚧ Other' },
];

export default function MemberForm({ initial = {}, onSubmit, submitLabel = 'Save', loading }) {
  const [form, setForm] = useState({
    firstName: initial.firstName || '',
    lastName: initial.lastName || '',
    gender: initial.gender || 'male',
    birthDate: initial.birthDate || '',
    deathDate: initial.deathDate || '',
    notes: initial.notes || '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.birthDate) payload.birthDate = null;
    if (!payload.deathDate) payload.deathDate = null;
    if (!payload.notes) payload.notes = null;
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
        {FIELDS.slice(0, 2).map(({ label, key, required }) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {FIELDS.slice(2, 4).map(({ label, key }) => (
            <label key={key} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {label}
              <input type="date" value={form[key]} onChange={set(key)} style={inputStyle} />
            </label>
          ))}
        </div>

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
