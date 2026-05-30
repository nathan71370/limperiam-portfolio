# Deployment — limperiam portfolio

End-to-end runbook to deploy this project to the home server with auto-redeploy on push to `main`.

## Architecture

```
GitHub push (main)
  ↓
GitHub Actions builds api + web images
  ↓
Pushes to ghcr.io/nathan71370/limperiam-portfolio-{api,web}:latest
  ↓
Watchtower on the home server polls every 5 min
  ↓
Detects new :latest → docker pull + recreate containers
  ↓
Cloudflared tunnel → 127.0.0.1:3000 → web → api → sqlite.db
```

---

## Part 1 — One-time GitHub setup (do this once on your dev machine)

### 1.1 Create the GitHub repo

From the project root:

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio

# Create the repo on GitHub and push current code
gh repo create limperiam-portfolio --private --source=. --remote=origin --push
```

Choose `--private` (recommended — the source has admin code) or `--public`. Either way the GHCR images themselves will be public (cheaper, simpler — they contain no secrets at build time).

### 1.2 Make the GHCR packages public after first build

The first push to `main` triggers the workflow and creates two packages on GHCR. By default, packages inherit the repo visibility. To let Watchtower pull without auth, make them public:

```bash
# Wait for the first build to finish (https://github.com/nathan71370/limperiam-portfolio/actions)
# Then make both packages public:
gh api -X PATCH /user/packages/container/limperiam-portfolio-api/visibility -f visibility=public
gh api -X PATCH /user/packages/container/limperiam-portfolio-web/visibility -f visibility=public
```

(Or via the GitHub UI: Profile → Packages → click the package → Package settings → Change visibility → Public.)

### 1.3 (Optional) Add NEXT_PUBLIC_CALCOM_LINK as a repo secret

`NEXT_PUBLIC_*` vars are embedded at Next.js BUILD time, not runtime. If you want the Cal.com button to show up in the production image, add it as a GitHub Actions secret AND update `.github/workflows/build-and-push.yml` to pass it as a build arg. For now, the easier path is to leave it empty — you can add it later.

---

## Part 2 — One-time home server setup

SSH into your home server, then:

### 2.1 Clone the repo

```bash
cd ~
git clone https://github.com/nathan71370/limperiam-portfolio.git
cd limperiam-portfolio
```

(Use HTTPS — no SSH key needed since you'll just be pulling production config, not pushing.)

### 2.2 Create the production `.env`

```bash
cp .env.production.example .env
nano .env
# Set JWT_SECRET (use: openssl rand -hex 32)
# Set ADMIN_EMAIL (your real email)
# Set ADMIN_PASSWORD (a long password — you'll use this to log into /admin)
```

### 2.3 First boot

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Watchtower, api, and web all start. Now apply migrations + seed the admin user + the 5 portfolio projects:

```bash
docker compose -f docker-compose.prod.yml exec api uv run alembic upgrade head
docker compose -f docker-compose.prod.yml exec api uv run python -m src.seed
docker compose -f docker-compose.prod.yml exec api uv run python scripts/seed_portfolio.py
```

### 2.4 Verify

```bash
curl -s http://127.0.0.1:3000 | head -c 200
# Should return HTML — the Next.js homepage.

docker compose -f docker-compose.prod.yml logs --tail 20 web
docker compose -f docker-compose.prod.yml logs --tail 20 api
```

---

## Part 3 — Cloudflared tunnel

Your tunnel currently points to the static Caddy HTML. Repoint it to the new web container.

### 3.1 Find your current tunnel config

```bash
# Typical locations:
ls ~/.cloudflared/
# OR
sudo systemctl cat cloudflared
```

The config file (usually `~/.cloudflared/config.yml`) has an `ingress` section. Replace the existing service URL (probably `:8080` for Caddy) with `127.0.0.1:3000`:

```yaml
ingress:
  - hostname: limperiam.com   # or whatever domain you use
    service: http://127.0.0.1:3000
  - service: http_status:404
```

### 3.2 Restart cloudflared

```bash
sudo systemctl restart cloudflared
# or, if you run it via runtipi / docker: restart its container
```

### 3.3 Hit your public URL

```bash
curl -I https://limperiam.com   # or your domain
# Expect: HTTP/2 200
```

### 3.4 Stop the old Caddy container

Now that the tunnel points elsewhere, the old static-HTML Caddy can be shut down at your leisure:

```bash
docker stop <old-caddy-container>
docker rm <old-caddy-container>
```

---

## Part 4 — Day-to-day workflow

### Push code → auto-deploy

```bash
# On your dev machine:
git add ...
git commit -m "feat: new stuff"
git push origin main
```

GitHub Actions runs (~3-5 min). When it finishes, Watchtower picks up the new images within 5 min (the polling interval). No SSH needed.

### Watch a deploy in real-time

```bash
# On the home server:
docker compose -f docker-compose.prod.yml logs -f watchtower
# When Watchtower pulls a new image you'll see:
#   "Found new ghcr.io/nathan71370/limperiam-portfolio-web:latest image (...)"
#   "Stopping /limperiam-portfolio-web-1 ..."
#   "Started /limperiam-portfolio-web-1"
```

### Roll back to a previous version

Every Actions build also tags with the short git SHA. To pin a specific version:

```bash
# On the server, edit docker-compose.prod.yml:
# Change `:latest` to `:sha-abc1234` (the SHA you want)
docker compose -f docker-compose.prod.yml up -d
```

Watchtower won't override an SHA-pinned image (it only watches `:latest`).

### Database backups

SQLite is a single file. Add a cron on the home server:

```bash
# As your user (or root):
crontab -e
# Add:
0 3 * * * cp /home/$USER/limperiam-portfolio/data/sqlite.db /home/$USER/backups/limperiam-$(date +\%F).db && find /home/$USER/backups -name 'limperiam-*.db' -mtime +30 -delete
```

This runs at 3am daily, keeps 30 days of backups.

### Manual update (skip Watchtower)

```bash
# On the server:
cd ~/limperiam-portfolio
git pull   # to refresh docker-compose.prod.yml if it changed
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Apply new DB migrations (after a code change adding a column)

Migrations are baked into the api image. Each redeploy, run:

```bash
docker compose -f docker-compose.prod.yml exec api uv run alembic upgrade head
```

You can also wire this into a startup script — for now the manual step is safer (catches breaking migrations).

---

## Part 5 — Troubleshooting

### Watchtower didn't pick up a new image

- Check the package visibility (must be Public for unauthenticated pulls)
- Check Watchtower logs: `docker compose -f docker-compose.prod.yml logs watchtower`
- The polling interval is 5 min — you might just be impatient

### Auth: "I can log into /admin but get kicked back on every click"

This was a bug — fixed in commit `2ccfac5`. If you see it again, check the cookie:
- Visit /admin/login, log in
- Open DevTools → Application → Cookies → check `access_token` is set
- If it's NOT set: the `Set-Cookie` response from the Server Action included `Secure` but the browser sees HTTP (not HTTPS). Cloudflared should set `x-forwarded-proto: https` — verify in API logs.

### "I changed a NEXT_PUBLIC_* var but the site still shows the old value"

Those are embedded at build time. You need to trigger a rebuild via GitHub Actions (push or `gh workflow run build-and-push.yml`), then wait for Watchtower.

### Disk space

```bash
docker system df
docker image prune -a   # remove dangling old image versions
```

Watchtower's `--cleanup` flag already does this for replaced images, so this should rarely be needed.
