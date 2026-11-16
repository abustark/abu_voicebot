import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Theme } from '@astryxdesign/core/theme';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import legacyMarkup from './legacy.html?raw';
import { initializeLegacyApp } from './legacy.js';
import './legacy.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

function SpeakerGlyph(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg> }
function NewChatGlyph(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg> }
function ThemeGlyph(props) { return <svg id="theme-icon" {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/></svg> }

function App() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('abu-theme') || 'light'; } catch { return 'light'; }
  });
  const [mounts, setMounts] = useState(null);

  useLayoutEffect(() => {
    setMounts({
      speaker: document.querySelector('[data-control="speaker"]'),
      clear: document.querySelector('[data-control="clear"]'),
      theme: document.querySelector('[data-control="theme"]'),
    });
  }, []);

  useEffect(() => {
    if (!mounts?.speaker || !mounts?.clear || !mounts?.theme) return;
    const syncMode = event => setMode(event.detail === 'dark' ? 'dark' : 'light');
    window.addEventListener('abu-theme-change', syncMode);
    initializeLegacyApp();
    return () => window.removeEventListener('abu-theme-change', syncMode);
  }, [mounts]);

  const portal = mounts && <>
    {createPortal(<IconButton label="Toggle read answers aloud" tooltip="Read answers aloud" icon={<Icon icon={SpeakerGlyph} size="md" />} variant="ghost" className="speaker-toggle" />, mounts.speaker)}
    {createPortal(<IconButton id="clear" label="New chat" tooltip="New chat" icon={<Icon icon={NewChatGlyph} size="md" />} variant="ghost" className="head-button" />, mounts.clear)}
    {createPortal(<IconButton id="theme-toggle" label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} tooltip="Switch theme" icon={<Icon icon={ThemeGlyph} size="md" />} variant="ghost" className="theme-toggle" />, mounts.theme)}
  </>;

  return <Theme theme={neutralTheme} mode={mode}><div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />{portal}</Theme>;
}

createRoot(document.getElementById('root')).render(<App />);
