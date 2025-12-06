# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating CI/CD processes for the Just3D Chrome extension.

## Workflows

### 1. CI (Continuous Integration) - `ci.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**What it does:**
- ✅ Validates `manifest.json` structure and required fields
- ✅ Checks for presence of all required files
- ✅ Warns about files larger than 5MB
- 📦 Creates a packaged extension zip file
- ⬆️ Uploads the package as a build artifact (retained for 30 days)

**Artifacts:**
- Extension package: `just3d-{version}.zip`

### 2. Release - `release.yml`

**Triggers:**
- Push of version tags (e.g., `v1.0.0`, `v1.2.3`)

**What it does:**
- ✅ Verifies tag version matches `manifest.json` version
- 📦 Creates two packages:
  - Chrome Web Store ready package (extension only)
  - Source code archive (complete repository)
- 🚀 Creates a GitHub Release with release notes
- ⬆️ Attaches both packages to the release

**Artifacts:**
- `just3d-{version}.zip` - Production extension package
- `just3d-{version}-source.zip` - Complete source code

## Usage

### Running CI

CI automatically runs on every push to main/develop and on pull requests. No manual action needed.

### Creating a Release

1. **Update the version** in `manifest.json`:
   ```json
   {
     "version": "1.2.3"
   }
   ```

2. **Commit the changes:**
   ```bash
   git add manifest.json
   git commit -m "Bump version to 1.2.3"
   git push
   ```

3. **Create and push a tag:**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

4. **Wait for the workflow** - GitHub Actions will automatically:
   - Verify the version matches
   - Create packages
   - Create a GitHub Release with release notes
   - Upload artifacts

5. **Download the packages** from the release page:
   - Go to https://github.com/MrSidims/Just3D/releases
   - Download `just3d-{version}.zip` for Chrome Web Store submission

### Viewing Build Artifacts

For non-release builds (CI runs):
1. Go to the Actions tab in GitHub
2. Click on the workflow run
3. Scroll down to "Artifacts" section
4. Download the `just3d-extension-{version}` artifact

## Version Management

**Important:** The git tag version MUST match the `manifest.json` version. The release workflow will fail if they don't match.

Example:
- `manifest.json`: `"version": "1.2.3"`
- Git tag: `v1.2.3` ✅

## Troubleshooting

### Release workflow fails with "Version mismatch"
- Make sure `manifest.json` version matches the git tag (without the 'v' prefix)
- Tag: `v1.2.3` → Manifest: `"version": "1.2.3"`

### CI workflow fails on "Missing required files"
- Check that all required files listed in the workflow are present
- Ensure file paths are correct (case-sensitive on Linux)

### Package too large
- Check for large files using the CI workflow warnings
- Remove unnecessary assets or compress them
- Consider excluding development files

## File Exclusions

Files and directories excluded from packages:
- `.git/` and `.github/`
- `node_modules/`
- `DevDir/`
- Development documentation (`*.md` files)
- `icons/` directory (contains icon generators, not needed in production)
