<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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

<main class="mx-auto max-w-md px-4 py-6 sm:py-8">
	<a href="/" class="mb-4 inline-block text-sm text-primary hover:underline">← Back</a>
	<h1 class="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Your Profile</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-5">
			<div class="flex flex-col gap-2">
				<Label for="user-name">Your name</Label>
				<Input id="user-name" bind:value={name} type="text" placeholder="Alex" />
				<p class="text-xs text-muted-foreground">Used in calls: "Hi Alex, here's your reminder…"</p>
			</div>
			<div class="flex flex-col gap-2">
				<Label for="user-phone">Default phone number</Label>
				<Input id="user-phone" bind:value={phone} type="tel" placeholder="+15555550100" />
				<p class="text-xs text-muted-foreground">Auto-filled when creating reminders.</p>
			</div>
			<Button onclick={save} class="self-start {saved ? 'bg-green-600 hover:bg-green-700' : ''}">
				{saved ? 'Saved ✓' : 'Save Settings'}
			</Button>
		</CardContent>
	</Card>
</main>
