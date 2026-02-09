# Training Event App — Infra Requirements & Structure

Date: 2026-02-02  
Owner: Infra Team (KU)  
Stack: React (Vite) + PocketBase + Apache + mod_auth_mellon (SAML SSO)

## 1) High-Level Architecture

```
User Browser
  -> Apache (HTTPS, SAML SP)
      -> React SPA (static files)
          -> Frontend auto-provisions users in PocketBase
      -> /api proxy -> PocketBase (127.0.0.1:8090)
      -> /_/ proxy -> PocketBase Admin UI (127.0.0.1:8090/_/)
      -> /whoami -> CGI script (returns SSO identity JSON)
```

## 2) Hosts, Ports, URLs

- Public app URL: `https://training-hub.ku.ac.ae`
- Apache: 80/443
- PocketBase (local only): `127.0.0.1:8090`
- API proxy: `https://training-hub.ku.ac.ae/api` → `http://127.0.0.1:8090/api`
- Admin UI proxy: `https://training-hub.ku.ac.ae/_/` → `http://127.0.0.1:8090/_/`
- SAML endpoints (Apache):
  - `/mellon` (SP endpoints)
  - `/whoami` (returns SSO user identity JSON)

## 3) Services / Daemons

### PocketBase systemd
File: `/etc/systemd/system/pocketbase.service`
```
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
ExecStart=/opt/pocketbase/pocketbase serve --http="127.0.0.1:8090" --dir="/var/lib/pocketbase"
Restart=on-failure
RestartSec=5
WorkingDirectory=/opt/pocketbase
Environment=PB_LOG=true

[Install]
WantedBy=multi-user.target
```

### Apache
Enabled modules:
`proxy`, `proxy_http`, `headers`, `ssl`, `rewrite`, `cgid`, `auth_mellon`

Site config:
`/etc/apache2/sites-available/training-event.conf`

SSO config:
`/etc/apache2/conf-available/training-mellon.conf`  
`/etc/apache2/conf-available/training-whoami.conf`

## 4) SSO (SAML via mod_auth_mellon)

### SP metadata (generated)
Location:
`/etc/apache2/mellon/sp-metadata.xml`  
`/etc/apache2/mellon/sp-key.pem`  
`/etc/apache2/mellon/sp-cert.pem`

Generate / regenerate SP metadata (new key + cert):
```
cd /etc/apache2/mellon
mellon_create_metadata https://training-hub.ku.ac.ae/mellon https://training-hub.ku.ac.ae/mellon
mv https_training_hub.ku.ac.ae_mellon.xml sp-metadata.xml
mv https_training_hub.ku.ac.ae_mellon.key sp-key.pem
mv https_training_hub.ku.ac.ae_mellon.cert sp-cert.pem
systemctl restart apache2
```

Share with IdP team:
- `sp-metadata.xml` (preferred) or `sp-cert.pem`
- Never share `sp-key.pem`

### IdP metadata (required from KU IdP team)
Place file at:
`/etc/apache2/mellon/idp-metadata.xml`

### Mellon config (enabled after IdP metadata is present)
`/etc/apache2/conf-available/training-mellon.conf`
```
MellonEnable "auth"
MellonEndpointPath /mellon
MellonSPMetadataFile /etc/apache2/mellon/sp-metadata.xml
MellonSPPrivateKeyFile /etc/apache2/mellon/sp-key.pem
MellonSPCertFile /etc/apache2/mellon/sp-cert.pem
MellonIdPMetadataFile /etc/apache2/mellon/idp-metadata.xml

MellonSetEnvNoPrefix email "urn:oid:0.9.2342.19200300.100.1.3"
MellonSetEnvNoPrefix name  "urn:oid:2.5.4.3"
MellonSetEnvNoPrefix uid   "urn:oid:0.9.2342.19200300.100.1.1"

<Location />
  AuthType Mellon
  Require valid-user
</Location>

RequestHeader set X-User-Email "%{MELLON_email}e"
RequestHeader set X-User-Name  "%{MELLON_name}e"
RequestHeader set X-User-Id    "%{MELLON_uid}e"
```

Enable after IdP metadata exists:
```
a2enconf training-mellon.conf
systemctl reload apache2
```

## 5) SSO → PocketBase User Provisioning

Endpoint: `GET /whoami`
Implementation: CGI (Python) - returns SSO identity only

File: `/usr/lib/cgi-bin/whoami.py`

Behavior:
- Reads SSO attrs from Mellon env: `MELLON_email`, `MELLON_name`, `MELLON_uid`
- Returns JSON: `{ id, email, name, role, uid }`
- **Does NOT create PocketBase users** (handled by frontend)

### Frontend Auto-Provisioning

**Implementation**: `src/lib/userProvisioning.ts` + `src/hooks/useAuth.tsx`

**Flow**:
1. User authenticates via SSO (Apache + mod_auth_mellon)
2. Frontend fetches `/whoami` → receives SSO identity
3. Frontend calls `provisionUserInPocketBase(ssoUser)`:
   - Checks if user exists in PocketBase by email
   - If not exists: Creates user with `role='user'` and random password
   - If exists: Does NOTHING (preserves manual role assignments)
