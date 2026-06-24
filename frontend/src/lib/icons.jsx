// Small inline stroke icons (currentColor). No icon library — keeps the bundle
// tiny and lets CSS control size/color everywhere.
const Svg = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const IconDashboard = (p) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>
);
export const IconContent = (p) => (
  <Svg {...p}><path d="M4 5h16M4 12h16M4 19h10" /></Svg>
);
export const IconClients = (p) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>
);
export const IconKey = (p) => (
  <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>
);
export const IconPlus = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IconSearch = (p) => (<Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>);
export const IconRefresh = (p) => (<Svg {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" /></Svg>);
export const IconDownload = (p) => (<Svg {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" /></Svg>);
export const IconEdit = (p) => (<Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></Svg>);
export const IconTrash = (p) => (<Svg {...p}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13h8l1-13" /></Svg>);
export const IconPause = (p) => (<Svg {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>);
export const IconPlay = (p) => (<Svg {...p}><path d="M7 4.5v15l13-7.5-13-7.5z" /></Svg>);
export const IconNote = (p) => (<Svg {...p}><path d="M4 4h16v12l-4 4H4z" /><path d="M14 20v-4h4M8 9h8M8 13h5" /></Svg>);
export const IconChart = (p) => (<Svg {...p}><path d="M4 20V4M4 20h16M8 16v-4M13 16V8M18 16v-7" /></Svg>);
export const IconCopy = (p) => (<Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>);
export const IconBell = (p) => (<Svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>);
export const IconChat = (p) => (<Svg {...p}><path d="M21 11.5a8 8 0 0 1-11.5 7.2L3 21l2.3-6.5A8 8 0 1 1 21 11.5z" /></Svg>);
export const IconActivity = (p) => (<Svg {...p}><path d="M3 12h4l3 8 4-16 3 8h4" /></Svg>);
export const IconSun = (p) => (<Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>);
export const IconMoon = (p) => (<Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Svg>);
export const IconMonitor = (p) => (<Svg {...p}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></Svg>);
export const IconArrowRight = (p) => (<Svg {...p}><path d="M5 12h14m-6-6 6 6-6 6" /></Svg>);
export const IconArrowLeft = (p) => (<Svg {...p}><path d="M19 12H5m6 6-6-6 6-6" /></Svg>);
export const IconCheck = (p) => (<Svg {...p}><path d="m20 6-11 11-5-5" /></Svg>);
export const IconInfo = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></Svg>);
export const IconExternal = (p) => (<Svg {...p}><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></Svg>);
export const IconClock = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);
export const IconCalendar = (p) => (<Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>);
export const IconClose = (p) => (<Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>);
export const IconMenu = (p) => (<Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>);
export const IconChevronDown = (p) => (<Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>);
export const IconChevronLeft = (p) => (<Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>);
export const IconChevronRight = (p) => (<Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>);
export const IconKeyboard = (p) => (<Svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></Svg>);
export const IconBookmark = (p) => (<Svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>);
export const IconUser = (p) => (<Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>);
export const IconUsers = (p) => (<Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 20a5.5 5.5 0 0 0-3-4.9" /></Svg>);
export const IconUpload = (p) => (<Svg {...p}><path d="M12 16V4m0 0 4 4m-4-4-4 4M4 20h16" /></Svg>);
export const IconEye = (p) => (<Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Svg>);
export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M10.6 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M6.2 6.2A18.5 18.5 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 4.05-.78" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M3 3l18 18" />
  </Svg>
);
export const IconBatch = (p) => (<Svg {...p}><rect x="3" y="14" width="18" height="5" rx="1.5" /><rect x="3" y="8" width="18" height="5" rx="1.5" /><rect x="3" y="3" width="18" height="4" rx="1.5" opacity=".45" /></Svg>);
export const IconFilter = (p) => (<Svg {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Svg>);
export const IconTL = (p) => (<Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M15 3l2 2 4-4" /></Svg>);

export const IconTag = (p) => (<Svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></Svg>);
export const IconTemplate = (p) => (<Svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></Svg>);
export const IconWarning = (p) => (<Svg {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></Svg>);

export const IconSort = ({ dir, ...p }) => (
  <Svg {...p} width="14" height="14">
    {dir === 'asc' ? <path d="m6 15 6-6 6 6" /> : dir === 'desc' ? <path d="m6 9 6 6 6-6" /> : <path d="m8 9 4-4 4 4M8 15l4 4 4-4" opacity="0.5" />}
  </Svg>
);
