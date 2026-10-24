<?php

use App\Http\Controllers\ExternalPortalController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(base_path('routes/api.php'));

Route::get('/portal', [ExternalPortalController::class, 'show'])->middleware('throttle:120,1')->name('portal.show');
Route::post('/portal/login', [ExternalPortalController::class, 'login'])->middleware(['guest', 'throttle:20,1'])->name('portal.login');
Route::post('/portal/device/confirm', [ExternalPortalController::class, 'confirmDevice'])->middleware(['auth', 'throttle:10,1'])->name('portal.device.confirm');
Route::post('/portal/logout', [ExternalPortalController::class, 'logout'])->middleware(['auth', 'throttle:10,1'])->name('portal.logout');
Route::post('/portal/redeem', [ExternalPortalController::class, 'redeem'])->middleware(['auth', 'throttle:5,1'])->name('portal.redeem');

Route::prefix('/guest/s/{site}')
    ->where(['site' => '[A-Za-z0-9_-]+'])
    ->group(function (): void {
        Route::get('/', [ExternalPortalController::class, 'show'])->middleware('throttle:120,1')->name('portal.external.show');
        Route::post('/login', [ExternalPortalController::class, 'login'])->middleware(['guest', 'throttle:20,1'])->name('portal.external.login');
        Route::post('/device/confirm', [ExternalPortalController::class, 'confirmDevice'])->middleware(['auth', 'throttle:10,1'])->name('portal.external.device.confirm');
        Route::post('/logout', [ExternalPortalController::class, 'logout'])->middleware(['auth', 'throttle:10,1'])->name('portal.external.logout');
        Route::post('/redeem', [ExternalPortalController::class, 'redeem'])->middleware(['auth', 'throttle:5,1'])->name('portal.external.redeem');
    });

Route::view('/{path?}', 'app')
    ->where('path', '^(?!api).*$')
    ->name('spa');
