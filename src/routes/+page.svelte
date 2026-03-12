<script lang="ts">
	import { onMount } from 'svelte';

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
	let settingsOpen = $state(false);
	let settingsSaved = $state(false);

	function loadSettings() {
		defaultPhone = localStorage.getItem('defaultPhone') ?? '';
		if (defaultPhone && !phone) phone = defaultPhone;
	}

	function saveSettings() {
		localStorage.setItem('defaultPhone', defaultPhone);
		if (!phone) phone = defaultPhone;
		settingsSaved = true;
		setTimeout(() => (settingsSaved = false), 2000);
	}

	// Edit state
	let editingId: number | null = $state(null);
	let editLabel = $state('');
	let editPhone = $state('');
	let editScheduledAt = $state('');

	async function fetchReminders() {
		const res = await fetch('/api/reminders');
		reminders = await res.json();
	}

	async function createReminder() {
		if (!label || !scheduledAt) return;
		if (!defaultPhone) {
			error = 'Please set a default phone number in Settings first.';
			settingsOpen = true;
			return;
		}
		loading = true;
		error = '';
		try {
			const localDate = new Date(scheduledAt);
			const res = await fetch('/api/reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ label, phone: defaultPhone, scheduledAt: localDate.toISOString() })
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

<main>
	<div class="top-bar">
		<div>
			<h1>RemindMe</h1>
			<p class="subtitle">Schedule a reminder — we'll call you when it's time.</p>
		</div>
		<button class="btn-settings" onclick={() => (settingsOpen = !settingsOpen)}>⚙ Settings</button>
	</div>

	{#if settingsOpen}
		<section class="card">
			<h2>Settings</h2>
			<label>
				Default phone number
				<input bind:value={defaultPhone} type="tel" placeholder="+15555550100" />
			</label>
			<button class="btn-save-settings" onclick={saveSettings}>
				{settingsSaved ? 'Saved ✓' : 'Save'}
			</button>
		</section>
	{/if}

	<section class="card">
		<h2>New Reminder</h2>
		<form onsubmit={(e) => { e.preventDefault(); createReminder(); }}>
			<label>
				What's the reminder for?
				<input bind:value={label} type="text" placeholder="Take your medication" required />
			</label>
			<label>
				When should we call?
				<input bind:value={scheduledAt} type="datetime-local" min={nowLocal()} required />
			</label>
			{#if error}
				<p class="error">{error}</p>
			{/if}
			<button type="submit" disabled={loading}>
				{loading ? 'Saving…' : 'Schedule Reminder'}
			</button>
		</form>
	</section>

	<section class="card">
		<h2>Your Reminders</h2>
		{#if reminders.length === 0}
			<p class="empty">No reminders yet. Create one above!</p>
		{:else}
			<ul class="reminder-list">
				{#each reminders as r (r.id)}
					<li class:fired={r.fired}>
						{#if editingId === r.id}
							<div class="edit-form">
								<input bind:value={editLabel} type="text" />
								<input bind:value={editPhone} type="tel" />
								<input bind:value={editScheduledAt} type="datetime-local" />
								<div class="edit-actions">
								<button onclick={() => saveEdit(r.id)} class="btn-save">Save</button>
								<button onclick={cancelEdit} class="btn-cancel">Cancel</button>
								</div>
							</div>
						{:else}
							<div class="reminder-info">
								<span class="reminder-label">{r.label}</span>
								<span class="reminder-meta">
									{formatDate(r.scheduledAt)} · {r.phone}
								</span>
							</div>
							<div class="reminder-actions">
								{#if r.fired}
									<span class="badge fired">Called ✓</span>
								{:else}
									<span class="badge pending">Pending</span>
									<button onclick={() => startEdit(r)} class="btn-edit">Edit</button>
								{/if}
								<button onclick={() => deleteReminder(r.id)} class="btn-delete">Delete</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #f0f4f8;
		color: #1a202c;
	}

	main {
		max-width: 640px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
	}

	.top-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0;
	}

	.btn-settings {
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
		cursor: pointer;
		color: #4a5568;
		margin-top: 0.4rem;
	}

	.btn-settings:hover {
		background: #f7fafc;
	}

	.btn-save-settings {
		margin-top: 0.75rem;
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-save-settings:hover {
		background: #5a67d8;
	}

	.subtitle {
		color: #718096;
		margin: 0.25rem 0 1.5rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		font-weight: 600;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #4a5568;
	}

	input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.15s;
	}

	input:focus {
		border-color: #667eea;
	}

	button[type='submit'] {
		margin-top: 0.5rem;
		padding: 0.6rem 1.25rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	button[type='submit']:hover:not(:disabled) {
		background: #5a67d8;
	}

	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #e53e3e;
		font-size: 0.875rem;
		margin: 0;
	}

	.empty {
		color: #a0aec0;
		text-align: center;
		padding: 1rem 0;
	}

	.reminder-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	li {
		background: #f7fafc;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	li.fired {
		opacity: 0.6;
	}

	.reminder-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.reminder-label {
		font-weight: 600;
	}

	.reminder-meta {
		font-size: 0.8rem;
		color: #718096;
	}

	.reminder-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-weight: 600;
	}

	.badge.pending {
		background: #ebf8ff;
		color: #2b6cb0;
	}

	.badge.fired {
		background: #f0fff4;
		color: #276749;
	}

	.btn-edit,
	.btn-delete,
	.btn-save,
	.btn-cancel {
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
	}

	.btn-edit {
		background: #ebf8ff;
		color: #2b6cb0;
	}

	.btn-delete {
		background: #fff5f5;
		color: #c53030;
	}

	.btn-save {
		background: #f0fff4;
		color: #276749;
	}

	.btn-cancel {
		background: #f7fafc;
		color: #4a5568;
	}

	.edit-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		width: 100%;
	}

	.edit-form input {
		flex: 1;
		min-width: 120px;
	}

	.edit-actions {
		display: flex;
		gap: 0.4rem;
	}
</style>
