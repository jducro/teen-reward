<?php

use App\Http\Controllers\Api\AppBootstrapController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChoreController;
use App\Http\Controllers\Api\ClaimController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\TeenController;
use Illuminate\Support\Facades\Route;

Route::get('/bootstrap', AppBootstrapController::class)->name('api.bootstrap');

Route::middleware('guest')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
    Route::post('/register', [AuthController::class, 'register'])->name('api.register');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('api.profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('api.profile.password');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('api.profile.destroy');

    Route::post('/chores', [ChoreController::class, 'store'])->name('api.chores.store');
    Route::put('/chores/{chore}', [ChoreController::class, 'update'])->name('api.chores.update');
    Route::delete('/chores/{chore}', [ChoreController::class, 'destroy'])->name('api.chores.destroy');
    Route::post('/chores/{chore}/claim', [ClaimController::class, 'store'])->name('api.chores.claim');

    Route::post('/claims/{claim}/approve', [ClaimController::class, 'approve'])->name('api.claims.approve');
    Route::post('/claims/{claim}/reject', [ClaimController::class, 'reject'])->name('api.claims.reject');

    Route::post('/teens', [TeenController::class, 'store'])->name('api.teens.store');
    Route::put('/teens/{teen}', [TeenController::class, 'update'])->name('api.teens.update');
    Route::patch('/teens/{teen}/points', [TeenController::class, 'updatePoints'])->name('api.teens.points.update');
    Route::delete('/teens/{teen}', [TeenController::class, 'destroy'])->name('api.teens.destroy');

    Route::post('/rewards', [RewardController::class, 'store'])->name('api.rewards.store');
    Route::put('/rewards/{reward}', [RewardController::class, 'update'])->name('api.rewards.update');
    Route::delete('/rewards/{reward}', [RewardController::class, 'destroy'])->name('api.rewards.destroy');
    Route::post('/rewards/{reward}/redeem', [RewardController::class, 'redeem'])->name('api.rewards.redeem');

    // Device routes - pending must come before apiResource to avoid route matching issues
    Route::get('/devices/pending', [DeviceController::class, 'pending'])->name('api.devices.pending');
    Route::apiResource('devices', DeviceController::class)
        ->only(['index', 'store', 'show', 'destroy'])
        ->names('api.devices');
    Route::put('/devices/{device}/approve', [DeviceController::class, 'approve'])->name('api.devices.approve');
    Route::put('/devices/{device}/reject', [DeviceController::class, 'reject'])->name('api.devices.reject');
});
