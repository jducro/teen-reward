# Teen Reward MVP

## Project Summary
This project is a local Laravel + Docker MVP for a parent/teen reward system.

The first scope is to test a simple flow where:
- parents create chores
- teens complete chores
- parents approve chores
- approved chores award points
- teens redeem points for a reward
- the reward is initially represented as a voucher-style code, with a path toward UniFi integration

## Current Implementation
- Laravel app running locally via Docker/Sail
- MySQL, Redis, and Mailpit included in the Docker stack
- Basic authentication with parent/teen-style users
- Chores, chore completions, rewards, and reward redemptions models
- Simple dashboard for testing the MVP flow
- Seeded sample accounts and data for local testing

## Core Models
- User
  - role: parent or teen
  - points_balance
- Chore
  - title, description, points_value
  - assigned_to, created_by
- ChoreCompletion
  - tracks pending/approved status for chore submissions
- Reward
  - name, points_cost, duration_minutes
- RewardRedemption
  - records redeemed rewards and voucher output

## MVP Workflow
1. A teen submits a chore for approval.
2. A parent approves the chore.
3. The teen receives points.
4. The teen redeems points for a reward.
5. The app creates a voucher-style reward result.

## Intended Next Step
Connect the reward redemption flow to the UniFi controller so that a reward can create a real voucher or temporary access grant for a teen device, especially for devices that cannot redeem a portal voucher directly.

---

## UniFi Guest Portal Integration (In Progress)

### Feature Scope
- **Phase 1**: Guest voucher generation (Tier 2)
  - Teen redeems reward → UniFi generates time-limited guest voucher
  - Voucher code displayed as text + QR code
  - Basic success/failure logging
  
- **Phase 2**: Device registration (Tier 3 foundation)
  - Teens register device MAC addresses
  - Direct network access without vouchers
  - Device management endpoints

- **Phase 3**: External UniFi captive portal (initial per-device flow implemented; shared teen access planned)
  - Replace the built-in voucher entry page with a public HTTPS page hosted by this app
  - UniFi redirects a device on the guest SSID to the app's external portal and supplies connection context, including the client MAC and SSID
  - The teen signs in; the app verifies the connected MAC against UniFi and the teen's approved device
  - The current portal flow redeems a Wi-Fi reward for the one connected, approved device and grants that device time-limited access without issuing a voucher code
  - Manual voucher redemption remains available as a fallback for devices that cannot open a captive portal

#### Next Step: Shared Teen Wi-Fi Session

**Target behavior:** A teen's Wi-Fi reward creates one shared access entitlement with a fixed expiry for that teen. Every device owned by the teen and approved by a parent can use that entitlement until the same expiry. The reward is charged once; using another approved device or approving a new device during the entitlement does not charge again. A new device receives only the entitlement's remaining time. Devices with randomized/private MAC addresses remain out of scope and must use a stable MAC on this guest network.

#### Implementation Plan
1. **Define the entitlement and authorization records**
   - Treat each successful Wi-Fi redemption as a teen-level entitlement with a start time, expiry, and lifecycle/sync status; additional Wi-Fi rewards stack onto the teen's current expiry rather than a device-specific expiry.
   - Track each per-device UniFi authorization separately from the teen-level entitlement. Keep immutable snapshots of teen ID, MAC address, authorization source, authorization time, expiry, and status/error so the audit remains after a device is unregistered.
   - Preserve existing redemption history and avoid silently extending previously purchased per-device grants to every device.
2. **Apply the entitlement to devices already approved**
   - On first redemption, charge points once and create the teen-level entitlement transactionally and idempotently.
   - Find all active/approved devices for the teen and authorize those currently visible to UniFi through the remaining entitlement duration. Record success or failure per device.
   - For approved devices that are offline or not yet known to UniFi, retain the entitlement and authorize them when they next arrive through the captive portal; confirm the target controller's client lookup/authorization behavior before promising offline pre-authorization.
