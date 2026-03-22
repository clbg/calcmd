# Release Process

## Automated npm Publishing via GitHub Actions

CalcMD uses GitHub Actions with npm's Trusted Publisher feature to automatically publish packages when a version tag is pushed. This is more secure than using access tokens.

## Prerequisites

### 1. Create npm Account

If you don't have an npm account:
```bash
npm adduser
```

### 2. Set Up Trusted Publisher (Recommended - No Token Needed!)

npm's Trusted Publisher uses GitHub's OIDC to authenticate, eliminating the need for long-lived tokens.

**Steps**:

1. **Publish the package manually once** (required for first-time setup):
   ```bash
   npm login
   pnpm --filter @calcmd/core publish --access public
   ```

2. **Go to npm package settings**:
   - Visit: https://www.npmjs.com/package/@calcmd/core/access
   - Or: npm website → Your package → Settings → Publishing Access

3. **Add Trusted Publisher**:
   - Click "Add Trusted Publisher"
   - Select "GitHub Actions"
   - Fill in:
     - **Repository owner**: `clbg`
     - **Repository name**: `calcmd`
     - **Workflow name**: `publish-npm.yml`
     - **Environment** (optional): leave blank
   - Click "Add"

4. **Done!** No token needed. GitHub Actions can now publish automatically.

### Alternative: Using npm Token (Legacy Method)

If you prefer the traditional token method:

1. **Generate npm Access Token**:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type
   - Copy the token (starts with `npm_...`)

2. **Add Token to GitHub Secrets**:
   - Go to https://github.com/clbg/calcmd/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

## Release Steps

### Option 1: Automated Release (Recommended)

1. **Update version** in `packages/core/package.json`:
   ```json
   {
     "version": "0.1.1"
   }
   ```

2. **Commit the version bump**:
   ```bash
   git add packages/core/package.json
   git commit -m "chore: bump @calcmd/core to v0.1.1"
   ```

3. **Create and push a git tag**:
   ```bash
   git tag v0.1.1
   git push origin master --tags
   ```

4. **GitHub Actions will automatically**:
   - Run tests
   - Build the package
   - Publish to npm

5. **Monitor the workflow**:
   - Go to GitHub → Actions tab
   - Watch the "Publish to npm" workflow
   - Check for any errors

### Option 2: Manual Release

If you prefer to publish manually:

1. **Ensure you're logged in to npm**:
   ```bash
   npm whoami
   # If not logged in:
   npm login
   ```

2. **Build and test**:
   ```bash
   pnpm --filter @calcmd/core build
   pnpm --filter @calcmd/core test
   ```

3. **Publish**:
   ```bash
   pnpm --filter @calcmd/core publish --access public
   ```

4. **Create git tag** (for consistency):
   ```bash
   git tag v0.1.1
   git push origin master --tags
   ```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Examples

- `0.1.0` → `0.1.1`: Bug fix
- `0.1.0` → `0.2.0`: New feature (e.g., new function)
- `0.1.0` → `1.0.0`: Breaking change (e.g., API change)

## Pre-release Versions

For beta/alpha releases:

```bash
# Update version to 0.2.0-beta.1
git tag v0.2.0-beta.1
git push origin master --tags
```

Users can install with:
```bash
npm install @calcmd/core@beta
```

## Changelog

Before each release, update `CHANGELOG.md` (if it exists) or create release notes on GitHub:

1. Go to GitHub → Releases
2. Click "Draft a new release"
3. Choose the tag (e.g., v0.1.1)
4. Write release notes:
   - What's new
   - Bug fixes
   - Breaking changes (if any)
5. Publish release

## Troubleshooting

### "Package already exists"

If the version is already published:
1. Bump the version number
2. Commit and create a new tag

### "Authentication failed"

Check that:
1. `NPM_TOKEN` secret is set in GitHub
2. Token has "Automation" permissions
3. Token hasn't expired

### "Tests failed"

Fix the failing tests before releasing:
```bash
pnpm test
```

### "Build failed"

Ensure the build works locally:
```bash
pnpm --filter @calcmd/core build
```

## Rollback

If you need to unpublish a version (within 72 hours):

```bash
npm unpublish @calcmd/core@0.1.1
```

**Warning**: Unpublishing is discouraged. Instead, publish a new patch version with the fix.

## Publishing Multiple Packages

When we have more packages to publish (e.g., `@calcmd/ui`):

1. Update `.github/workflows/publish-npm.yml`:
   ```yaml
   - name: Publish @calcmd/ui
     run: pnpm --filter @calcmd/ui publish --access public --no-git-checks
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```

2. Use the same tag for all packages in a release

## Verification

After publishing, verify:

1. **Check npm**:
   ```bash
   npm view @calcmd/core
   ```

2. **Test installation**:
   ```bash
   mkdir test-install
   cd test-install
   npm init -y
   npm install @calcmd/core
   node -e "console.log(require('@calcmd/core'))"
   ```

3. **Check on npmjs.com**:
   - https://www.npmjs.com/package/@calcmd/core

## Best Practices

1. **Always test before releasing**:
   ```bash
   pnpm test
   ```

2. **Use dry-run to preview**:
   ```bash
   pnpm --filter @calcmd/core publish --dry-run
   ```

3. **Keep CHANGELOG.md updated**

4. **Tag releases in git** for traceability

5. **Write clear release notes** on GitHub

6. **Announce releases**:
   - Twitter/X
   - GitHub Discussions
   - Discord/Slack (if applicable)

## Release Checklist

Before creating a release tag:

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated (if exists)
- [ ] README.md updated (if needed)
- [ ] Breaking changes documented
- [ ] Migration guide written (for breaking changes)
- [ ] Examples updated (if API changed)

After release:

- [ ] Verify package on npm
- [ ] Test installation in fresh project
- [ ] Create GitHub release with notes
- [ ] Announce on social media
- [ ] Update website (if needed)

## Automation Ideas (Future)

Consider adding:

1. **Automated version bumping**:
   - Use `semantic-release` or `changesets`
   - Automatically determine version from commit messages

2. **Automated changelog**:
   - Generate from commit messages
   - Use conventional commits

3. **Release notes generation**:
   - Auto-generate from commits
   - Post to GitHub Releases

4. **Slack/Discord notifications**:
   - Notify team when release is published

5. **npm provenance**:
   - Already enabled in workflow
   - Provides supply chain security

---

**Current Status**: Manual version bumping + automated publishing via GitHub Actions

**Next Steps**: Set up `NPM_TOKEN` secret in GitHub repository settings
