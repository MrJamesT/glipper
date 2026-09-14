<template>
	<div class="flex flex-1 flex-col items-center justify-center py-24 text-center">
		<div
			class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary-400"
		>
			<i :class="icon" class="text-2xl" />
		</div>
		<h2 class="text-xl font-semibold">{{ title }}</h2>
		<p class="mt-2 max-w-sm text-sm text-zinc-400">{{ description }}</p>
		<div class="mt-6 flex gap-2">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ icon: string; title: string; description: string }>()
</script>
