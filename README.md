# ProVia Order Pricer

Pulls order line items from ProVia's entryLINK API and adds labor pricing
from the Zen Labor Wizard rate tables. Works on any device — iPad, phone, laptop.

## How it works

A Netlify serverless function (`netlify/functions/entrylink.js`) acts as a
proxy between your browser and the entryLINK API. This solves the CORS issue
that prevents browsers from calling the API directly.

```
Browser → Netlify Function → entryLINK API → back to browser
```

---

## Deploy to Netlify (one time setup)

### 1. Push to GitHub

Create a new GitHub repo and push this folder:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/provia-pricer.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and log in
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and select your `provia-pricer` repo
4. Build settings are auto-detected from `netlify.toml`:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
5. Click **Deploy site**

### 3. Done

Netlify gives you a URL like `https://your-site-name.netlify.app`.
Bookmark it on your iPad and laptop. It works like a native app.

---

## Usage

1. Open the URL in any browser
2. Enter your entryLINK username and password, click **Save credentials**
   - Credentials are stored in your browser's localStorage — you only do this once per device
3. Enter a ProVia order number and press **Fetch order** (or hit Enter)
4. The tool pulls all line items and auto-assigns labor rates based on product type
5. Override any labor rate by clicking the field — totals update live
6. Use **Copy as table** to paste into Excel, or **Print** to save a PDF

---

## Labor rate logic

Rates are pulled directly from the Zen Labor Wizard:

| Product type | Method |
|---|---|
| Windows | Nailfin by default, rate based on Width+Height (UI inches) |
| Sliding patio doors | Pocket install, rate based on door size |
| Entry / French doors | Flat rate based on type, height, sidelites, transom |
| Other items | $0 — override manually if labor applies |

Window UI ranges:
- 0–120 UI → $1,180/unit
- 121–150 UI → $1,450/unit  
- 151–180 UI → $1,560/unit

---

## File structure

```
provia-pricer/
├── netlify.toml              # Build config + redirect rules
├── netlify/
│   └── functions/
│       └── entrylink.js      # Serverless proxy for entryLINK API
└── public/
    └── index.html            # The app
```
