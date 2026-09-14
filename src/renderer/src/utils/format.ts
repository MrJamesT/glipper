export function formatSize(sizeMB: number) {
	if (sizeMB < 1) return `${Math.round(sizeMB * 1024)} KB`
	if (sizeMB < 1024) return `${Math.round(sizeMB)} MB`
	return `${(sizeMB / 1024).toFixed(1)} GB`
}

export function pluralClips(count: number) {
	return `${count} ${count === 1 ? 'clip' : 'clips'}`
}

export function formatSeconds(seconds: number) {
	const total = Math.max(0, Math.floor(seconds))
	const m = Math.floor(total / 60)
	const s = total % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

// Media elements need a real URL; a bare path resolves against the page origin and breaks in dev
export function toFileUrl(...parts: string[]) {
	const joined = parts.join('/').replace(/\\/g, '/')
	const withRoot = joined.startsWith('/') ? joined : '/' + joined
	return 'file://' + encodeURI(withRoot).replace(/#/g, '%23').replace(/\?/g, '%3F')
}
