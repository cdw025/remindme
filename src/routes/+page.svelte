<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';

	type Reminder = {
		id: number;
		label: string;
		phone: string;
		scheduledAt: string | number;
		fired: boolean;
		createdAt: string | number;
	};

	let reminders: Reminder[] = $state([]);
	let loading = $state(false);
	let error = $state('');

	// Form state
	let label = $state('');
	let phone = $state('');
	let scheduledAt = $state('');

	// Settings
	let defaultPhone = $state('');
	let userName = $state('');

	function loadSettings() {
		defaultPhone = localStorage.getItem('defaultPhone') ?? '';
		userName = localStorage.getItem('userName') ?? '';
	}

	// Edit state
	let editingId: number | null = $state(null);
	let editLabel = $state('');
	let editPhone = $state('');
	let editScheduledAt = $state('');

	let totalReminders = $state(0);

	async function fetchReminders() {
		const res = await fetch('/api/reminders');
		const data = await res.json();
		reminders = data.items ?? data;
		totalReminders = data.total ?? reminders.length;
	}

	async function createReminder() {
		if (!label || !scheduledAt) return;
		if (!defaultPhone) {
			error = 'Please set a default phone number in Settings first.';
			return;
		}
		loading = true;
		error = '';
		try {
			const localDate = new Date(scheduledAt);
			const res = await fetch('/api/reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ label, phone: defaultPhone, callerName: userName, scheduledAt: localDate.toISOString() })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error ?? 'Failed to create reminder.';
			} else {
				label = '';
				scheduledAt = '';
				await fetchReminders();
			}
		} finally {
			loading = false;
		}
	}

	async function deleteReminder(id: number) {
		await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
		await fetchReminders();
	}

	function startEdit(r: Reminder) {
		editingId = r.id;
		editLabel = r.label;
		editPhone = r.phone;
		const d = new Date(r.scheduledAt);
		editScheduledAt = toDatetimeLocal(d);
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		const res = await fetch(`/api/reminders/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				label: editLabel,
				phone: editPhone,
				scheduledAt: new Date(editScheduledAt).toISOString()
			})
		});
		if (res.ok) {
			editingId = null;
			await fetchReminders();
		}
	}

	function toDatetimeLocal(d: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function formatDate(val: string | number): string {
		return new Date(val).toLocaleString();
	}

	function nowLocal(): string {
		return toDatetimeLocal(new Date());
	}

	onMount(() => {
		loadSettings();
		fetchReminders();
	});
</script>

<svelte:head>
	<title>RemindMe</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-6 sm:py-8">
	<div class="mb-6 flex items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">RemindMe</h1>
			<p class="mt-1 text-sm text-muted-foreground">Schedule a reminder — we'll call you when it's time.</p>
		</div>
		<a href="/settings" class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">⚙ Settings</a>
	</div>

	<Card class="mb-6">
		<CardHeader>
			<CardTitle class="text-lg">New Reminder</CardTitle>
		</CardHeader>
		<CardContent>
			<form onsubmit={(e) => { e.preventDefault(); createReminder(); }} class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="reminder-label">What's the reminder for?</Label>
					<Input id="reminder-label" bind:value={label} type="text" placeholder="Take your medication" required />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="reminder-time">When should we call?</Label>
					<Input id="reminder-time" bind:value={scheduledAt} type="datetime-local" min={nowLocal()} required />
				</div>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				<Button type="submit" disabled={loading} class="self-start">
					{loading ? 'Saving…' : 'Schedule Reminder'}
				</Button>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<div class="flex items-baseline gap-3">
				<CardTitle class="text-lg">Your Reminders</CardTitle>
				{#if totalReminders > reminders.length}
					<span class="text-xs text-muted-foreground">showing {reminders.length} of {totalReminders}</span>
				{/if}
			</div>
		</CardHeader>
		<CardContent>
			{#if reminders.length === 0}
				<p class="py-4 text-center text-muted-foreground">No reminders yet. Create one above!</p>
			{:else}
				<ul class="flex flex-col gap-3">
					{#each reminders as r (r.id)}
						<li class="flex flex-col gap-2 rounded-lg bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 {r.fired ? 'opacity-60' : ''}">
							{#if editingId === r.id}
								<div class="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
									<Input bind:value={editLabel} type="text" class="sm:min-w-[120px] sm:flex-1" />
									<Input bind:value={editPhone} type="tel" class="sm:min-w-[120px] sm:flex-1" />
									<Input bind:value={editScheduledAt} type="datetime-local" class="sm:min-w-[120px] sm:flex-1" />
									<div class="flex gap-2">
										<Button size="sm" variant="outline" onclick={() => saveEdit(r.id)}>Save</Button>
										<Button size="sm" variant="ghost" onclick={cancelEdit}>Cancel</Button>
									</div>
								</div>
							{:else}
								<div class="flex min-w-0 flex-col gap-0.5">
									<span class="truncate font-semibold">{r.label}</span>
									<span class="text-xs text-muted-foreground">
										{formatDate(r.scheduledAt)} · {r.phone}
									</span>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									{#if r.fired}
										<Badge variant="secondary" class="bg-emerald-900/40 text-emerald-400">Called ✓</Badge>
									{:else}
										<Badge variant="secondary" class="bg-sky-900/40 text-sky-400">Pending</Badge>
										<Button size="sm" variant="ghost" class="text-sky-400 hover:text-sky-300" onclick={() => startEdit(r)}>Edit</Button>
									{/if}
									<Button size="sm" variant="ghost" class="text-destructive hover:text-destructive" onclick={() => deleteReminder(r.id)}>Delete</Button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</main>
