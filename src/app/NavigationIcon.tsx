/* eslint-disable react/prop-types */
import React, { memo, type ReactElement } from 'react';

type NavigationIconName =
  | 'dashboard'
  | 'route'
  | 'inventory'
  | 'topology'
  | 'leases'
  | 'bell'
  | 'incident'
  | 'reports'
  | 'leader'
  | 'robot'
  | 'passport'
  | 'shield'
  | 'roles'
  | 'settings'
  | 'factory'
  | 'quality'
  | 'lab'
  | 'people';

const ICONS: Record<NavigationIconName | 'default', ReactElement> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="5.6" height="5.6" rx="1.2" />
      <rect x="11" y="3.5" width="5.5" height="3.8" rx="1.2" />
      <rect x="11" y="8.5" width="5.5" height="6.8" rx="1.2" />
      <rect x="3.5" y="11" width="5.6" height="4.5" rx="1.2" />
    </>
  ),
  route: (
    <>
      <path d="M6 4.4a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z" />
      <path d="M14 12.6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Z" />
      <path d="M7.4 7.1 12.6 12.3" />
      <path d="M14 4.2v3" />
    </>
  ),
  inventory: (
    <>
      <rect x="4.2" y="5.2" width="11.6" height="9.6" rx="1.6" />
      <path d="M4.2 9.2h11.6" />
      <path d="M10 5.2v9.6" />
    </>
  ),
  topology: (
    <>
      <circle cx="10" cy="5.2" r="2" />
      <circle cx="6" cy="14.5" r="2" />
      <circle cx="14" cy="14.5" r="2" />
      <path d="M10 7.4v3.5" />
      <path d="M8 12.3 6.7 13.6" />
      <path d="M12 12.3 13.3 13.6" />
    </>
  ),
  leases: (
    <>
      <rect x="3.6" y="6" width="12.8" height="8.5" rx="1.6" />
      <path d="M3.6 8.7h12.8" />
      <path d="M6.6 11.3h2.6" />
      <path d="M11 11.3h2.8" />
    </>
  ),
  bell: (
    <>
      <path d="M10 15.8a1.6 1.6 0 0 0 1.5-1.4H8.5A1.6 1.6 0 0 0 10 15.8Z" />
      <path d="M5.3 11h9.4l-.8-1.2a3.8 3.8 0 0 1-.6-2V7.5A3.4 3.4 0 0 0 10 4.1h0a3.4 3.4 0 0 0-3.3 3.4v0.3a3.8 3.8 0 0 1-.6 2Z" />
    </>
  ),
  incident: (
    <>
      <path d="M10 4.5 3.8 15.2h12.4Z" />
      <path d="M10 9v2.9" />
      <circle cx="10" cy="13.7" r="0.5" />
    </>
  ),
  reports: (
    <>
      <path d="M7 4.5h6.2l2.3 2.3V16H7Z" />
      <path d="M13.2 4.5v2.3h2.3" />
      <path d="M8.6 9.4h4.4" />
      <path d="M8.6 11.6h4.4" />
      <path d="M8.6 13.8h2.8" />
    </>
  ),
  leader: (
    <>
      <circle cx="7.4" cy="7" r="2" />
      <path d="M4 14.6c.7-2 2-3.2 3.4-3.2s2.6 1.2 3.3 3.2" />
      <path d="m13 6.1.7 1 1 .1-.7.8.3 1-1-.4-.8.7-.1-1-1-.4 1-.4.1-1Z" />
    </>
  ),
  robot: (
    <>
      <rect x="5.5" y="6.3" width="9" height="7" rx="1.8" />
      <path d="M8.6 14.8h2.8" />
      <circle cx="8.7" cy="9.7" r="0.8" />
      <circle cx="11.3" cy="9.7" r="0.8" />
      <path d="M10 6.3V4.7" />
    </>
  ),
  passport: (
    <>
      <rect x="6.3" y="4.4" width="7.4" height="11.2" rx="1.4" />
      <path d="M10 4.4v11.2" />
      <path d="M7.9 8.1h4.2" />
      <path d="M7.9 10.2h4.2" />
      <path d="M7.9 12.3h3" />
    </>
  ),
  shield: (
    <>
      <path d="M10 16.3c-2.7-1-4.6-3.2-4.6-6.7V5.9L10 4.3l4.6 1.6v3.7c0 3.5-1.9 5.7-4.6 6.7Z" />
      <path d="M10 8.6v2.4" />
      <circle cx="10" cy="12.8" r="0.4" />
    </>
  ),
  roles: (
    <>
      <circle cx="7" cy="7.4" r="1.9" />
      <path d="M4 14.5c.6-1.8 1.8-2.8 3-2.8s2.4 1 3 2.8" />
      <circle cx="13" cy="9" r="1.7" />
      <path d="M11.2 14.5c.5-1.5 1.5-2.3 2.5-2.3s2 .8 2.5 2.3" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.1" />
      <path d="m10 5.3.8-.5a.7.7 0 0 1 1 .3l.2.8a.4.4 0 0 0 .3.3l.8.2a.7.7 0 0 1 .4.9l-.4.7a.4.4 0 0 0 0 .3l.4.7a.7.7 0 0 1-.4.9l-.8.2a.4.4 0 0 0-.3.3l-.2.8a.7.7 0 0 1-1 .3l-.8-.5a.4.4 0 0 0-.3 0l-.8.5a.7.7 0 0 1-1-.3l-.2-.8a.4.4 0 0 0-.3-.3l-.8-.2a.7.7 0 0 1-.4-.9l.4-.7a.4.4 0 0 0 0-.3l-.4-.7a.7.7 0 0 1 .4-.9l.8-.2a.4.4 0 0 0 .3-.3l.2-.8a.7.7 0 0 1 1-.3l.8.5a.4.4 0 0 0 .3 0Z" />
    </>
  ),
  factory: (
    <>
      <path d="M4 14.8V7.2l3.2 2.4V7.2l4 3v-2l4 2.8v3.8Z" />
      <path d="M6.4 14.8v-2.4" />
      <path d="M9.6 14.8v-2.4" />
      <path d="M12.8 14.8v-2.4" />
      <path d="M4 14.8h12" />
    </>
  ),
  quality: (
    <>
      <path d="M5.2 5.6h9.6v6.2a4.8 4.8 0 0 1-4.8 4.8h0a4.8 4.8 0 0 1-4.8-4.8Z" />
      <path d="m7.4 9.4 1.8 1.8 3.6-3.6" />
    </>
  ),
  lab: (
    <>
      <path d="M7 4.5h6.2v1.8L9.8 11v2.2a1.8 1.8 0 0 1-1.8 1.8h0a1.8 1.8 0 0 1-1.8-1.8V11L7 9.2Z" />
      <path d="M9.8 11.2h4.2" />
      <path d="M9.8 13.4h4.2" />
    </>
  ),
  people: (
    <>
      <circle cx="7.2" cy="7.4" r="1.8" />
      <circle cx="12.8" cy="8.6" r="1.6" />
      <path d="M4.8 14.8c.6-1.8 1.8-2.8 3-2.8s2.4 1 3 2.8" />
      <path d="M10.6 14.8c.5-1.6 1.5-2.4 2.5-2.4s2 .8 2.5 2.4" />
    </>
  ),
  default: (
    <>
      <circle cx="10" cy="10" r="5" />
      <path d="M5 10h10" />
    </>
  ),
};

export interface NavigationIconProps {
  name?: string;
  className?: string;
}

export const NavigationIcon = memo<NavigationIconProps>(({ name, className }) => {
  const hasIcon = typeof name === 'string' && Object.prototype.hasOwnProperty.call(ICONS, name);
  const iconKey = hasIcon ? (name as NavigationIconName) : 'default';
  const iconNode = ICONS[iconKey];

  return (
    <svg
      className={['nav-icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {iconNode}
      </g>
    </svg>
  );
});

NavigationIcon.displayName = 'NavigationIcon';
