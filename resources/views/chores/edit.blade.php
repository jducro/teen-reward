<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">{{ __('Edit Chore') }}</h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white shadow-sm sm:rounded-lg p-6">
                <form method="POST" action="{{ route('chores.update', $chore) }}">
                    @csrf
                    @method('PUT')

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Title') }}</label>
                        <input name="title" value="{{ old('title', $chore->title) }}" class="mt-1 block w-full border rounded px-3 py-2" />
                        @error('title')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Description') }}</label>
                        <textarea name="description" class="mt-1 block w-full border rounded px-3 py-2">{{ old('description', $chore->description) }}</textarea>
                        @error('description')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Points Value') }}</label>
                        <input type="number" name="points_value" value="{{ old('points_value', $chore->points_value) }}" class="mt-1 block w-full border rounded px-3 py-2" />
                        @error('points_value')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Category') }}</label>
                        <select name="category" class="mt-1 block w-full border rounded px-3 py-2">
                            <option value="quick" @selected(old('category', $chore->category) === 'quick')>{{ __('Quick') }}</option>
                            <option value="fun" @selected(old('category', $chore->category) === 'fun')>{{ __('Fun') }}</option>
                            <option value="big" @selected(old('category', $chore->category) === 'big')>{{ __('Big reward') }}</option>
                        </select>
                        @error('category')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Recurrence') }}</label>
                        <select name="recurrence_type" class="mt-1 block w-full border rounded px-3 py-2">
                            <option value="none" @if(old('recurrence_type', $chore->recurrence_type) === 'none') selected @endif>{{ __('One-time') }}</option>
                            <option value="daily" @if(old('recurrence_type', $chore->recurrence_type) === 'daily') selected @endif>{{ __('Daily') }}</option>
                            <option value="weekly" @if(old('recurrence_type', $chore->recurrence_type) === 'weekly') selected @endif>{{ __('Weekly') }}</option>
                            <option value="monthly" @if(old('recurrence_type', $chore->recurrence_type) === 'monthly') selected @endif>{{ __('Monthly') }}</option>
                            <option value="custom" @if(old('recurrence_type', $chore->recurrence_type) === 'custom') selected @endif>{{ __('Custom') }}</option>
                        </select>
                        @error('recurrence_type')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Recurrence Interval') }}</label>
                        <input type="number" name="recurrence_interval" value="{{ old('recurrence_interval', $chore->recurrence_interval) }}" class="mt-1 block w-full border rounded px-3 py-2" />
                        @error('recurrence_interval')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium">{{ __('Recurrence Unit') }}</label>
                        <select name="recurrence_unit" class="mt-1 block w-full border rounded px-3 py-2">
                            <option value="days" @if(old('recurrence_unit', $chore->recurrence_unit) === 'days') selected @endif>{{ __('Days') }}</option>
                            <option value="weeks" @if(old('recurrence_unit', $chore->recurrence_unit) === 'weeks') selected @endif>{{ __('Weeks') }}</option>
                            <option value="months" @if(old('recurrence_unit', $chore->recurrence_unit) === 'months') selected @endif>{{ __('Months') }}</option>
                        </select>
                        @error('recurrence_unit')<div class="text-red-600 text-sm">{{ $message }}</div>@enderror
                    </div>

                    <div class="flex items-center gap-3">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded">{{ __('Save') }}</button>
                        <a href="{{ route('chores.index') }}" class="text-gray-600">{{ __('Cancel') }}</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>
