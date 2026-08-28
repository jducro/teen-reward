<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ProfileTest extends TestCase
{

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson('/api/bootstrap');

        $response
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', __('messages.profile.updated'));

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', __('messages.profile.updated'));

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->deleteJson('/api/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', __('messages.profile.account_deleted'));

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->deleteJson('/api/profile', [
                'password' => 'wrong-password',
            ]);

        $response->assertStatus(422);

        $this->assertNotNull($user->fresh());
    }
}
