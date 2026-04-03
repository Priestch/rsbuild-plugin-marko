# AGENTS.md

This document provides guidelines for agents working on the rsbuild-plugin-marko codebase.

## Build, Lint, and Test Commands

### Package Manager
- Use **pnpm** for all package management operations
- The project uses `pnpm@9.12.1`

### Build Commands
```bash
pnpm run build        # Build the plugin (outputs to dist/)
pnpm run dev          # Build in watch mode
```

### Linting Commands
```bash
pnpm run lint              # Run Biome linter
pnpm run lint:write        # Run Biome linter and auto-fix issues
```

### Playground Commands
```bash
cd playground
pnpm install               # Install playground dependencies
pnpm run dev               # Start development server
pnpm run build             # Build playground
```

## Code Style Guidelines

### General Principles
- No comments unless explicitly required by the task
- Keep code concise and self-documenting
- Prefer early returns to reduce nesting

### Formatting (Biome)
- Indentation: spaces (2 spaces)
- JavaScript quote style: single quotes (`'`)
- Organize imports enabled

### TypeScript
- Use explicit type annotations for function parameters and return types
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` when possible; use `unknown` for truly unknown types
- Use `// @ts-ignore` sparingly when dealing with rspack types that lack proper definitions

### Imports
- Group imports in this order:
  1. Node.js built-in modules (`node:path`, `node:crypto`)
  2. External packages (`@rspack/core`, `@rsbuild/core`)
  3. Relative imports (`../tools/`, `../helpers/`)
- Use named imports where possible: `import { type Foo } from 'bar'`
- Use type imports for type-only: `import type { Foo } from 'bar'`

### Naming Conventions
- **Classes**: PascalCase (`MarkoRspackPlugin`)
- **Functions**: camelCase (`normalizeRuntimeId`, `getEntryPoints`)
- **Variables**: camelCase (`serverCompiler`, `browserApplied`)
- **Constants**: UPPER_SNAKE_CASE (`PLUGIN_MARKO_NAME`)
- **Interfaces**: PascalCase without "I" prefix (`MarkoPluginOptions`)
- **Files**: kebab-case for utilities (`module-name.ts`)

### Error Handling
- Throw `Error` instances with descriptive messages
- Validate assumptions with runtime checks
- Use meaningful error messages for debugging

### Plugin Architecture
- Plugins follow the Rsbuild plugin pattern: `{ name: string, setup: (api) => void }`
- Plugin name constant: `PLUGIN_MARKO_NAME = 'rsbuild:marko'`
- Export main plugin function as named export: `export { pluginMarko }`

### Directory Structure
```
src/           - Main plugin entry point
tools/         - Core plugin implementation (MarkoRspackPlugin)
helpers/       - Utility functions
dist/          - Build output (generated)
playground/    - Test project for development
```

### Marko-specific Configuration
- Marko files use `.marko` extension
- The plugin automatically configures babel with `@babel/preset-env` and `@babel/plugin-transform-runtime`
- Marko compiler and webpack loader paths are resolved from `process.cwd()`

### Dependencies
- External dependencies for bundling: `@rspack/core` (configured in tsup.config.ts)
- Peer dependencies: `@rsbuild/core`
- Build tool: tsup with ESM and CJS formats, TypeScript declarations

### Git Workflow
- Pre-commit hooks run `nano-staged` with Biome auto-fix for staged files
- Commit messages should be concise and follow conventional format
