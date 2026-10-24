<?php

namespace App\Providers;

use App\Http\Responses\PasskeyLoginResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Passkeys;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PasskeyLoginResponseContract::class, PasskeyLoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passkeys::authorizeLoginUsing(static function (Request $request, PasskeyUser $user, Passkey $passkey): bool {
            $portalContext = $request->session()->get('external_portal');
            if (! is_array($portalContext)) {
                return true;
            }

            if ($user instanceof User && $user->role !== 'teen') {
                return false;
            }

            $mac = $portalContext['mac'] ?? null;
            if (is_string($mac)) {
                $request->session()->put('external_portal_login_mac', $mac);
            }

            return true;
        });
    }
}
