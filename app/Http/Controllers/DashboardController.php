<?php

namespace App\Http\Controllers;

use App\Models\Chore;
use App\Models\Reward;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(): View
    {
        $user = Auth::user();

        return view('dashboard', [
            'user' => $user,
            'chores' => Chore::with('completions')->get(),
            'rewards' => Reward::all(),
        ]);
    }
}
