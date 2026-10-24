<?php

use App\Http\Controllers\ExternalPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(base_path('routes/api.php'));

Route::get('/portal', [ExternalPortalController::class, 'show'])->middleware('throttle:60,1')->name('portal.show');
Route::post('/portal/login', [ExternalPortalController::class, 'login'])->middleware(['guest', 'throttle:6,1'])->name('portal.login');
Route::post('/portal/redeem', [ExternalPortalController::class, 'redeem'])->middleware(['auth', 'throttle:5,1'])->name('portal.redeem');

Route::view('/{path?}', 'app')
    ->where('path', '^(?!api).*$')
    ->name('spa');
