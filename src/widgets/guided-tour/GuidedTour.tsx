import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface GuidedTourProps {
  onComplete?: () => void;
}

interface TourTemplate {
  titleKey: string;
  bodyKey: string;
}

const TOUR_TEMPLATES: TourTemplate[] = [
  { titleKey: 'guidedTour.steps.dashboard.title', bodyKey: 'guidedTour.steps.dashboard.body' },
  { titleKey: 'guidedTour.steps.inventory.title', bodyKey: 'guidedTour.steps.inventory.body' },
  { titleKey: 'guidedTour.steps.topology.title', bodyKey: 'guidedTour.steps.topology.body' },
  { titleKey: 'guidedTour.steps.incidents.title', bodyKey: 'guidedTour.steps.incidents.body' },
  { titleKey: 'guidedTour.steps.automation.title', bodyKey: 'guidedTour.steps.automation.body' },
  { titleKey: 'guidedTour.steps.reports.title', bodyKey: 'guidedTour.steps.reports.body' },
  { titleKey: 'guidedTour.steps.palette.title', bodyKey: 'guidedTour.steps.palette.body' },
];

export const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { t } = useTranslation();

  const steps = useMemo(
    () =>
      TOUR_TEMPLATES.map(template => ({
        title: t(template.titleKey),
        body: t(template.bodyKey),
      })),
    [t],
  );

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
    if (stepIndex === steps.length - 1) {
      closeTour();
      return;
    }
    setStepIndex(previous => Math.min(previous + 1, steps.length - 1));
  };

  const goToPrevious = () => {
    setStepIndex(previous => Math.max(previous - 1, 0));
  };

  const activeStep = steps[stepIndex];

  return (
    <section className="guided-tour-card">
      <div className="guided-tour-card__body">
        <h2>{t('guidedTour.cardTitle', { defaultValue: 'Guided tour' })}</h2>
        <p className="muted">
          {t('guidedTour.cardDescription', {
            defaultValue: 'Preview the eight most important workflows before inviting the wider team.',
          })}
        </p>
      </div>
      <button type="button" className="btn btn-primary" onClick={openTour}>
        {t('guidedTour.start', { defaultValue: 'Start interactive tour' })}
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
              <p className="guided-tour__step">
                {t('guidedTour.stepLabel', {
                  current: stepIndex + 1,
                  total: steps.length,
                  defaultValue: `Step ${stepIndex + 1} of ${steps.length}`,
                })}
              </p>
              <button
                type="button"
                className="ghost"
                onClick={closeTour}
                aria-label={t('guidedTour.close', { defaultValue: 'Close guided tour' })}
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
                {t('guidedTour.previous', { defaultValue: 'Back' })}
              </button>
              <button type="button" className="btn btn-primary" onClick={goToNext}>
                {stepIndex === steps.length - 1
                  ? t('guidedTour.finish', { defaultValue: 'Finish tour' })
                  : t('guidedTour.next', { defaultValue: 'Next step' })}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};
