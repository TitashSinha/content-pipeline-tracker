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

export const IconSort = ({ dir, ...p }) => (
  <Svg {...p} width="14" height="14">
    {dir === 'asc' ? <path d="m6 15 6-6 6 6" /> : dir === 'desc' ? <path d="m6 9 6 6 6-6" /> : <path d="m8 9 4-4 4 4M8 15l4 4 4-4" opacity="0.5" />}
  </Svg>
);
