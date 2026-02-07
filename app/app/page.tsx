'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import awsExports from '../../aws-exports';

import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type Item = {
  key: string;
  url: string;
};

export default function AppPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [emailLike, setEmailLike] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string>('');

  const cfg = useMemo(() => {
    const region = awsExports.aws_project_region || awsExports.aws_user_files_s3_bucket_region;
    const identityPoolId = awsExports.aws_cognito_identity_pool_id;
    const userPoolId = awsExports.aws_user_pools_id;
    const bucket = awsExports.aws_user_files_s3_bucket;

    // Your hosted UI domain env var (already in Amplify)
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // https://xxx.auth...
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

    return { region, identityPoolId, userPoolId, bucket, domain, clientId, logoutUri };
  }, []);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError('');

      try {
        const idToken = localStorage.getItem('heirloom_id_token');
        const accessToken = localStorage.getItem('heirloom_access_token');

        if (!idToken || !accessToken) {
          router.replace('/login');
          return;
        }

        // Optional: show something email-ish
        // (Cognito often uses email as username; if not, you can ignore this)
        setEmailLike(''); // keep simple for now

        const { region, identityPoolId, userPoolId, bucket } = cfg;
        if (!region || !identityPoolId || !userPoolId || !bucket) {
          throw new Error('Missing aws-exports config (region/identityPoolId/userPoolId/bucket).');
        }

        // IMPORTANT: Logins key format for User Pool tokens:
        const loginsKey = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

        const cognitoIdentity = new CognitoIdentityClient({ region });

        // 1) GetId
        const getIdResp = await cognitoIdentity.send(
          new GetIdCommand({
            IdentityPoolId: identityPoolId,
            Logins: {
              [loginsKey]: idToken,
            },
          })
        );

        const identityId = getIdResp.IdentityId;
        if (!identityId) throw new Error('Failed to get IdentityId from Cognito Identity.');

        // 2) GetCredentialsForIdentity
        const credsResp = await cognitoIdentity.send(
          new GetCredentialsForIdentityCommand({
            IdentityId: identityId,
            Logins: {
              [loginsKey]: idToken,
            },
          })
        );

        const c = credsResp.Credentials;
        if (!c?.AccessKeyId || !c?.SecretKey || !c?.SessionToken) {
          throw new Error('Failed to obtain AWS credentials for identity.');
        }

        const s3 = new S3Client({
          region,
          credentials: {
            accessKeyId: c.AccessKeyId,
            secretAccessKey: c.SecretKey,
            sessionToken: c.SessionToken,
          },
        });

        const prefix = 'protected/family-filing-cabinet/originals/';

        const list = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
          })
        );

        const keys =
          (list.Contents || [])
            .map((o) => o.Key)
            .filter((k): k is string => !!k)
            .filter((k) => !k.endsWith('/')) || [];

        // Signed URLs for display
        const signed: Item[] = [];
        for (const key of keys) {
          const url = await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: bucket,
              Key: key,
            }),
            { expiresIn: 60 * 10 } // 10 minutes
          );
          signed.push({ key, url });
        }

        setItems(signed);
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [cfg, router]);

  function signOutNow() {
    // local sign-out
    localStorage.removeItem('heirloom_id_token');
    localStorage.removeItem('heirloom_access_token');
    localStorage.removeItem('heirloom_refresh_token');
    localStorage.removeItem('heirloom_expires_in');

    const { domain, clientId, logoutUri } = cfg;
    if (domain && clientId && logoutUri) {
      const logoutUrl =
        `${domain.replace(/\/$/, '')}/logout` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`;
      window.location.href = logoutUrl;
      return;
    }

    router.replace('/login');
  }

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Heirloom</h1>

      <p style={{ marginTop: 0 }}>
        ✅ Signed in{emailLike ? ` as ${emailLike}` : ''}.
      </p>

      <button
        onClick={signOutNow}
        style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #111',
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Sign out
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          border: '1px solid #e5e5e5',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Family Filing Cabinet</h2>
        <p style={{ marginTop: 0, color: '#444' }}>
          Browsing: <code>protected/family-filing-cabinet/originals/</code>
        </p>

        {loading && <p>Loading photos…</p>}

        {!!error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#ffe5e5' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Error</p>
            <p style={{ margin: '6px 0 0 0' }}>{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && <p>No photos found in this folder.</p>}

        {!loading && !error && items.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((it) => (
              <div key={it.key} style={{ border: '1px solid #eee', borderRadius: 12, padding: 10 }}>
                <img
                  src={it.url}
                  alt={it.key}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#555', wordBreak: 'break-word' }}>
                  {it.key.replace('protected/family-filing-cabinet/originals/', '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}