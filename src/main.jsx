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
import '@astryxdesign/theme-neutral/fonts.css';

function SpeakerGlyph(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg> }
function NewChatGlyph(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg> }
function MoonGlyph(props) { return <svg id="theme-icon" {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/></svg> }
function SunGlyph(props) { return <svg id="theme-icon" {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg> }

function App() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('abu-theme') || 'light'; } catch { return 'light'; }
  });
  const [speakerOn, setSpeakerOn] = useState(true);
  const [mounts, setMounts] = useState(null);

  useLayoutEffect(() => {
    setMounts({
      speaker: document.querySelector('[data-control="speaker"]'),
      clear: document.querySelector('[data-control="clear"]'),
      theme: document.querySelector('[data-control="theme"]'),
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = mode === 'dark' ? '#0f1a15' : '#f5f5f1';
    try { localStorage.setItem('abu-theme', mode); } catch { /* Storage can be unavailable in private browsing. */ }
  }, [mode]);

  useEffect(() => {
    if (!mounts?.speaker || !mounts?.clear || !mounts?.theme) return;
    initializeLegacyApp();
  }, [mounts]);

  const portal = mounts && <>
    {createPortal(<IconButton label={speakerOn ? 'Turn read-aloud off' : 'Turn read-aloud on'} tooltip={speakerOn ? 'Turn read-aloud off' : 'Turn read-aloud on'} aria-pressed={speakerOn} icon={<Icon icon={SpeakerGlyph} size="md" />} variant="ghost" className={`speaker-toggle${speakerOn ? ' active' : ''}`} onClick={() => setSpeakerOn(current => { const next = !current; const input = document.getElementById('vo'); if (input) input.checked = next; if (!next && window.speechSynthesis) window.speechSynthesis.cancel(); return next; })} />, mounts.speaker)}
    {createPortal(<IconButton id="clear" label="New chat" tooltip="New chat" icon={<Icon icon={NewChatGlyph} size="md" />} variant="ghost" className="head-button" onClick={() => window.dispatchEvent(new Event('abu-new-chat'))} />, mounts.clear)}
    {createPortal(<IconButton id="theme-toggle" label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} tooltip={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} icon={<Icon icon={mode === 'dark' ? SunGlyph : MoonGlyph} size="md" />} variant="ghost" className="theme-toggle" aria-pressed={mode === 'dark'} onClick={() => setMode(current => current === 'dark' ? 'light' : 'dark')} />, mounts.theme)}
  </>;

  return <Theme theme={neutralTheme} mode={mode}><div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />{portal}</Theme>;
}

createRoot(document.getElementById('root')).render(<App />);
