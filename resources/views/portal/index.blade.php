<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('portal.title') }}</title>
    <style>
        :root { color-scheme: light; font-family: system-ui, sans-serif; color: #172033; background: #f3f6fb; }
        body { margin: 0; padding: 24px 16px; }
        main { max-width: 520px; margin: 0 auto; padding: 28px; border-radius: 18px; background: white; box-shadow: 0 12px 36px #17203316; }
        h1 { margin-top: 0; font-size: 1.65rem; }
        p { line-height: 1.5; }
        .muted { color: #5e687b; }
        .notice { margin: 16px 0; padding: 12px 14px; border-radius: 10px; background: #edf4ff; }
        .error { background: #fff0f0; }
        label { display: block; margin: 14px 0 6px; font-weight: 600; }
        input { box-sizing: border-box; width: 100%; padding: 11px; border: 1px solid #cbd2df; border-radius: 8px; font: inherit; }
        button { width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 8px; background: #2458d3; color: white; font: inherit; font-weight: 700; cursor: pointer; }
        .reward { padding: 14px 0; border-top: 1px solid #e5e9f0; }
        .reward h2 { margin: 0 0 4px; font-size: 1.05rem; }
        .reward p { margin: 4px 0; }
        .reward button { margin-top: 8px; }
        code { overflow-wrap: anywhere; }
    </style>
</head>
<body>
<main>
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
    @elseif ($state === 'device_not_approved')
        <p>{{ __('portal.device_not_approved', ['mac' => $context['mac']]) }}</p>
    @else
        <p>{{ __('portal.connected_device') }} <strong>{{ $device->name ?: __('portal.unknown_device') }}</strong> <span class="muted">({{ $device->mac_address }})</span></p>
        <p>{{ __('portal.balance') }} <strong>{{ auth()->user()->points_balance }} {{ __('portal.points') }}</strong></p>

        @if ($activeRedemption)
            <p class="notice">{{ __('portal.access_active_until', ['time' => $activeRedemption->access_expires_at->format('H:i')]) }}</p>
        @endif

        <h2>{{ __('portal.redeem_title') }}</h2>
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
</body>
</html>
