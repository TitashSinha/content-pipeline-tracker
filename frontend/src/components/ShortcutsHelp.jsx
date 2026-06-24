import Modal from './Modal.jsx';
import { Button } from './ui/index.js';

// Discoverability for the keyboard shortcuts (opened with "?"). Kept in sync by
// hand with the bindings in Layout.jsx and the dashboards.
const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Search / command palette' },
  { keys: ['⌘', 'N'], label: 'New content' },
  { keys: ['⌘', '⇧', 'B'], label: 'Batch assign' },
  { keys: ['⌘', '/'], label: 'Focus the filter search' },
  { keys: ['?'], label: 'Show this help' },
  { keys: ['Esc'], label: 'Close dialog / palette' },
];

export default function ShortcutsHelp({ onClose }) {
  return (
    <Modal
      title="Keyboard shortcuts"
      onClose={onClose}
      footer={<Button onClick={onClose}>Got it</Button>}
    >
      <ul className="shortcut-list">
        {SHORTCUTS.map((s) => (
          <li key={s.label} className="shortcut-row">
            <span className="shortcut-label">{s.label}</span>
            <span className="shortcut-keys">{s.keys.map((k, i) => <kbd key={i}>{k}</kbd>)}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted text-[.8rem] shortcut-note">On Windows and Linux, use Ctrl in place of ⌘.</p>
    </Modal>
  );
}