3. **Support devices added while an entitlement is active**
   - When the teen registers a device, keep it pending until parent approval; registration alone must never grant network access.
   - After approval, check for an unexpired teen entitlement. If one exists, authorize the new device until that entitlement's original expiry, without charging points or starting a new timer. If UniFi cannot yet see the device, apply this rule when the device first appears in the captive portal.
   - If a second already-approved device reaches the portal during an active entitlement, authorize that MAC for the remaining time and return success without showing a second reward charge. Continue to block unknown, pending, rejected, or other-teen devices.
4. **Handle expiry, removal, retries, and audit history**
   - On expiry, rely on UniFi's timed authorization where supported and reconcile stored per-device authorization states with the controller.
   - On teen unregister, revoke only that device's UniFi access and preserve the shared teen entitlement for the teen's other approved devices. Record registration, approval/rejection, portal authorization, manual/automatic authorization, expiry, revoke, and failure events with MAC snapshots and actor/source.
   - Make retries safe per entitlement and MAC. A failure for one device must not charge again, extend the shared expiry, or prevent other devices from being authorized; expose partial failures for retry/reconciliation.
5. **Test the acceptance scenarios and validate UniFi hardware**
   - Add PHPUnit coverage for first redemption, all previously approved devices, later registration plus approval, second-device portal reuse without a second charge, remaining-time calculation, ownership/approval denial, expiry, device removal, per-device API failures, repeated requests, and persistent audit history.
   - Verify the exact UniFi Network version and the API authentication/authorization methods supported by the controller. The current app uses `Art-of-WiFi/UniFi-API-client` with controller credentials; Ubiquiti's official [External Hotspot API guide](https://help.ui.com/hc/en-us/articles/31228198640023-External-Hotspot-API-for-Authorization-Clients) describes a separate Network API/key workflow that is not yet integrated.
   - With the guest SSID and pre-authorization allowlist configured, test captive redirects and timed authorization on real iOS and Android devices. Confirm the first device, an already-approved second device, and a newly approved device all stop receiving access at the same entitlement expiry. Keep voucher redemption as the tested fallback.

### Configuration
```env
UNIFI_HOST=https://unifi.example.com:8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=secret
UNIFI_SITE=default
UNIFI_ALLOW_SELF_SIGNED=true  # for dev/self-signed certs
UNIFI_API_KEY=secret          # official External Hotspot API key (planned)
```

### Database Schema Changes
- New table: `unifi_sync_logs` (tracks voucher generation attempts)
- Extended `reward_redemptions`: `voucher_code`, `voucher_expires_at`, `unifi_sync_status`, `device_mac`

### Key Implementation Details
- Service class: `App\Services\UniFiService` encapsulates all UniFi API interactions
- Synchronous voucher generation (fail fast if UniFi unavailable)
- Error handling: Fail the redemption if UniFi is down
- Credentials stored in `.env`, never logged

### Libraries
- `Art-of-WiFi/UniFi-API-client` - PHP UniFi controller client
- `bacon/bacon-qr-code` - QR code generation (optional, can use frontend library)

## Local Test Accounts
- Parent: parent@example.com
- Teen: teen@example.com
- Password for both: password

## Local Run
The app is intended to run locally with Laravel Sail:
- ./vendor/bin/sail up -d
- ./vendor/bin/sail artisan serve

## Recent changes / Notes
- Auth scaffold: Laravel Breeze (Blade) installed — provides `login`/`register` routes and views.
- Routing: `/` now returns the `welcome` view; `/dashboard` is a named route protected by `auth`.

## Language and Localization
- French (`fr`) is the application's default locale (`APP_LOCALE=fr`); English (`en`) is the fallback locale (`APP_FALLBACK_LOCALE=en`). Preserve these defaults in new environments and examples.
- Treat French and English as supported locales. Every new user-visible string must be translated into both locales in the same change; do not hard-code visible copy in Blade templates, controllers, React components, validation messages, or flash messages.
- For Laravel/Blade copy, use Laravel's translation helpers and add keyed strings to the appropriate `lang/fr/*.php` and `lang/en/*.php` files. Keep portal copy in the matching `portal.php` files. Existing JSON translation files may remain in use for existing JSON-keyed UI.
- For the React SPA, use `react-intl` message IDs and the existing `resources/js/i18n` catalogs. Add each new message's French translation to `resources/js/i18n/fr.json` and its English source text as `defaultMessage`; do not add raw JSX text.
- Preserve locale selection: Laravel-rendered pages use `app()->getLocale()`, while the React SPA uses its existing locale detection. Do not force a different per-page locale. Set the document `lang` attribute from the active locale.
- Add or update tests to check the French default and any new locale-specific rendering or messages. Run the relevant tests whenever translation strings or locale behavior changes.

