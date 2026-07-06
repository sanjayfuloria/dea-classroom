# DEA·Lab — Zero-Cost Setup Guide
## IFHE Hyderabad · MBA Service Operations Management

---

## How it works (and why it costs nothing)

| Component | Technology | Cost |
|---|---|---|
| DEA computation | JavaScript solver, runs in your browser | ₹0 |
| Python console | Pyodide (Python 3.11 WebAssembly, runs in browser) | ₹0 |
| User login / auth | Firebase Authentication (free Spark tier) | ₹0 |
| Session storage | Firebase Firestore (free: 1GB, 50K reads/day) | ₹0 |
| App hosting | Firebase Hosting (free: 10GB bandwidth/month) | ₹0 |
| **Total** | | **₹0 / month** |

There is no backend server. All computation happens inside the student's browser using WebAssembly. Results are saved directly to Firestore from the browser. The Python console runs real Python 3.11 with numpy and scipy — entirely inside the browser tab via Pyodide.

---

## Setup Steps (~20 minutes)

### Step 1 — GitHub repository

1. Create a GitHub account at [github.com](https://github.com) if you don't have one.
2. Click **New repository** → name it `dea-classroom` → Private → Create.
3. Upload all files from the `dea-app/` folder to the repository root.

### Step 2 — Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → name: `dea-classroom-ifhe` → Disable Analytics → Create.
3. Enable these services (all free on Spark plan):

   **Authentication** → Build → Authentication → Get started → Email/Password → Enable → Save

   **Firestore** → Build → Firestore Database → Create database → Production mode → Region: **asia-south1 (Mumbai)** → Enable

   **Hosting** → Build → Hosting → Get started → follow the prompts

4. **Upload Firestore security rules:**
   Firestore → Rules tab → paste the contents of `firebase/firestore.rules` → Publish

5. **Get your Firebase config** (needed for GitHub secrets):
   Project Settings (gear icon) → Your apps → Add app → Web (</>) → App nickname: `dea-classroom` → Register
   Copy the `firebaseConfig` object — you'll need each field.

6. **Get a Firebase service account key** (for GitHub Actions to deploy):
   Project Settings → Service accounts → Generate new private key → download the JSON file.

### Step 3 — GitHub Secrets

In your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these **6 secrets** (all from Step 2):

| Secret Name | Where to find it |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the entire contents of the downloaded service account JSON |
| `VITE_FIREBASE_API_KEY` | `apiKey` field in firebaseConfig |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` field |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` field |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` field |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` field |
| `VITE_FIREBASE_APP_ID` | `appId` field |

That's 7 secrets total (1 service account + 6 config values).

### Step 4 — Deploy

1. Commit any small change to `main` (e.g. update a line in README.md)
2. Go to the **Actions** tab in GitHub — you'll see the deployment running (~3 minutes)
3. Your app is live at: **`https://dea-classroom-ifhe.web.app`**

---

## First Use

1. Open your app URL
2. Click **Create account**
3. Enter name, email, password → select **Faculty 🎓**
4. Share the URL with students — they register as **Student 📚**

---

## Free Tier Limits (Firebase Spark Plan)

| Resource | Free Limit | Typical classroom usage |
|---|---|---|
| Authentication | 10,000 logins/month | ~50 students × 5 logins = 250 |
| Firestore reads | 50,000/day | ~200 session reads/day |
| Firestore writes | 20,000/day | ~50 analyses/day |
| Firestore storage | 1 GB | Each session ~5KB → 200,000 sessions |
| Hosting bandwidth | 10 GB/month | Easily sufficient |
| **Conclusion** | | **Will never hit limits for a class of 100 students** |

---

## No Backend = No Maintenance

Because there is no server, you never need to:
- Renew SSL certificates
- Apply security patches
- Monitor uptime
- Pay for idle compute

The app simply works whenever a student opens it in their browser.

---

## Troubleshooting

**"Permission denied" errors in Firestore**
→ Make sure you published the Firestore rules from `firebase/firestore.rules`

**GitHub Actions fails**
→ Check that `FIREBASE_SERVICE_ACCOUNT` secret contains the full JSON (including the curly braces)

**Python console says "Loading…" for a long time**
→ Pyodide downloads ~10MB on first use. Ask students to load the Python tab once before class. Subsequent loads use browser cache and are instant.

**Student can't see Faculty Panel**
→ By design. Only accounts registered as Faculty see that tab. Check the Firestore `users` collection to verify the role field.
