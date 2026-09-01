<?php

namespace App\Http\Controllers;

use App\Models\Chore;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ChoreController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');

        // Only parents can manage chores (create/edit/delete)
        $this->middleware(function ($request, $next) {
            if (in_array($request->route()->getName(), ['chores.index', 'chores.create', 'chores.store', 'chores.edit', 'chores.update', 'chores.destroy'])) {
                if (! Auth::user() || Auth::user()->role !== 'parent') {
                    abort(403);
                }
            }

            return $next($request);
        });
    }

    /**
     * Display a listing of the chores created by this parent.
     */
    public function index(): View
    {
        $chores = Chore::where('created_by', Auth::id())->orderBy('id', 'desc')->get();

        return view('chores.index', compact('chores'));
    }

    /**
     * Show the form for creating a new chore.
     */
    public function create(): View
    {
        return view('chores.create');
    }

    /**
     * Store a newly created chore.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points_value' => 'required|integer|min:0',
            'recurrence_type' => ['required', Rule::in(['none', 'daily', 'weekly', 'monthly', 'custom'])],
            'recurrence_interval' => 'nullable|integer|min:1',
            'recurrence_unit' => ['nullable', Rule::in(['days', 'weeks', 'months'])],
        ]);

        if ($data['recurrence_type'] !== 'custom') {
            $data['recurrence_interval'] = null;
            $data['recurrence_unit'] = null;
        }

        $data['created_by'] = Auth::id();

        Chore::create($data);

        return redirect()->route('chores.index')->with('status', __('messages.chore.created'));
    }

    /**
     * Show the form for editing the specified chore.
     */
    public function edit(Chore $chore): View
    {
        abort_unless($chore->created_by === auth()->id(), 403);

        return view('chores.edit', compact('chore'));
    }

    /**
     * Update the specified chore.
     */
    public function update(Request $request, Chore $chore): RedirectResponse
    {
        abort_unless($chore->created_by === auth()->id(), 403);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points_value' => 'required|integer|min:0',
            'recurrence_type' => ['required', Rule::in(['none', 'daily', 'weekly', 'monthly', 'custom'])],
            'recurrence_interval' => 'nullable|integer|min:1',
            'recurrence_unit' => ['nullable', Rule::in(['days', 'weeks', 'months'])],
        ]);

        if ($data['recurrence_type'] !== 'custom') {
            $data['recurrence_interval'] = null;
            $data['recurrence_unit'] = null;
        }

        $chore->update($data);

        return redirect()->route('chores.index')->with('status', __('messages.chore.updated'));
    }

    /**
     * Remove the specified chore.
     */
    public function destroy(Chore $chore): RedirectResponse
    {
        abort_unless($chore->created_by === auth()->id(), 403);

        $chore->delete();

        return redirect()->route('chores.index')->with('status', __('messages.chore.deleted'));
    }

    /**
     * Show chores available for the authenticated teen to claim.
     */
    public function assigned(): View
    {
        // show available chores for the teen to claim
        $chores = Chore::where('active', true)->orderBy('id', 'desc')->get();

        return view('chores.assigned', ['chores' => $chores]);
    }

    // alias for route naming
    public function available(): View
    {
        return $this->assigned();
    }
}
