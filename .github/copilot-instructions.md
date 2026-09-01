# Copilot instructions for `teen-reward`

## Build, test, and lint commands

Use existing project commands only:

- Frontend build: `npm run build`
- Frontend type check: `npm run type-check`
- Full backend test suite: `php artisan test` (or `composer test`)
- Run one test file: `php artisan test tests/Feature/MvpFlowTest.php`
- Run one test method: `php artisan test --filter=test_parent_can_approve_a_chore_and_teen_can_redeem_a_voucher_reward`
- PHP formatting/lint check: `vendor/bin/pint --test`
- PHP formatting/auto-fix: `vendor/bin/pint` (run this before every commit)
- Static analysis: `vendor/bin/phpstan analyse --configuration=phpstan.neon --memory-limit=1G`

For Docker/Sail workflows used in this repo, run equivalents with `./vendor/bin/sail ...` (for example `./vendor/bin/sail artisan test`).

**Before committing any PHP changes, always run Pint to fix formatting:**
```bash
./vendor/bin/sail bin pint --dirty --format agent
```
A git pre-commit hook enforces this automatically, but agents must also run it manually before staging files for a commit.

## High-level architecture

- Routing is intentionally consolidated:
  - `bootstrap/app.php` loads `routes/web.php` and does **not** wire `routes/auth.php`.
  - `routes/web.php` mounts JSON API routes under `/api` by grouping `routes/api.php`.
  - Non-API paths render the SPA shell (`resources/views/app.blade.php`) via a catch-all route.
- Auth is session + CSRF based, not token based:
  - API auth endpoints are in `App\Http\Controllers\Api\AuthController`.
  - API responses frequently return `csrfToken`; the frontend request helper updates the `<meta name="csrf-token">` value (`resources/js/legacy/spa/api.js`).
- Core reward loop is API-first and role-gated in controllers:
  - Parent-only chore CRUD in `Api\ChoreController`.
  - Teen claim creation + parent approve/reject in `Api\ClaimController`.
  - Teen reward redemption in `Api\RewardController` (deducts `users.points_balance`, creates `reward_redemptions`, then generates a voucher code).
  - SPA hydration endpoint `Api\AppBootstrapController` returns a composite payload (`user`, `stats`, `chores`, `claims`, `rewards`, `redemptions`).
- Recurrence behavior spans schema and controller logic:
  - Chore recurrence fields are added in `2026_07_01_000001_alter_chores_add_recurrence.php`.
  - Claim period tracking is in `chore_claims.period_start`.
  - Period calculation (daily/weekly/monthly/custom anchored from `created_at`) is in `Api\ClaimController`.
- Tests are API-centric and avoid Vite rendering:
  - Feature tests exercise `/api/*` flows directly.
  - `tests/TestCase.php` calls `$this->withoutVite()`.

## Key conventions in this codebase

- Authorization conventions:
  - Role checks are implemented inline in controllers with `abort_unless(..., 403)` and ownership checks, not via policies/gates.
- Data-shape conventions between backend and frontend:
  - Database fields stay snake_case (for example `points_value`, `points_balance`), while bootstrap JSON maps to camelCase keys for the SPA (`pointsValue`, `pointsBalance`).
  - If API payload shape changes, update both `Api\AppBootstrapController` and the API-driven frontend consumers in `resources/js/legacy`.
- Validation and model conventions:
  - Most domain models (`Chore`, `ChoreClaim`, `ChoreCompletion`, `Reward`, `RewardRedemption`) use `protected $guarded = [];`.
  - Safety is enforced by controller/request validation; preserve strict validation when adding writable fields.
- API response-message conventions:
  - Several tests assert exact response messages (for example `Logged in.`, `Profile updated.`, `Claim approved.`, `Account deleted.`). Keep message text stable unless tests are updated intentionally.
- Frontend organization currently has two tracks:
  - `resources/js/*` contains a lightweight/demo SPA path.
  - `resources/js/legacy/*` contains the fuller API-driven SPA (auth + dashboard + API helper + sections).
  - For reward-flow/API work, align with the legacy API-driven path and its expected payloads.
- Frontend language/tooling:
  - TypeScript tooling is enabled (tsconfig + `npm run type-check`).
  - Existing frontend files are still largely JavaScript/JSX; prefer TypeScript for new frontend modules and incremental migrations.
- i18n conventions:
  - Localization uses `react-intl` with locale detection in `resources/js/i18n/messages.ts`.
  - French translations live in `resources/js/i18n/fr.json`.
  - **All user-visible strings MUST use `intl.formatMessage()`** — never hardcode text directly in JSX. This applies to labels, buttons, headings, error messages, status labels, placeholder text, and any visible string.
  - Always add the key to `resources/js/i18n/fr.json` with a French translation.
  - Always include a `defaultMessage` in English as a fallback (used when locale is `en`).
  - Key naming convention: `domain.context.identifier` (e.g. `shop.form.rewardName`, `common.action.cancel`).
- Seeded local demo users expected by current docs/workflows:
  - `parent@example.com` / `password`
  - `teen@example.com` / `password`
