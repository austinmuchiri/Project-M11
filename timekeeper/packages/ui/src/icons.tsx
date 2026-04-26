import * as React from 'react';

export type IconName =
  | 'home' | 'schedule' | 'analytics' | 'bell' | 'gear' | 'star'
  | 'check' | 'x' | 'chevron' | 'chevronDown' | 'plus' | 'minus'
  | 'send' | 'watch' | 'laptop' | 'wifi' | 'battery'
  | 'brush' | 'shirt' | 'plate' | 'bag' | 'book' | 'shower'
  | 'moon' | 'sun' | 'school' | 'pencil' | 'play' | 'pause'
  | 'share' | 'download' | 'refresh' | 'flame' | 'arrow'
  | 'arrowUp' | 'arrowDown' | 'edit' | 'gift' | 'fork'
  | 'dot' | 'lock' | 'unlock' | 'ble';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function AppIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.6, style }: IconProps) {
  const baseProps = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style,
  };
  switch (name) {
    case 'home':       return <svg {...baseProps}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
    case 'schedule':   return <svg {...baseProps}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'analytics':  return <svg {...baseProps}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'bell':       return <svg {...baseProps}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'gear':       return <svg {...baseProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'star':       return <svg {...baseProps}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/></svg>;
    case 'check':      return <svg {...baseProps}><path d="M5 12l5 5 9-11"/></svg>;
    case 'x':          return <svg {...baseProps}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chevron':    return <svg {...baseProps}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevronDown':return <svg {...baseProps}><path d="M6 9l6 6 6-6"/></svg>;
    case 'plus':       return <svg {...baseProps}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':      return <svg {...baseProps}><path d="M5 12h14"/></svg>;
    case 'send':       return <svg {...baseProps}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'watch':      return <svg {...baseProps}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 6V3h6v3M9 18v3h6v-3"/><path d="M12 10v3l2 1"/></svg>;
    case 'laptop':     return <svg {...baseProps}><rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M2 19h20"/></svg>;
    case 'wifi':       return <svg {...baseProps}><path d="M2 9a16 16 0 0 1 20 0"/><path d="M5 13a11 11 0 0 1 14 0"/><path d="M9 17a6 6 0 0 1 6 0"/><circle cx="12" cy="20" r="0.6" fill={color}/></svg>;
    case 'battery':    return <svg {...baseProps}><rect x="2" y="7" width="18" height="10" rx="1.5"/><path d="M22 11v2"/></svg>;
    case 'brush':      return <svg {...baseProps}><path d="M14 4l6 6-9 9-6-6z"/><path d="M3 21l3-3"/></svg>;
    case 'shirt':      return <svg {...baseProps}><path d="M5 6l3-3 4 2 4-2 3 3-3 3v11H8V9z"/></svg>;
    case 'plate':      return <svg {...baseProps}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>;
    case 'bag':        return <svg {...baseProps}><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'book':       return <svg {...baseProps}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 5v15"/></svg>;
    case 'shower':     return <svg {...baseProps}><path d="M7 14h10M9 17v3M12 17v3M15 17v3"/><path d="M12 11V5a3 3 0 0 1 6 0"/></svg>;
    case 'moon':       return <svg {...baseProps}><path d="M21 13a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/></svg>;
    case 'sun':        return <svg {...baseProps}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg>;
    case 'school':     return <svg {...baseProps}><path d="M3 10l9-5 9 5-9 5z"/><path d="M7 12v5a5 5 0 0 0 10 0v-5"/></svg>;
    case 'pencil':     return <svg {...baseProps}><path d="M14 4l6 6-11 11H3v-6z"/></svg>;
    case 'play':       return <svg {...baseProps}><path d="M6 4l14 8-14 8z" fill={color} stroke="none"/></svg>;
    case 'pause':      return <svg {...baseProps}><rect x="6" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill={color} stroke="none"/></svg>;
    case 'share':      return <svg {...baseProps}><path d="M4 12v8h16v-8"/><path d="M12 3v13M7 8l5-5 5 5"/></svg>;
    case 'download':   return <svg {...baseProps}><path d="M4 17v3h16v-3"/><path d="M12 4v12M7 11l5 5 5-5"/></svg>;
    case 'refresh':    return <svg {...baseProps}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>;
    case 'flame':      return <svg {...baseProps}><path d="M12 3c2 4-3 5 0 9 1.4 1.9 4 0 4-3 3 4 2 11-4 11s-8-6-4-11c2-2.5 3-3.5 4-6z"/></svg>;
    case 'arrow':      return <svg {...baseProps}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrowUp':    return <svg {...baseProps}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'arrowDown':  return <svg {...baseProps}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case 'edit':       return <svg {...baseProps}><path d="M14 4l6 6-11 11H3v-6z"/></svg>;
    case 'gift':       return <svg {...baseProps}><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12"/><path d="M12 9c-2-3-6-3-6 0s3 0 6 0zM12 9c2-3 6-3 6 0s-3 0-6 0z"/></svg>;
    case 'fork':       return <svg {...baseProps}><path d="M9 3v9a3 3 0 0 0 6 0V3M12 12v9"/></svg>;
    case 'lock':       return <svg {...baseProps}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'unlock':     return <svg {...baseProps}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-2.6"/></svg>;
    case 'ble':        return <svg {...baseProps}><path d="M7 7l10 10-5 4V3l5 4L7 17"/></svg>;
    case 'dot':        return <svg {...baseProps}><circle cx="12" cy="12" r="3" fill={color}/></svg>;
    default:           return <svg {...baseProps}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
