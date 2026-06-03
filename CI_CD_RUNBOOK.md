# Tym2Muv CI/CD Runbook

This guide contains operational procedures for managing deployments, resolving CI/CD failures, and executing rollbacks.

## GitHub Environment Secrets
The following secrets are required in your GitHub repository settings under `Settings > Secrets and variables > Actions`:
- `VERCEL_TOKEN`: Used to authenticate with Vercel API.
- `VERCEL_ORG_ID`: Vercel organization scope.
- `VERCEL_PROJECT_ID`: Tym2Muv project ID.
- `SLACK_WEBHOOK`: URL for Slack channel notifications.

## Reading CI Logs & Handling Failures

### 1. TypeScript Linter Failed (`npm run lint`)
- **Fix:** Review the failing type or import error in the Actions log. The CI prevents invalid TypeScript from merging to `main`. 

### 2. Tests or Coverage Failed
- **Fix:** If the coverage drops below 70%, write missing unit tests. 
- *Command:* `npm run test -- --coverage` locally before committing.

### 3. Lighthouse Performance Checks Failed
- **Symptom:** Workflow fails because SEO/Accessibility scores drop below `0.9` (90).
- **Fix:** Review the artifacts uploaded in the `Lighthouse CI` job to pinpoint issues (e.g., missing ARIA labels).

### 4. Build Size Check Warns > 1MB
- **Fix:** Check if large dependencies or unstructured components were added. Optimize with code-splitting (`React.lazy`).

## Manual Deployment Procedure
If GitHub Actions is down, you can push directly to Vercel:
1. Make sure you are on `main` branch.
2. Run `npm install -g vercel`.
3. Login using `vercel login`.
4. Deploy to staging: `vercel`
5. Deploy to production: `vercel --prod`

## Rollback Procedure
If a bug reaches Production, rollback immediately using Vercel or GitHub.

### Method 1: Instant Vercel Rollback (Preferred)
1. Go to Vercel Dashboard > tym2muv > Deployments.
2. Find the last functioning deployment.
3. Click **"Promote to Production"** or **"Rollback"**. (This is instantaneous).

### Method 2: Git Revert (If Vercel dashboard is inaccessible)
1. Revert the problematic commit: 
   `git revert <commit_hash>`
2. Push to `main`: 
   `git push origin main`
3. The CI/CD pipeline will automatically build and deploy the reverted state.
