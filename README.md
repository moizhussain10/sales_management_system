# Sales Management System Deployment

## Production Requirements

- Serve the built frontend and `sales_backend` from the same HTTPS origin. If they must use separate origins, configure `CORS_ALLOWED_ORIGINS` with the exact frontend origin(s), including scheme and port.
- Use a supported PHP release (8.1 or later), Apache/PHP-FPM, MySQL, and a valid TLS certificate. Redirect HTTP to HTTPS at the web server or load balancer.
- Never expose phpMyAdmin, MySQL, or development servers publicly. Configure firewall rules, backups, monitoring, and log rotation at the host.
- Set application environment variables in the web server/service manager, not in source control or a publicly served file.

## Backend Environment

Configure these variables for the PHP/Apache process. If the host does not provide environment-variable settings, copy `sales_backend/config.local.php.example` to `sales_backend/config.local.php` and set the values there. That local file is ignored by Git and direct web requests are denied by the backend `.htaccess` rule. Never put the actual password in the example file or commit it.

For local XAMPP, `sales_backend/config.local.php` uses the local `sales_management_db` database. The InfinityFree credentials belong in the separate, ignored `sales_backend/config.infinityfree.php` file. That secret file is deliberately excluded from the deployment ZIP. Upload it privately to InfinityFree's `htdocs/sales_backend/`, then rename it there to `config.local.php`; do not upload the local XAMPP config. The backend `.htaccess` blocks direct web access to both private config filenames.

| Variable | Required production value |
| --- | --- |
| `APP_ENV` | `production` |
| `DB_HOST` | Private MySQL host name/address |
| `DB_PORT` | MySQL port, usually `3306` |
| `DB_NAME` | Application database name |
| `DB_USER` | Dedicated non-root application account |
| `DB_PASSWORD` | Strong secret supplied by the host's secret manager |
| `SESSION_COOKIE_SECURE` | `true`; set explicitly when TLS terminates at a reverse proxy |
| `CORS_ALLOWED_ORIGINS` | Omit for same-origin hosting; otherwise exact comma-separated HTTPS origins |

The application refuses to connect in production with the MySQL `root` account or an empty database password. Grant the dedicated DB account only the permissions required by the app, restrict it to the application host, and protect database backups.

## Security Migrations

Before enabling production traffic, take a verified database backup and run [001_login_security.sql](sales_backend/migrations/001_login_security.sql) as a database administrator. The application account then needs `SELECT`, `INSERT`, and `DELETE` on `login_attempts`; it also needs normal `SELECT`/`UPDATE` access to `users` for login and password-hash upgrades. Do not grant the runtime account schema-alter privileges.

After configuring production DB environment variables, migrate existing plaintext passwords from the backend directory using the CLI-only script:

```powershell
cd sales_backend
php migrate_legacy_passwords.php
```

Run this only after taking a backup. Production login rejects legacy plaintext passwords, so all non-empty existing account passwords must be migrated before launch. The script reports empty passwords for manual reset. Schedule daily cleanup of expired throttle rows:

```sql
DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 1 DAY;
```

## Frontend Build

The checked-in [sales-frontend/.env.example](sales-frontend/.env.example) shows the same-origin API path. Copy it to `.env.production` or set `VITE_API_URL` in the build environment, then build:

```powershell
cd sales-frontend
npm ci
npm run build
```

Deploy the contents of `sales-frontend/dist` at the application web root and the PHP files under `sales_backend` at `/sales_backend/` relative to that root. For a different API path, set `VITE_API_URL` before building. Vite variables are embedded into the public bundle; never put secrets in `VITE_*` variables.

## Go-Live Checklist

1. Back up the database and test the deployment with a staging copy first.
2. Set the production environment variables and verify the site redirects to HTTPS.
3. Ensure PHP errors are logged server-side and are not displayed to visitors; keep database credentials and logs outside the document root where possible.
4. Keep edge-level login rate limiting enabled as defense in depth; the application also limits failed attempts per account and IP.
5. Verify unauthenticated API requests return `401`, wrong-role requests return `403`, login/logout work, and session cookies have `Secure`, `HttpOnly`, and `SameSite` attributes.
6. Test sales, attendance, inventory updates, and administrative actions with separate admin and BA accounts.
7. Confirm backups can be restored and rotate all credentials before launch.

This repository provides application-level configuration, not a fully provisioned production host. Hosting, TLS, firewalling, database permissions, backups, and monitoring must still be configured and verified for the target environment.