## Run / Verify
Start services and serve the app:
```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan serve
```

Useful checks:
```bash
./vendor/bin/sail artisan route:list   # confirm login/register/dashboard routes
./vendor/bin/sail artisan test         # run the test suite
./vendor/bin/sail exec laravel.test ./vendor/bin/phpstan analyse --no-progress  # static analysis
```

Before submitting code or opening/updating a pull request, run PHPStan after the relevant tests and fix every reported error:

```bash
./vendor/bin/sail exec laravel.test ./vendor/bin/phpstan analyse --no-progress
```

## Local Seed
Seed the local database with the example parent/teen accounts (password: `password`):

```bash
# run only the user seeder
./vendor/bin/sail artisan db:seed --class=UserSeeder

# or recreate the database and run all seeders
./vendor/bin/sail artisan migrate:fresh --seed
```

## Notes
This file should be updated as the MVP evolves, especially if the UniFi integration or device-based access control is implemented.

## Engineering Guardrail
- Every new feature should include unit tests as part of the same change set (React behavior with frontend unit tests, backend behavior with PHPUnit tests).

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.5
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- larastan/larastan (LARASTAN) - v3
- laravel/boost (BOOST) - v2
- laravel/breeze (BREEZE) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- phpunit/phpunit (PHPUNIT) - v12
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v3

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `vendor/bin/sail npm run build`, `vendor/bin/sail npm run dev`, or `vendor/bin/sail composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `vendor/bin/sail artisan route:list`). Use `vendor/bin/sail artisan list` to discover available commands and `vendor/bin/sail artisan [command] --help` to check parameters.
- Inspect routes with `vendor/bin/sail artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `vendor/bin/sail artisan config:show app.name`, `vendor/bin/sail artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `vendor/bin/sail artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `vendor/bin/sail artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== sail rules ===

# Laravel Sail

- This project runs inside Laravel Sail's Docker containers. You MUST execute all commands through Sail.
- Start services using `vendor/bin/sail up -d` and stop them with `vendor/bin/sail stop`.
- Open the application in the browser by running `vendor/bin/sail open`.
- Always prefix PHP, Artisan, Composer, and Node commands with `vendor/bin/sail`. Examples:
    - Run Artisan Commands: `vendor/bin/sail artisan migrate`
    - Install Composer packages: `vendor/bin/sail composer install`
    - Execute Node commands: `vendor/bin/sail npm run dev`
    - Execute PHP scripts: `vendor/bin/sail php [script]`
- View all available Sail commands by running `vendor/bin/sail` without arguments.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `vendor/bin/sail artisan test --compact` with a specific filename or filter.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `vendor/bin/sail artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `vendor/bin/sail artisan list` and check their parameters with `vendor/bin/sail artisan [command] --help`.
- If you're creating a generic PHP class, use `vendor/bin/sail artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `vendor/bin/sail artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `vendor/bin/sail artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `vendor/bin/sail npm run build` or ask the user to run `vendor/bin/sail npm run dev` or `vendor/bin/sail composer run dev`.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/sail bin pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/sail bin pint --test --format agent`, simply run `vendor/bin/sail bin pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `vendor/bin/sail artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should cover all happy paths, failure paths, and edge cases.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files; these are core to the application.

## Running Tests

- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `vendor/bin/sail artisan test --compact`.
- To run all tests in a file: `vendor/bin/sail artisan test --compact tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `vendor/bin/sail artisan test --compact --filter=testName` (recommended after making a change to a related file).

</laravel-boost-guidelines>
