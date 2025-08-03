# GitHub Pages Deployment Guide

This project is configured for automatic deployment to GitHub Pages.

## Automatic Deployment

The project will automatically deploy to GitHub Pages when:
- Code is pushed to the `main` or `master` branch
- The deployment workflow is manually triggered from the Actions tab

## Repository Configuration

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "GitHub Actions"

2. **Repository Name**:
   - The deployment is configured for a repository named "hex"
   - If your repository has a different name, update the `build:gh-pages` script in `package.json`
   - Change `--base=/solarpunk-island/` to `--base=/your-repo-name/`

## Manual Deployment

To deploy manually:

```bash
# Build for GitHub Pages
npm run build:gh-pages

# The built files will be in the ./dist directory
# These can be manually uploaded to any static hosting service
```

## Testing Locally

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages configuration
npm run build:gh-pages

# Serve the dist directory with a static server
# Make sure to serve from the correct base path
```

## Deployment URL

After successful deployment, your game will be available at:
`https://[username].github.io/solarpunk-island/`

Replace `[username]` with your GitHub username and `hex` with your repository name if different.

## PWA Features

The deployed version includes:
- Service Worker for offline functionality
- Web App Manifest for mobile installation
- Optimized asset caching

## Troubleshooting

**Assets not loading:**
- Ensure all assets are in the `assets/` or `public/` directories
- Check that asset paths in code use relative imports
- Verify the base path in `vite.config.js` matches your repository name

**PWA not working:**
- Check browser console for service worker errors
- Verify manifest.json is accessible at the deployment URL
- Ensure HTTPS is enabled (GitHub Pages provides this automatically)

**Build failures:**
- Check the Actions tab for detailed error logs
- Ensure all dependencies are listed in `package.json`
- ESLint issues: The deployment uses `build:gh-pages` (without linting) to avoid issues with generated files

**ESLint Issues:**
- Development linting: Use `npm run lint` for full codebase linting
- Source-only linting: Use `npm run lint:src` for source files only
- Deployment ignores linting to prevent service worker file conflicts