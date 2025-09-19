import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

interface GuidedTourProps {
  onComplete?: () => void;
}

interface TourStep {
  title: string;
  body: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Dashboard overview',
    body: 'Track SLA compliance, DHCP load, and capacity from the executive dashboard widgets.',
  },
  {
    title: 'Inventory insights',
    body: 'Use filters in Inventory to locate assets, passports, and lifecycle metadata instantly.',
  },
  {
    title: 'Topology explorer',
    body: 'Switch between force, radial, or geo layouts to validate connectivity and dependencies.',
  },
  {
    title: 'Alerts and incidents',
    body: 'Investigate alerts, then escalate to incidents with full remediation context and timelines.',
  },
  {
    title: 'Automation playbooks',
    body: 'Trigger ready-made workflows for failover, compliance checks, or on-demand provisioning.',
  },
  {
    title: 'Reports & analytics',
    body: 'Build ad-hoc or scheduled reports, then export executive-ready PDFs in one click.',
  },
  {
    title: 'Command palette',
    body: 'Press Ctrl/⌘ + K anywhere to jump to routes, run playbooks, or open recent incident timelines.',
  },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTour();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const openTour = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const closeTour = () => {
    setIsOpen(false);
    onComplete?.();
  };

  const goToNext = () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      closeTour();
      return;
    }
    setStepIndex(previous => Math.min(previous + 1, TOUR_STEPS.length - 1));
  };

  const goToPrevious = () => {
    setStepIndex(previous => Math.max(previous - 1, 0));
  };

  const activeStep = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex]);

  return (
    <section className="guided-tour-card">
      <div className="guided-tour-card__body">
        <h2>Guided tour</h2>
        <p className="muted">Preview the eight most important workflows before inviting the wider team.</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={openTour}>
        Start interactive tour
      </button>

      {isOpen && (
        <div className="guided-tour__overlay" role="presentation" onClick={closeTour}>
          <div
            ref={panelRef}
            className="guided-tour__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            onClick={event => event.stopPropagation()}
          >
            <header className="guided-tour__panel-header">
              <p className="guided-tour__step">Step {stepIndex + 1} of {TOUR_STEPS.length}</p>
              <button
                type="button"
                className="ghost"
                onClick={closeTour}
                aria-label="Close guided tour"
              >
                ×
              </button>
            </header>
            <div className="guided-tour__content">
              <h3 id={titleId}>{activeStep.title}</h3>
              <p id={descriptionId}>{activeStep.body}</p>
            </div>
            <footer className="guided-tour__controls">
              <button
                type="button"
                className="ghost"
                onClick={goToPrevious}
                disabled={stepIndex === 0}
              >
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={goToNext}>
                {stepIndex === TOUR_STEPS.length - 1 ? 'Finish tour' : 'Next step'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};
