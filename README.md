# Commando Fittness Club · Rajgarh

This repository contains the static frontend for Commando Fittness Club in Rajgarh. It uses plain HTML, CSS, and JavaScript, Firebase Authentication and Firestore for admin-managed site content, and Formspree for contact submissions. The site includes a web app manifest and service worker so visitors can install it from a supported mobile browser.

## Structure

- `index.html` – public home page
- `machines.html` – equipment library
- `machine.html` – machine detail page
- `goals.html` – education hub
- `fees.html` – membership plan overview
- `notifications.html` – public notifications center
- `surveys.html` – survey list
- `survey.html` – survey form renderer
- `contact.html` – contact and enquiry page
- `404.html` – custom not found page
- `admin/` – Firebase-authenticated admin pages
- `css/` – shared styling
- `js/` – data and UI logic
- `assets/` – placeholder brand and image assets

## Run locally

Run the website from the project root with a local static HTTP server. Using PowerShell:

```powershell
cd D:\\COMMANDO
.\\serve-local.ps1
```

If PowerShell blocks local scripts, run it once with:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Then open [http://localhost:8000/](http://localhost:8000/) in your browser. The home page is served from `index.html`.

Keep the terminal running while using the site. Press `Ctrl+C` in that terminal to stop the server.

No Node.js, package manager, or build step is required. Firebase is accessed directly by the browser. Serve over HTTP so the browser can load the ES module scripts; opening the HTML files directly with `file://` may block modules.

## Install on a phone

Deploy the site to an HTTPS host before installing; service workers and install prompts require HTTPS (localhost is supported for testing). On Android, open the site in Chrome and choose **Install app** when prompted, or use the browser menu's **Install app / Add to Home screen** option. On iPhone/iPad, open the site in Safari, tap **Share**, then **Add to Home Screen**.

## Notes

- Contact form submissions use the Formspree endpoint configured in `contact.html`; they are emailed/managed in Formspree and are not copied to Firestore or the local admin enquiries page.
- Machines, membership plans, notifications, and survey definitions are read from Firestore. The first authorized admin visit seeds the four empty content collections from the built-in starter catalogue. Later admin edits write to Firestore.
- Firebase browser configuration in `js/firebase.js` is public client configuration, not a password. The Firestore rules in `firestore.rules` restrict content writes to `kartikgoyalrajgarh@gmail.com` and public reads to published documents. Those rules must be published in the Firebase Console before live content access works.
- Firebase Auth protects the admin pages. Survey responses are stored in the Firestore `responses` collection and can be exported from the admin Responses page as a CSV for Google Sheets. Notification read-state and the legacy enquiries screen remain local/Formspree features.
- No Firebase Storage, Cloud Functions, or payment processing is used.
- Firebase and Formspree have provider quotas/terms that can change. Keep Firebase on the Spark plan if you require a $0 setup.
- The uploaded machine photos are copied into `assets/images/` and referenced by the equipment catalogue; replace those assets or revise the descriptions if the machine's frame label indicates a different setup.
- The public location uses the Google Maps listing for Sadulpur (Rajgarh), Rajasthan; the listing does not currently provide a phone number, so the site points visitors to Maps and Instagram rather than displaying an unverified number.

## Firebase setup

1. In Firebase Console, confirm the web app is registered and Email/Password Authentication and Firestore are enabled.
2. In **Firestore Database → Rules**, replace the rules with `firestore.rules` and publish them. This is required for survey submissions: the rules allow public survey-response creation and allow only the gym admin to read the `responses` collection. If the Responses page reports `permission-denied`, the current rules have not been published to the Firebase project.
3. In **Authentication → Settings → Authorized domains**, add the site host when deployed (for GitHub Pages, add `USERNAME.github.io`, without protocol or path).
4. Sign in to `admin/login.html` using the authorized gym-admin account. If all four content collections are empty, the first successful admin visit initializes them with the starter content.
5. Keep the project on Firebase's Spark plan; do not add billing for this setup.

## Publish with GitHub Pages

Create a GitHub repository, upload the site while preserving its folder structure, then open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, and save. Add the generated host (for example, `USERNAME.github.io`) to Firebase Authentication's authorized domains. GitHub Pages is static hosting; Firebase remains the data/auth service.

The Firebase API key is intentionally shipped as browser config. Never add service-account keys, admin passwords, or other private credentials to this repository.
- Business details are centralized in `js/data.js`; starter inventory, plans, notifications, and surveys are the first-run Firestore seed.
- Machine photos are stored in `assets/images/`. Membership prices are editable through the authenticated admin pages.
- The public location uses the Google Maps listing for Sadulpur (Rajgarh), Rajasthan; no unverified phone number is displayed.
