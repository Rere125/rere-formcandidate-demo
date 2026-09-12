# Renardi Elfenso — Portfolio

Static one-page portfolio site (pure HTML/CSS/JS, no build step).

## Push to GitHub

```bash
cd site
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

## Deploy on Netlify

1. Go to https://app.netlify.com → **Add new site → Import an existing project**
2. Connect your GitHub account and pick this repo
3. Build settings:
   - **Build command:** (leave empty)
   - **Publish directory:** `.` (already set in `netlify.toml`)
4. Click **Deploy**

Netlify will auto-redeploy every time you push to `main`.

## Notes

- `avatar-og.jpg` must stay in the repo root — it's referenced by the Open Graph / Twitter meta tags for link previews (og:image points to `/avatar-og.jpg`).
- Once you have a real domain, update the `canonical`, `og:url`, and `og:image` URLs near the top of `index.html` (currently placeholder `renardielfenso.com`).
