🌀 BagSort

Lists, but make them swirl.

Vortex is a tiny, no-framework list app. Make lists, fill them with topics and items, drag things into the order your brain demands, and search through the chaos. Sign up if you want an account, or just start typing as a guest. We won't judge.

Pure HTML, CSS and vanilla JavaScript. No build step, no node_modules black hole, no 400 MB of dependencies to list your groceries.

✨ What it does
📝 Create, rename and delete lists (with a "are you sure?" so you don't nuke your life by accident)
🧩 Topics and items inside every list
🖱️ Drag & drop reordering by the ☰ handle. Mouse and touch both work
🔍 Live search that highlights matches as you type
✏️ Inline editing: click the title or hit ✎, then Enter to save or Esc to bail
🔐 Accounts via Supabase: sign up, sign in, reset your password, log out dramatically
🕶️ Guest mode: no account needed, and your guest lists move into your account the first time you log in
📱 Mobile friendly, dark gradient vibes included

_________________________________________________________________________________________________________
🗂️ Project layout

.
├── index.html          # Home: all your lists

├── inside_list.html    # One list: topics, items, search

├── auth.html           # Sign in / sign up / forgot + set new password

├── account.html        # Your account page

├── index.css

├── inside_list.css

├── auth.css

├── account.css

├── images/
│   └── favicone.svg

└── java/
    ├── account.js      # Supabase client + session + storage prefix + loads app.js
    ├── app.js          # The brains: lists, topics, items, drag & drop, search
    ├── auth.js         # Auth page logic
    └── account-page.js # Account page logic
