# Teen Reward

Teen Reward is a local, family-focused rewards app that helps parents turn completed chores into points and lets teens exchange those points for rewards. It is built with Laravel, React, Vite, and Docker-based Laravel Sail.

## How it works

1. A parent creates chores and assigns them to a teen.
2. The teen claims a completed chore.
3. The parent approves or rejects the claim.
4. Approval adds the chore's points to the teen's balance.
5. The teen redeems available points for a reward.

Rewards can include Wi-Fi access. Wi-Fi rewards generate a time-limited UniFi guest voucher and return its code to the teen. Teens can also register devices for parent approval, providing a path to direct network access.

## Features

- Parent and teen accounts with role-based access
- Chore creation, assignment, recurrence, and approval workflow
- Points balances and reward redemption
- Voucher-style Wi-Fi rewards backed by a UniFi controller
- Teen device registration and parent device approval
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
```

Use `UNIFI_ALLOW_SELF_SIGNED=true` only for a trusted local or development controller with a self-signed certificate. Keep real controller credentials out of version control.

When the controller cannot create a voucher, the redemption is recorded as failed and the teen's points are returned.

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

## Architecture

- `routes/web.php` serves the single-page application and mounts API routes under `/api`.
- `app/Http/Controllers/Api` contains authentication, chores, claims, rewards, profiles, teens, and devices endpoints.
- `resources/js` contains the modern React SPA with TypeScript.
- `app/Services/UniFiService.php` contains UniFi voucher and device-access operations.
- `database/seeders` provides the local demo data.

## License

This project is available under the [MIT License](LICENSE).
