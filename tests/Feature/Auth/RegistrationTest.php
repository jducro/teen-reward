<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class RegistrationTest extends TestCase
{

    public function test_new_users_can_register_through_the_api(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'parent',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', __('messages.auth.account_created'));

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'parent',
        ]);

        $this->getJson('/api/bootstrap')
            ->assertOk()
            ->assertJsonPath('user.email', 'test@example.com');
    }
}
