<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @if ($state === 'client_pending')
        <meta http-equiv="refresh" content="10">
    @endif
    <title>{{ __('portal.title') }}</title>
    <style>
        :root { color-scheme: light; font-family: 'Nunito', system-ui, sans-serif; color: #333; background: #fff8f0; }
        * { box-sizing: border-box; }
        body { min-height: 100vh; margin: 0; padding: 28px 16px; background: #fff8f0; }
        main { width: 100%; max-width: 480px; margin: 0 auto; padding: 24px; border: 3px solid #ffd93d; border-radius: 24px; background: #fff; box-shadow: 0 8px 28px rgba(0,0,0,.08); }
        .brand { display: flex; align-items: center; gap: 9px; margin-bottom: 22px; color: #ff6b6b; font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .brand-mark { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 12px; background: #ffd93d; color: #333; font-size: 20px; }
        h1 { margin: 0 0 12px; color: #333; font-size: 1.7rem; font-weight: 900; line-height: 1.15; }
        h2 { color: #333; font-weight: 900; }
        p { line-height: 1.55; }
        .muted { color: #777; }
        .notice { margin: 16px 0; padding: 12px 14px; border-radius: 14px; background: #fff4d6; font-weight: 700; }
        .error { background: #ffebeb; color: #a83333; }
        label { display: block; margin: 14px 0 6px; color: #555; font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
        input { width: 100%; padding: 12px 14px; border: 2px solid #ffe8b3; border-radius: 12px; background: #fffdfa; color: #333; font: inherit; }
        input:focus { outline: 3px solid rgba(255,217,61,.45); border-color: #ffb347; }
        button { width: 100%; margin-top: 14px; padding: 13px 16px; border: 0; border-radius: 14px; background: linear-gradient(135deg, #ff6b6b, #ff9f43); color: white; font: inherit; font-weight: 900; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,107,.2); }
        button:hover { filter: brightness(1.04); }
        .secondary-button { border: 2px solid #ffe8b3; background: white; color: #555; box-shadow: none; }
        .reward { padding: 16px 0; border-top: 2px solid #fff1d3; }
        .reward h2 { margin: 0 0 4px; font-size: 1.05rem; }
        .reward p { margin: 4px 0; }
        .reward button { margin-top: 8px; }
        code { overflow-wrap: anywhere; }
        @media (max-width: 420px) { body { padding: 16px 12px; } main { padding: 20px; border-radius: 20px; } }
    </style>
</head>
<body>
<main>
    <div class="brand"><span class="brand-mark" aria-hidden="true">⭐</span><span>teen-reward</span></div>
    <h1>{{ __('portal.title') }}</h1>

    @if (session('status'))
        <p class="notice">{{ session('status') }}</p>
    @endif
    @if ($errors->any())
        <div class="notice error" role="alert">{{ $errors->first() }}</div>
    @endif

    @if ($state === 'invalid_context')
        <p>{{ __('portal.invalid_context') }}</p>
    @elseif ($state === 'login')
        <p>{{ __('portal.sign_in_intro', ['ssid' => $context['ssid']]) }}</p>
        <form method="POST" action="{{ isset($context['site']) && $context['site'] !== null ? route('portal.external.login', ['site' => $context['site']]) : route('portal.login') }}">
            @csrf
            <label for="email">{{ __('portal.email') }}</label>
            <input id="email" name="email" type="email" autocomplete="username" required>
            <label for="password">{{ __('portal.password') }}</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required>
            <button type="submit">{{ __('portal.sign_in') }}</button>
        </form>
    @elseif ($state === 'teen_only')
        <p>{{ __('portal.teen_only') }}</p>
        <form method="POST" action="{{ isset($context['site']) && $context['site'] !== null ? route('portal.external.logout', ['site' => $context['site']]) : route('portal.logout') }}">
            @csrf
            <button type="submit">{{ __('portal.logout_action') }}</button>
        </form>
    @elseif ($state === 'device_not_approved')
        <p>{{ __('portal.device_not_approved', ['mac' => $context['mac']]) }}</p>
    @elseif ($state === 'device_unavailable')
        <p>{{ __('portal.device_unavailable', ['mac' => $context['mac']]) }}</p>
    @elseif ($state === 'client_pending')
        <p>{{ __('portal.client_pending') }}</p>
        <p class="notice" aria-live="off">
            {{ __('portal.retry_in') }}
            <strong><span id="portal-retry-countdown">10</span> {{ __('portal.seconds') }}</strong>
        </p>
    @elseif ($state === 'confirm_device')
        <p class="notice">{{ __('portal.current_account', ['email' => auth()->user()->email]) }}</p>
        <p>{{ __('portal.confirm_device_intro', ['mac' => $context['mac']]) }}</p>
        <form method="POST" action="{{ isset($context['site']) && $context['site'] !== null ? route('portal.external.device.confirm', ['site' => $context['site']]) : route('portal.device.confirm') }}">
            @csrf
            <button type="submit">{{ __('portal.confirm_device_action') }}</button>
        </form>
        <form method="POST" action="{{ isset($context['site']) && $context['site'] !== null ? route('portal.external.logout', ['site' => $context['site']]) : route('portal.logout') }}">
            @csrf
            <button type="submit" class="secondary-button">{{ __('portal.logout_action') }}</button>
        </form>
    @else
        <p>{{ __('portal.connected_device') }} <strong>{{ $device->name ?: __('portal.unknown_device') }}</strong> <span class="muted">({{ $device->mac_address }})</span></p>
        <p>{{ __('portal.balance') }} <strong>{{ auth()->user()->points_balance }} {{ __('portal.points') }}</strong></p>

        @if ($activeRedemption)
            <p class="notice">{{ __('portal.access_active_until', ['time' => $activeRedemption->access_expires_at->format('H:i')]) }}</p>
            <h2>{{ __('portal.redeem_title') }}</h2>
        @else
            <p class="notice">{{ __('portal.choose_reward_prompt') }}</p>
            <h2>{{ __('portal.choose_reward_title') }}</h2>
        @endif

        @forelse ($rewards as $reward)
            <section class="reward">
                <h2>{{ $reward->emoji }} {{ $reward->name }}</h2>
                <p class="muted">{{ __('portal.reward_cost_duration', ['points' => $reward->points_cost, 'duration' => $reward->duration_minutes]) }}</p>
                <form method="POST" action="{{ isset($context['site']) && $context['site'] !== null ? route('portal.external.redeem', ['site' => $context['site']]) : route('portal.redeem') }}">
                    @csrf
                    <input type="hidden" name="reward_id" value="{{ $reward->id }}">
                    <input type="hidden" name="request_key" value="{{ (string) \Illuminate\Support\Str::uuid() }}">
                    <button type="submit">{{ __('portal.redeem_action') }}</button>
                </form>
            </section>
        @empty
            <p class="muted">{{ __('portal.no_rewards') }}</p>
        @endforelse
    @endif
</main>
@if ($state === 'client_pending')
    <script>
        (() => {
            const countdown = document.getElementById('portal-retry-countdown');
            let secondsRemaining = 10;

            window.setInterval(() => {
                secondsRemaining = Math.max(0, secondsRemaining - 1);
                countdown.textContent = String(secondsRemaining);
            }, 1000);
        })();
    </script>
@endif
</body>
</html>
