# Teen Reward

Teen Reward is a local, family-focused rewards app that helps parents turn completed chores into points and lets teens exchange those points for rewards. It is built with Laravel, React, Vite, and Docker-based Laravel Sail.

## How it works

1. A parent creates chores and assigns them to a teen.
2. The teen claims a completed chore.
3. The parent approves or rejects the claim.
4. Approval adds the chore's points to the teen's balance.
5. The teen redeems available points for a reward.

Rewards can include Wi-Fi access. In the standard flow, Wi-Fi rewards generate a time-limited UniFi guest voucher. When the external captive portal is configured, a teen can instead redeem a reward for a registered, parent-approved device and receive timed access on that device.

## Features

- Parent and teen accounts with role-based access
- Chore creation, assignment, recurrence, and approval workflow
- Points balances and reward redemption
- Voucher-style Wi-Fi rewards backed by a UniFi controller
- Teen device registration and parent device approval
- External captive portal at `/portal` for device-linked, timed Wi-Fi reward redemption
- Profile management and session/CSRF-based authentication
- Seeded sample accounts, chores, and rewards for local development

## Requirements

- Docker Desktop
- PHP and Composer, for installing project dependencies
- Node.js and pnpm, for frontend dependencies

## Getting started

1. Install PHP dependencies:

   ```bash
   composer install
   ```

2. Copy the environment file and generate an application key:

   ```bash
   cp .env.example .env
   ./vendor/bin/sail artisan key:generate
   ```

3. Start the application services:

   ```bash
   ./vendor/bin/sail up -d
   ```

4. Prepare the database and build the frontend:

   ```bash
   ./vendor/bin/sail artisan migrate:fresh --seed
   ./vendor/bin/sail pnpm run build
   ```

