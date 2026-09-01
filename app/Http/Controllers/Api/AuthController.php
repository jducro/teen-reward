<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * @throws ValidationException
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', Rule::in(['parent', 'teen'])],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => __('messages.auth.account_created'),
            'csrfToken' => csrf_token(),
        ], 201);
    }

    /**
     * @throws ValidationException
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => __('messages.auth.logged_in'),
            'csrfToken' => csrf_token(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var StatefulGuard $guard */
        $guard = Auth::guard('web');
        $guard->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => __('messages.auth.logged_out'),
            'csrfToken' => csrf_token(),
        ]);
    }
}
