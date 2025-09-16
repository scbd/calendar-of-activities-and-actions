# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Quick Setup

For a quick project setup with all dependencies and testing configured:

```bash
# Run the automated setup script
./setup.sh
```

Or manually:

```bash
# yarn (recommended)
yarn install
yarn playwright install
```

## Development Server

Start the development server on `http://localhost:3000` (automatically opens in browser):

```bash
# yarn (recommended)
yarn dev

# npm
npm run dev

# pnpm
pnpm dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# yarn (recommended)
yarn build

# npm
npm run build

# pnpm
pnpm build

# bun
bun run build
```

Locally preview production build (automatically opens in browser):

```bash
# yarn (recommended)
yarn preview

# npm
npm run preview

# pnpm
pnpm preview

# bun
bun run preview
```

> **Note**: All commands automatically clean the Nuxt cache before running to ensure a fresh build.

## Testing

Run the test suite:

```bash
# yarn (recommended)
yarn test                    # Run all tests
yarn test:unit              # Run unit tests only
yarn test:nuxt              # Run Nuxt component tests
yarn test:e2e               # Run end-to-end tests
yarn test:coverage          # Run tests with coverage report
yarn test:watch             # Run tests in watch mode
yarn test:ui                # Run tests with UI

# Install Playwright browsers (required for E2E tests)
yarn playwright install
```

### Test Structure

```text
test/
├── unit/                    # Unit tests (Node environment)
├── nuxt/                    # Nuxt runtime tests (Nuxt environment)
└── e2e/                     # End-to-end tests (Browser environment)
```

### Testing Libraries

- **Vitest**: Test runner and framework
- **@vue/test-utils**: Vue component testing utilities
- **@nuxt/test-utils**: Nuxt-specific testing helpers
- **Happy DOM**: Fast DOM environment for unit tests
- **Playwright**: Browser automation for E2E tests

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