The Vite service installs frontend dependencies into a Docker volume on startup. This keeps native Vite dependencies compatible with the Linux container instead of the host OS. Open [http://localhost](http://localhost). While developing the frontend, Vite is available at [http://localhost:5173](http://localhost:5173).

## Demo accounts

After seeding, sign in with either account:

| Role | Email | Password |
| --- | --- | --- |
| Parent | `parent@example.com` | `password` |
| Teen | `teen@example.com` | `password` |

## UniFi configuration

Wi-Fi rewards require access to a UniFi controller. Set these values in `.env` before redeeming a Wi-Fi reward:

```env
UNIFI_HOST=https://unifi.example.com:8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=secret
UNIFI_SITE=default
UNIFI_ALLOW_SELF_SIGNED=false
UNIFI_PORTAL_SSID="Family Guest"
UNIFI_API_KEY=replace-with-an-integration-api-key
UNIFI_API_SITE_ID=your-unifi-site-id
# Optional when the controller's Integration API is hosted at a non-default path:
# UNIFI_API_BASE_URL=https://your-controller.example/proxy/network/integration/v1
```

`UNIFI_HOST` is the controller API host, not the public URL of this app. `UNIFI_SITE` is the UniFi site name/slug used by the configured client. `UNIFI_PORTAL_SSID` must exactly match the guest SSID; the external portal refuses a redirect for another SSID. `APP_URL` must be the public HTTPS origin of this app when used by real guest devices.

Use `UNIFI_ALLOW_SELF_SIGNED=true` only for a trusted local or development controller with a self-signed certificate. Keep real controller credentials out of version control.

When the controller cannot create a voucher, the redemption is recorded as failed and the teen's points are returned.

### External captive portal setup

The external portal gives a teen a timed access grant for the device that opened the captive portal. It is separate from the voucher redemption flow, which remains available as a fallback.

#### 1. Make the app reachable before guest authorization

Deploy Teen Reward at a stable, publicly reachable HTTPS URL with a valid TLS certificate. The captive client must be able to load and submit the portal before it has Internet access. Add the app's hostname (and any required DNS/TLS dependencies) to the guest network's pre-authorization allowlist/walled garden. The portal is a standalone page with inline CSS and does not load the React/Vite bundle.

For real phones, `http://localhost`, `artisan serve` on a developer laptop, or a private Docker hostname will not work as the portal URL. Use a deployed host or a temporary HTTPS tunnel reachable by both the guest device and the UniFi controller. Set `APP_URL` to that same HTTPS origin.

#### 2. Configure the UniFi guest network

In UniFi Network, enable the Hotspot/Captive Portal feature on the guest Wi-Fi SSID. The External Portal Server setting expects an IPv4 address. Point it at the public IPv4 address that serves this app on HTTP port 80. Caddy routes UniFi's `/guest/s/{site}/` path to Laravel on port 80, independently of the existing HTTPS listener.

```text
http://203.0.113.10/guest/s/default/
```

Replace the example with the server's actual IPv4 address and the configured UniFi site slug. UniFi appends connection context such as `id` (client MAC), `ssid`, `ap`, `t`, and `url`. The app confirms the MAC is currently connected, checks the SSID against `UNIFI_PORTAL_SSID`, and requires the signed-in teen to own the approved device. The legacy `/portal` route remains available for local/manual testing.

UniFi's settings labels vary by Network version. Follow Ubiquiti's [Hotspots and Captive Portals setup guide](https://help.ui.com/hc/en-us/articles/115000166827-UniFi-Hotspots-and-Captive-Portals) to enable the captive portal, then use the controller's external portal server setting for the URL above.

#### 3. Configure the app and controller API

Set these server-side values in `.env` (never in React/browser code):

```env
APP_URL=https://your-public-host.example
UNIFI_HOST=https://your-controller.example:8443
UNIFI_USERNAME=portal-service-account
UNIFI_PASSWORD=replace-with-a-secret
UNIFI_SITE=default
UNIFI_ALLOW_SELF_SIGNED=false
UNIFI_PORTAL_SSID="Family Guest"
UNIFI_API_KEY=replace-with-an-integration-api-key
UNIFI_API_SITE_ID=your-unifi-site-id
```

Create an Integration API key in **Network → Control Plane → Integrations**. Timed device authorization and connected-client lookup use the official Integration API with that key; voucher creation continues to use the configured controller username and password. `UNIFI_API_SITE_ID` is the ID returned by `GET /v1/sites` and is distinct from the site slug in the portal path. By default, API requests use `UNIFI_HOST` plus `/proxy/network/integration/v1`; set `UNIFI_API_BASE_URL` if your controller uses another API root. The API key and controller credentials stay server-side.

After changing environment values, clear cached configuration and apply database migrations:

```bash
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan migrate
```

#### 4. Register devices and redeem access

1. On the app's normal site, the teen registers the device's MAC address from the Devices page.
2. A parent signs in and approves the pending device. Approval allows it to receive rewards, but does not grant Wi-Fi access by itself.
3. Connect the device to the configured guest SSID. The UniFi captive redirect opens the external portal.
4. The teen signs in to the portal and chooses a Wi-Fi reward. The app checks account ownership and approval, deducts points, and asks UniFi to authorize that client for the reward duration. The portal shows the device and access expiry.

The registered MAC must stay stable. Disable the device's randomized/private MAC feature for this guest network; rotating MAC addresses are out of scope. If a device cannot open the captive portal, use the existing voucher flow from the app instead.

#### 5. Verify before relying on it

Test the full redirect and authorization on the actual guest SSID with the target UniFi controller and at least one iOS or Android device. Confirm that the redirect contains `id` and `ssid`, that the app host is reachable before authorization, that a parent-approved device can redeem a reward, and that an unregistered/pending device cannot. This initial integration has automated tests, but has not been validated against a physical UniFi controller or captive-network behavior yet.

## Useful commands

```bash
# Start or stop the Docker services
./vendor/bin/sail up -d
./vendor/bin/sail stop

# Run the test suite
./vendor/bin/sail artisan test --compact

# Check PHP formatting
./vendor/bin/sail bin pint --test

# Check frontend types
./vendor/bin/sail pnpm run type-check
```

Update on production
```bash
git pull
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml exec app php artisan migrate --force
docker compose -f compose.prod.yaml exec app php artisan optimize
```

## Architecture

- `routes/web.php` serves the single-page application and mounts API routes under `/api`.
- `app/Http/Controllers/Api` contains authentication, chores, claims, rewards, profiles, teens, and devices endpoints.
- `resources/js` contains the modern React SPA with TypeScript.
- `app/Services/UniFiService.php` contains UniFi voucher and device-access operations.
- `database/seeders` provides the local demo data.

## License

This project is available under the [MIT License](LICENSE).
