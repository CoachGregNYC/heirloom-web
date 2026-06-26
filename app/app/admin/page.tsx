// app/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '@/app/amplifyClient';
import { apiFetch } from '@/app/apiClient';

type Member = {
  nickname: string;
  role: string;
  userSub: string;
};

type FamilyStat = {
  familyId: string;
  name: string;
  createdAt: string | null;
  createdBy: string | null;
  memberCount: number;
  members: Member[];
  heirloomCount: number;
};

type Totals = {
  families: number;
  memberships: number;
  heirlooms: number;
  uniqueUsers: number;
};

type StatsResponse = {
  totals: Totals;
  families: FamilyStat[];
  generatedAt: string;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Lato:wght@300;400;700&display=swap');
  .admin-root { font-family: 'Lato', sans-serif; background: #f8f6f1; min-height: 100vh; color: #1a1a2e; }
  .admin-header { position: sticky; top: 0; z-index: 100; background: #1a2744; padding: 0 32px; border-bottom: 1px solid #2d3d6b; }
  .admin-header-top { display: flex; align-items: center; gap: 16px; padding: 14px 0 10px; }
  .admin-logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #f0e6c8; margin: 0; letter-spacing: 0.5px; }
  .admin-badge { font-size: 11px; color: #1a1a2e; background: #c8a96e; padding: 3px 10px; border-radius: 4px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .admin-nav-btn { padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(240,230,200,0.3); background: transparent; color: #c8d8f0; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; letter-spacing: 0.5px; transition: all 0.2s; }
  .admin-nav-btn:hover { background: rgba(240,230,200,0.1); border-color: rgba(240,230,200,0.5); }
  .admin-signout-btn { margin-left: auto; padding: 7px 16px; border-radius: 6px; border: 1px solid rgba(240,230,200,0.2); background: transparent; color: #a0b0c8; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; transition: all 0.2s; }
  .admin-signout-btn:hover { background: rgba(255,255,255,0.05); color: #c8d8f0; }
  .admin-subtitle { font-family: 'Playfair Display', serif; font-size: 13px; color: #c8a96e; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 12px; margin: 0; }
  .admin-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 14px 32px; background: #f8f6f1; border-bottom: 1px solid #e8e0d0; }
  .admin-refresh-btn { padding: 9px 20px; border-radius: 6px; border: 1px solid #1a2744; background: #1a2744; color: #f0e6c8; cursor: pointer; font-family: 'Lato', sans-serif; font-size: 13px; letter-spacing: 0.5px; transition: all 0.2s; }
  .admin-refresh-btn:hover:not(:disabled) { background: #2d3d6b; }
  .admin-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .admin-generated { font-size: 12px; color: #9a8a7a; font-style: italic; letter-spacing: 0.3px; }
  .admin-body { padding: 24px 32px 48px; }

  .admin-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .admin-card { background: #1a2744; border-radius: 10px; padding: 22px 24px; box-shadow: 0 2px 8px rgba(26,39,68,0.15); }
  .admin-card-num { font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 600; color: #f0e6c8; line-height: 1; }
  .admin-card-label { margin-top: 8px; font-size: 12px; color: #c8a96e; letter-spacing: 1px; text-transform: uppercase; }

  .admin-section-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #1a2744; margin: 0 0 16px; letter-spacing: 0.3px; }

  .admin-family-card { background: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(26,39,68,0.08); border: 1px solid #ece5d8; }
  .admin-family-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .admin-family-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 600; color: #1a2744; margin: 0; }
  .admin-family-meta { font-size: 12px; color: #9a8a7a; letter-spacing: 0.3px; }
  .admin-family-counts { display: flex; gap: 18px; margin: 14px 0 10px; }
  .admin-count-pill { font-size: 13px; color: #4a5a6a; }
  .admin-count-pill strong { color: #1a2744; font-weight: 700; }
  .admin-members { margin-top: 10px; border-top: 1px solid #f0ebe0; padding-top: 12px; }
  .admin-member-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 14px; }
  .admin-member-nick { color: #1a1a2e; }
  .admin-role-tag { font-size: 10px; padding: 2px 9px; border-radius: 10px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 700; }
  .admin-role-owner { background: #c8a96e; color: #1a1a2e; }
  .admin-role-admin { background: #d8c089; color: #1a1a2e; }
  .admin-role-editor { background: #cdd8ec; color: #1a2744; }
  .admin-role-viewer { background: #e8e0d0; color: #6a5a40; }

  .admin-error { margin: 32px; padding: 18px 22px; border: 1px solid #f0c8c8; border-radius: 8px; background: #fff8f8; color: #a03030; font-size: 14px; }
  .admin-forbidden { margin: 60px auto; max-width: 460px; text-align: center; padding: 40px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(26,39,68,0.1); }
  .admin-forbidden-icon { font-size: 40px; }
  .admin-forbidden h2 { font-family: 'Playfair Display', serif; color: #1a2744; margin: 16px 0 8px; }
  .admin-forbidden p { color: #6a7a8a; font-size: 14px; line-height: 1.5; }
  .admin-loading { margin-top: 60px; text-align: center; color: #9a8a7a; font-family: 'Playfair Display', serif; font-style: italic; font-size: 16px; }
  .admin-divider { width: 40px; height: 1px; background: #c8a96e; margin: 8px auto 0; }
`;

function roleClass(role: string): string {
  const r = (role || '').toLowerCase();
  if (r === 'owner') return 'admin-role-owner';
  if (r === 'admin') return 'admin-role-admin';
  if (r === 'editor') return 'admin-role-editor';
  return 'admin-role-viewer';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setForbidden(false);
    setLoading(true);
    try {
      ensureAmplifyConfigured();
      const data = await apiFetch('/admin/stats', { method: 'GET' });
      setStats(data as StatsResponse);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // apiFetch throws "API 403 Forbidden: ..." for non-admins
      if (msg.includes('403')) {
        setForbidden(true);
      } else if (msg.includes('401') || msg.toLowerCase().includes('not authenticated')) {
        // Not logged in — send to login
        router.replace('/login');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
    router.replace('/login');
  }

  return (
    <div className="admin-root">
      <style>{styles}</style>

      <header className="admin-header">
        <div className="admin-header-top">
          <h1 className="admin-logo">Heirloom</h1>
          <span className="admin-badge">Admin</span>
          <button className="admin-nav-btn" onClick={() => router.push('/app')}>
            ← Back to App
          </button>
          <button className="admin-signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        <p className="admin-subtitle">Platform Overview</p>
      </header>

      {!forbidden && (
        <div className="admin-toolbar">
          <button className="admin-refresh-btn" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          {stats?.generatedAt && (
            <span className="admin-generated">
              Updated {new Date(stats.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {forbidden && (
        <div className="admin-forbidden">
          <div className="admin-forbidden-icon">🔒</div>
          <h2>Not Authorized</h2>
          <p>
            This dashboard is restricted to the Heirloom administrator. Your account doesn’t have
            access.
          </p>
          <div className="admin-divider" />
        </div>
      )}

      {error && <div className="admin-error">{error}</div>}

      {!forbidden && loading && !stats && <div className="admin-loading">Gathering the numbers…</div>}

      {!forbidden && stats && (
        <div className="admin-body">
          {/* Totals */}
          <div className="admin-cards">
            <div className="admin-card">
              <div className="admin-card-num">{stats.totals.families}</div>
              <div className="admin-card-label">Families</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-num">{stats.totals.uniqueUsers}</div>
              <div className="admin-card-label">People</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-num">{stats.totals.memberships}</div>
              <div className="admin-card-label">Memberships</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-num">{stats.totals.heirlooms}</div>
              <div className="admin-card-label">Heirlooms</div>
            </div>
          </div>

          {/* Per-family breakdown */}
          <h2 className="admin-section-title">Families</h2>
          {stats.families.map((f) => (
            <div className="admin-family-card" key={f.familyId}>
              <div className="admin-family-head">
                <h3 className="admin-family-name">{f.name}</h3>
                <span className="admin-family-meta">Created {fmtDate(f.createdAt)}</span>
              </div>
              <div className="admin-family-counts">
                <span className="admin-count-pill">
                  <strong>{f.memberCount}</strong> member{f.memberCount === 1 ? '' : 's'}
                </span>
                <span className="admin-count-pill">
                  <strong>{f.heirloomCount}</strong> heirloom{f.heirloomCount === 1 ? '' : 's'}
                </span>
              </div>
              {f.members.length > 0 && (
                <div className="admin-members">
                  {f.members.map((m) => (
                    <div className="admin-member-row" key={m.userSub}>
                      <span className={`admin-role-tag ${roleClass(m.role)}`}>{m.role}</span>
                      <span className="admin-member-nick">{m.nickname}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
