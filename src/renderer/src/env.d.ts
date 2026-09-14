/// <reference types="vite/client" />

// injected by electron.vite.config.ts from package.json
declare const __APP_VERSION__: string

declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
	const component: DefineComponent<{}, {}, any>
	export default component
}
