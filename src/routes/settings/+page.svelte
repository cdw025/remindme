<script lang="ts">
	import { onMount } from 'svelte';

	let name = $state('');
	let phone = $state('');
	let saved = $state(false);

	onMount(() => {
		name = localStorage.getItem('userName') ?? '';
		phone = localStorage.getItem('defaultPhone') ?? '';
	});

	function save() {
		localStorage.setItem('userName', name);
		localStorage.setItem('defaultPhone', phone);
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}
</script>

<svelte:head>
	<title>Settings · RemindMe</title>
</svelte:head>

<main>
	<a href="/" class="back">← Back</a>
	<h1>Settings</h1>

	<section class="card">
		<label>
			Your name
			<input bind:value={name} type="text" placeholder="Alex" />
			<span class="hint">Used in calls: "Hi Alex, here's your reminder…"</span>
		</label>
		<label>
			Default phone number
			<input bind:value={phone} type="tel" placeholder="+15555550100" />
			<span class="hint">Auto-filled when creating reminders.</span>
		</label>
		<button onclick={save} class:saved>
			{saved ? 'Saved ✓' : 'Save Settings'}
		</button>
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
		max-width: 480px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.back {
		display: inline-block;
		color: #667eea;
		text-decoration: none;
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}

	.back:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 1.5rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.hint {
		font-size: 0.78rem;
		color: #a0aec0;
		font-weight: 400;
	}

	button {
		padding: 0.6rem 1.25rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		align-self: flex-start;
	}

	button:hover {
		background: #5a67d8;
	}

	button.saved {
		background: #38a169;
	}
</style>
