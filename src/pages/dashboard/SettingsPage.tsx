import { useState } from 'react';
import { User, Settings as SettingsIcon, Bell, Palette, Database, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { RoleBadge } from '@/components/ui/Badges';
import { LoadingSpinner } from '@/components/ui/States';

export function SettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [notifPrefs, setNotifPrefs] = useState(profile?.notification_prefs || { email: true, in_app: true, risk_alerts: true });

  if (!profile) return <LoadingSpinner />;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      showToast('Profile updated', 'success');
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifs = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_prefs: notifPrefs })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      showToast('Notification preferences saved', 'success');
    } catch (e) {
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      {/* Profile Settings */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase">Profile Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-white">{profile.email}</p>
              <RoleBadge role={profile.role} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
            />
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase">Theme</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              theme === 'dark' ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-slate-700/30'
            }`}
          >
            <div className="w-full h-16 bg-[#0a0e1a] rounded mb-2 border border-cyan-500/20" />
            <p className="text-xs text-white">Dark Intelligence</p>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-4 rounded-lg border transition-all ${
              theme === 'light' ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-slate-700/30'
            }`}
          >
            <div className="w-full h-16 bg-slate-100 rounded mb-2 border border-slate-300" />
            <p className="text-xs text-white">Light Mode</p>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase">Notification Settings</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email notifications', desc: 'Receive notifications via email' },
            { key: 'in_app', label: 'In-app notifications', desc: 'Show notifications in the platform' },
            { key: 'risk_alerts', label: 'Risk alerts', desc: 'Get notified when areas enter high risk' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                className="w-5 h-5 accent-cyan-400"
              />
            </label>
          ))}
          <button onClick={handleSaveNotifs} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </div>

      {/* Data Preferences */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase">Data Preferences</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
            <div>
              <p className="text-sm text-white">Synthetic Data Label</p>
              <p className="text-xs text-slate-500">Show labels indicating demo data</p>
            </div>
            <span className="text-xs text-cyan-400">Enabled (always on)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
            <div>
              <p className="text-sm text-white">Default Date Range</p>
              <p className="text-xs text-slate-500">Initial filter range on dashboard load</p>
            </div>
            <span className="text-xs text-slate-400">Last 30 days</span>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase">Account</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
            <span className="text-sm text-white">Email</span>
            <span className="text-xs text-slate-400">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
            <span className="text-sm text-white">Role</span>
            <RoleBadge role={profile.role} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg">
            <span className="text-sm text-white">Member since</span>
            <span className="text-xs text-slate-400">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          <button onClick={signOut} className="btn-secondary text-red-400 hover:text-red-300 mt-2">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
