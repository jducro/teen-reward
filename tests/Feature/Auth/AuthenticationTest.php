<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{

    public function test_spa_shell_can_be_rendered(): void
    {
        $response = $this->get('/');

        $response
            ->assertOk()
            ->assertSee('id="app"', false);
    }

    public function test_users_can_authenticate_using_the_api(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', __('messages.auth.logged_in'));

        $this->getJson('/api/bootstrap')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
        $response->assertStatus(422);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response
            ->assertOk()
            ->assertJsonPath('message', __('messages.auth.logged_out'));

        $this->getJson('/api/bootstrap')
            ->assertOk()
            ->assertJsonPath('user', null);
    }
}
