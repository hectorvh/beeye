# BeEye - Wildfire Protection Platform

Real-time wildfire monitoring, prediction, and incident management platform.

## Technologies

This project is built with:

- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Supabase** - Backend services

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** or **bun** package manager

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

Or if you're using yarn:
```bash
yarn install
```

Or if you're using bun:
```bash
bun install
```

### 2. Run Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

The development server includes:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- TypeScript type checking

### 3. Build for Production

Create an optimized production build:

```bash
npm run build
```

This will create a `dist` folder with optimized, minified files ready for deployment.

### 4. Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

This serves the built files from the `dist` folder, simulating what users will see in production.

## Available Scripts

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
beeye-watch/
├── public/          # Static assets (logo, ico, etc)
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions
│   ├── types/       # TypeScript type definitions
│   └── integrations/ # External service integrations (Supabase)
├── supabase/        # Supabase configuration
└── dist/            # Production build output (generated)
```

## Environment Variables

If you need to configure environment variables, create a `.env` file in the root directory. The app uses Supabase for backend services, so you may need to configure Supabase credentials if you're connecting to a real backend.

## Deployment

After building with `npm run build`, deploy the contents of the `dist` folder to any static hosting service such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any web server (nginx, Apache, etc.)
