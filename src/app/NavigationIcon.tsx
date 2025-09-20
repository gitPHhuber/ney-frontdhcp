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
  | 'settings';

const ICONS: Record<NavigationIconName | 'default', ReactElement> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="6.5" height="6.5" rx="1.4" />
      <rect x="10.5" y="3" width="6.5" height="4.25" rx="1.4" />
      <rect x="10.5" y="8.25" width="6.5" height="8.75" rx="1.4" />
      <rect x="3" y="10.75" width="6.5" height="6.25" rx="1.4" />
    </>
  ),
  route: (
    <>
      <path d="M5.5 4.5c1.75 0 3.17 1.45 3.17 3.24 0 1.79-1.42 3.24-3.17 3.24" />
      <path d="M14.5 12.82c-1.75 0-3.17-1.45-3.17-3.24 0-1.79 1.42-3.24 3.17-3.24" />
      <path d="M5.5 11H12" />
      <circle cx="5.5" cy="4.5" r="2.25" />
      <circle cx="14.5" cy="15.5" r="2.25" />
      <circle cx="14.5" cy="6.5" r="2.25" />
    </>
  ),
  inventory: (
    <>
      <path d="M4 6.25 10 3l6 3.25" />
      <path d="M4 10.25 10 7l6 3.25" />
      <path d="M4 14.25 10 11l6 3.25" />
      <path d="M4 6.25v8" />
      <path d="M16 6.25v8" />
    </>
  ),
  topology: (
    <>
      <circle cx="10" cy="5" r="2.4" />
      <circle cx="5.5" cy="14.5" r="2.4" />
      <circle cx="14.5" cy="14.5" r="2.4" />
      <path d="M10 7.4v3.2" />
      <path d="M8.4 12 6.8 13.6" />
      <path d="M11.6 12 13.2 13.6" />
    </>
  ),
  leases: (
    <>
      <path d="M5.25 4.5h9.5c.7 0 1.25.56 1.25 1.25v6.5c0 .69-.55 1.25-1.25 1.25H5.25c-.69 0-1.25-.56-1.25-1.25v-6.5C4 5.06 4.56 4.5 5.25 4.5Z" />
      <path d="M7.25 8.5H8.5" />
      <path d="M11.5 8.5h1.25" />
      <path d="M9.25 12v3" />
      <circle cx="9.25" cy="15.5" r="1.5" />
    </>
  ),
  bell: (
    <>
      <path d="M10 16.5c1.24 0 2.25-1 2.25-2.25h-4.5c0 1.24 1 2.25 2.25 2.25Z" />
      <path d="M5.5 11.5V9.75a4.5 4.5 0 1 1 9 0v1.75l1.25 1.88c.34.52-.02 1.21-.64 1.21H4.89c-.62 0-.98-.69-.64-1.21L5.5 11.5Z" />
    </>
  ),
  incident: (
    <>
      <path d="M10 4.25 4.25 15.75h11.5L10 4.25Z" />
      <path d="M10 8.75v3.5" />
      <circle cx="10" cy="13.25" r="0.7" />
    </>
  ),
  reports: (
    <>
      <path d="M6 4h8c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H6c-.83 0-1.5-.67-1.5-1.5v-9C4.5 4.67 5.17 4 6 4Z" />
      <path d="M7.25 7.25h5.5" />
      <path d="M7.25 10h5.5" />
      <path d="M7.25 12.75h3" />
    </>
  ),
  leader: (
    <>
      <circle cx="10" cy="6.25" r="2.25" />
      <path d="M10 9c-2.76 0-5 2.02-5 4.51V15c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1.49C15 11.02 12.76 9 10 9Z" />
      <path d="m14.75 4.75 1.5-1.5" />
      <path d="M14.5 7.25h2" />
      <path d="m14.75 5.5 1.75.75" />
    </>
  ),
  robot: (
    <>
      <rect x="4.5" y="6" width="11" height="8.5" rx="2.25" />
      <path d="M8 16.25h4" />
      <circle cx="8.25" cy="10.25" r="1.05" />
      <circle cx="12.75" cy="10.25" r="1.05" />
      <path d="M10 4V2.75" />
      <path d="M6 4V2.5" />
      <path d="M14 4V2.5" />
    </>
  ),
  passport: (
    <>
      <rect x="6" y="4" width="8" height="12" rx="1.8" />
      <path d="M10 4v12" />
      <path d="M7.5 7.25h5" />
      <path d="M7.5 10h5" />
      <path d="M7.5 12.75h5" />
    </>
  ),
  shield: (
    <>
      <path d="M10 17c-3.25-1.3-5.5-3.9-5.5-8.1V5.35c0-.48.32-.9.78-1.02L10 3.25l4.72 1.08c.46.11.78.53.78 1.02v3.55c0 4.2-2.25 6.8-5.5 8.1Z" />
      <path d="M10 7.5v3" />
      <circle cx="10" cy="12.25" r="0.75" />
    </>
  ),
  roles: (
    <>
      <circle cx="7.25" cy="7.25" r="2.25" />
      <path d="M7.25 10.25c-2.1 0-3.8 1.62-3.8 3.61V15c0 .55.45 1 1 1H9" />
      <circle cx="13.5" cy="9" r="2.25" />
      <path d="M13.5 11.75c1.84 0 3.25 1.42 3.25 3.15V15c0 .55-.45 1-1 1h-4.75" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.35" />
      <path d="m10 5.25.7-.4a1 1 0 0 1 1.5.74l.08.78c.02.25.2.47.43.57l.73.32a1 1 0 0 1 .46 1.43l-.41.68c-.12.2-.12.45 0 .65l.41.68a1 1 0 0 1-.46 1.43l-.73.32a.75.75 0 0 0-.43.57l-.08.78a1 1 0 0 1-1.5.74L10 14.75c-.21-.12-.48-.12-.69 0l-.7.4a1 1 0 0 1-1.5-.74l-.08-.78a.75.75 0 0 0-.43-.57l-.73-.32a1 1 0 0 1-.46-1.43l.41-.68c.12-.2.12-.45 0-.65l-.41-.68a1 1 0 0 1 .46-1.43l.73-.32c.23-.1.41-.32.43-.57l.08-.78a1 1 0 0 1 1.5-.74l.7.4c.21.12.48.12.69 0Z" />
    </>
  ),
  default: (
    <>
      <circle cx="10" cy="10" r="1.5" />
      <path d="M5 5h10v10H5z" />
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
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {iconNode}
      </g>
    </svg>
  );
});

NavigationIcon.displayName = 'NavigationIcon';
