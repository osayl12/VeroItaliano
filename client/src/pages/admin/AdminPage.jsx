import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken, setToken } from '../../api.js';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';
import { LangSwitch } from '../../components/Header.jsx';
import MenuManager from './MenuManager.jsx';
import DealsManager from './DealsManager.jsx';
import HoursManager from './HoursManager.jsx';
import SettingsManager from './SettingsManager.jsx';


function Login({ onLogin }) {
  const { t } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.login(username, password);
      setToken(token);
      onLogin();
    } catch {
      setError(t('login_error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-top"><h1><Icon name="lock" size={22} /> {t('admin_panel')}</h1><LangSwitch /></div>
        <label>{t('username')}<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required aria-invalid={!!error} /></label>
        <label>
          {t('password')}
          <span className="pw-field">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required aria-invalid={!!error} />
            <button type="button" className="icon-btn pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t('hide_password') : t('show_password')} aria-pressed={showPw}>
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={20} />
            </button>
          </span>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-green btn-block" disabled={busy} aria-busy={busy}>{busy ? <span className="btn-spinner" aria-hidden="true" /> : null}{t('login')}</button>
        <Link to="/" className="btn btn-link">{t('view_site')}</Link>
      </form>
    </div>
  );
}

const TABS = [
  { id: 'deals', icon: 'flame', label: 'tab_deals', C: DealsManager },
  { id: 'menu', icon: 'pizza', label: 'tab_menu', C: MenuManager },
  { id: 'hours', icon: 'clock', label: 'tab_hours', C: HoursManager },
  { id: 'settings', icon: 'sliders', label: 'tab_settings', C: SettingsManager }
];

export default function AdminPage() {
  const { t } = useLang();
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab] = useState('deals');

  useEffect(() => {
    const onLogout = () => setAuthed(false);
    window.addEventListener('admin-logout', onLogout);
    if (getToken()) api.me().catch(() => setAuthed(false));
    return () => window.removeEventListener('admin-logout', onLogout);
  }, []);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const Current = TABS.find((x) => x.id === tab).C;
  const logout = () => {
    setToken(null);
    setAuthed(false);
  };

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <h1><Icon name="pizza" size={22} /> {t('admin_panel')}</h1>
          <div className="admin-header-actions">
            <LangSwitch />
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-light"><Icon name="external" size={16} /> {t('view_site')}</a>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={logout}><Icon name="logout" size={16} /> {t('logout')}</button>
          </div>
        </div>
        <nav className="container admin-tabs" aria-label={t('admin_panel')}>
          {TABS.map((x) => (
            <button type="button" key={x.id} aria-current={tab === x.id ? 'page' : undefined} className={tab === x.id ? 'active' : ''} onClick={() => setTab(x.id)}>
              <Icon name={x.icon} size={18} /> {t(x.label)}
            </button>
          ))}
        </nav>
      </header>
      <main className="container admin-main">
        <Current />
      </main>
    </div>
  );
}
