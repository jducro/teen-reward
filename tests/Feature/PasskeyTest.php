<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Passkeys;
use Tests\TestCase;

class PasskeyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_guest_can_request_passkey_login_options(): void
    {
        config(['passkeys.relying_party_id' => 'localhost', 'passkeys.allowed_origins' => ['http://localhost']]);

        $this->getJson('/passkeys/login/options')
            ->assertOk()
            ->assertJsonStructure(['options']);
    }

    public function test_user_must_confirm_password_before_registering_a_passkey(): void
    {
        $user = User::factory()->create(['password' => 'password']);

        $this->actingAs($user)
            ->getJson('/user/passkeys/options')
            ->assertStatus(423);

        $this->postJson('/api/passkeys/confirm-password', ['password' => 'wrong-password'])
            ->assertUnprocessable();

        $this->postJson('/api/passkeys/confirm-password', ['password' => 'password'])
            ->assertOk()
            ->assertJsonPath('message', __('messages.passkeys.confirmed'));

        $this->getJson('/user/passkeys/options')
            ->assertOk()
            ->assertJsonStructure(['options']);
    }

    public function test_guest_cannot_confirm_password_for_passkey_management(): void
    {
        $this->postJson('/api/passkeys/confirm-password', ['password' => 'password'])
            ->assertUnauthorized();
    }

    public function test_parent_passkey_is_rejected_for_the_teen_only_portal(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $passkey = new Passkey;
        $passkey->setRelation('user', $parent);
        $request = Request::create('/passkeys/login', 'POST');
        $request->setLaravelSession(app('session.store'));
        $request->session()->put('external_portal', ['mac' => 'aa:bb:cc:dd:ee:ff']);

        $this->assertFalse(Passkeys::allowsLogin($request, $passkey));

        $teen = User::factory()->create(['role' => 'teen']);
        $teenPasskey = new Passkey;
        $teenPasskey->setRelation('user', $teen);

        $this->assertTrue(Passkeys::allowsLogin($request, $teenPasskey));
        $this->assertSame('aa:bb:cc:dd:ee:ff', $request->session()->get('external_portal_login_mac'));
    }
}
