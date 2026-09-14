import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig(
	{ ignores: ['**/node_modules', '**/dist', '**/out', 'src/generated'] },
	tseslint.configs.recommended,
	eslintPluginVue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				ecmaFeatures: { jsx: true },
				extraFileExtensions: ['.vue'],
				parser: tseslint.parser
			}
		}
	},
	{
		files: ['**/*.{ts,mts,tsx,vue}'],
		languageOptions: { globals: { __APP_VERSION__: 'readonly' } },
		rules: {
			'vue/require-default-prop': 'off',
			'vue/multi-word-component-names': 'off',
			'vue/block-lang': ['error', { script: { lang: 'ts' } }],
			'@typescript-eslint/explicit-function-return-type': 'off'
		}
	},
	{
		files: ['*.js', '*.cjs'],
		rules: { '@typescript-eslint/no-require-imports': 'off' }
	},
	eslintConfigPrettier
)