4. User can now be managed in admin portal's Team Roles tab

**Key Behavior**:
- Email is the unique identifier
- New users always get default `role='user'`
- Existing users are never updated (no role sync)
- Admins must be assigned manually via Team Roles tab
- Race condition handling for simultaneous logins
- Graceful degradation if PocketBase is unavailable

**Collection Rules** (set by `scripts/pocketbase/setup.mjs`):
```javascript
createRule: ""  // Allow public creation for SSO auto-provisioning
listRule: '@request.auth.id != "" && @request.auth.role = "admin"'
viewRule: '@request.auth.id = id || @request.auth.role = "admin"'
updateRule: '@request.auth.role = "admin"'
deleteRule: '@request.auth.role = "admin"'
```

**Files**:
- `src/lib/userProvisioning.ts` - Core provisioning logic
- `src/hooks/useAuth.tsx` - Calls provisioning after `/whoami`
- `scripts/pocketbase/setup.mjs` - Sets collection rules

Admin credentials for `/whoami` CGI (if needed):
`/etc/apache2/pb_admin.env`
```
PB_ADMIN_EMAIL=...
PB_ADMIN_PASSWORD=...
```

## 6) PocketBase Collections & Rules

Collections created:
- `categories`
- `trainings`
- `training_attachments`
- `registrations`
- `resources`
- `training_updates`
- `page_content`
- `page_versions`
- `learning_platforms`
- `users` (auth collection with custom `role` field)

Rules (current):
- Public **list/view** on all collections
- Admin-only **create/update/delete** on most collections
- Registrations: **create** public, **update/delete** admin-only

Admin rule expression:
`@request.auth.role = "admin"`

## 7) Frontend App

Source repo: `/root/.vscode-server/PCD_Training_v1`

Runtime behavior:
- No local login
- SSO-only
- Auth context reads `/whoami`
- PocketBase API uses `/api` by default

Important files:
- `src/integrations/pocketbase/client.ts` (API base URL)
- `src/hooks/useAuth.tsx` (SSO whoami)
- `scripts/pocketbase/setup.mjs` (schema + seed)

Build output target:
`/var/www/training-app`

Environment variables (build/runtime):
```
VITE_API_BASE_URL=
VITE_WHOAMI_URL=/whoami
VITE_SSO_LOGOUT_URL=/mellon/logout
VITE_ENABLE_ADMIN_LOGIN=false
```

## 8) Data Seeding

Mock data:
- `src/data/mockData.ts`

Seeder:
- `scripts/pocketbase/setup.mjs`

Run:
```
POCKETBASE_URL=http://127.0.0.1:8090 \
POCKETBASE_ADMIN_EMAIL=... \
POCKETBASE_ADMIN_PASSWORD=... \
node scripts/pocketbase/setup.mjs
```

Reset + reseed:
```
# truncate collections then re-run seeder
```

## 9) Apache vhost

`/etc/apache2/sites-available/training-event.conf`
```
<VirtualHost *:80>
  ServerName training-hub.ku.ac.ae
  Redirect / https://training-hub.ku.ac.ae/
</VirtualHost>

<VirtualHost *:443>
  ServerName training-hub.ku.ac.ae

  SSLEngine on
  SSLCertificateFile /etc/ssl/certs/ssl-cert-snakeoil.pem
  SSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key

  DocumentRoot /var/www/training-app
  <Directory /var/www/training-app>
    Options -Indexes
    AllowOverride None
    Require all granted
  </Directory>

  FallbackResource /index.html

  ProxyPreserveHost On
  ProxyPass        /api/ http://127.0.0.1:8090/api/
  ProxyPassReverse /api/ http://127.0.0.1:8090/api/
  ProxyPass        /_/ http://127.0.0.1:8090/_/
  ProxyPassReverse /_/ http://127.0.0.1:8090/_/

  IncludeOptional /etc/apache2/conf-enabled/training-mellon.conf
</VirtualHost>
```

## 10) Operational Notes

- PocketBase admin UI (production): `https://training-hub.ku.ac.ae/_/`
- PocketBase admin UI (local): `http://127.0.0.1:8090/_/`
- **Access Note**: Use the production URL (`https://training-hub.ku.ac.ae/_/`) to access the correct PocketBase instance. Direct access to `http://127.0.0.1:8090/_/` may connect to a different database depending on port forwarding configuration.
- Apache logs: `/var/log/apache2/`
- PocketBase logs: `journalctl -u pocketbase -f`
- Backup strategy: copy `/var/lib/pocketbase` (DB + uploads)

## 11) IdP Checklist (KU)

Needed from KU IdP team:
- IdP metadata XML (file or URL)
- Attribute names for:
  - email
  - display name
  - unique ID
- Allowed ACS URL: `https://training-hub.ku.ac.ae/mellon/postResponse`
- SP Entity ID: `https://training-hub.ku.ac.ae/mellon`
