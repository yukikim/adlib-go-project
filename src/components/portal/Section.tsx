import type { SectionProps } from './types';

export function Section({ title, children }: SectionProps) {
  return (
    <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}
