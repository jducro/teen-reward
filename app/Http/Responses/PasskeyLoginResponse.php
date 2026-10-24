<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    public function toResponse($request): Response
    {
        $portalContext = $request->session()->get('external_portal');
        $redirectUrl = is_array($portalContext)
            ? (is_string($portalContext['site'] ?? null)
                ? route('portal.external.show', ['site' => $portalContext['site']])
                : route('portal.show'))
            : url('/');

        if ($request->wantsJson()) {
            return new JsonResponse(['redirect' => $redirectUrl]);
        }

        return redirect()->to($redirectUrl);
    }
}
