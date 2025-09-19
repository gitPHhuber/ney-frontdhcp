import React from 'react';

interface GuidedTourProps {
  onComplete?: () => void;
}

const TOUR_STEPS = [
  'Explore the Executive Dashboard for high-level KPIs.',
  'Review active incidents and acknowledge critical alerts.',
  'Open the Inventory module to audit assets and passports.',
  'Use the Reports Builder to assemble your weekly executive summary.',
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  return (
    <section className="guided-tour">
      <header>
        <h2>Quick onboarding tour</h2>
        <p className="muted">Walk through the platform in under 2 minutes.</p>
      </header>
      <ol>
        {TOUR_STEPS.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button type="button" className="primary" onClick={onComplete}>
        Start tour
      </button>
    </section>
  );
};
