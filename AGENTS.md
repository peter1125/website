# Website project

Source for https://eungangchoi.com, published from the `master` branch by Netlify.

- Preserve existing publication routes, static files, contact delivery, analytics configuration, and CV PDF unless specifically requested otherwise.
- Build with Hugo extended 0.97.3, matching `netlify.toml`. Newer Hugo versions remove functions used by the retained Wowchemy theme.
- The homepage uses a local editorial template; the remaining pages retain Wowchemy. Profile details live in `content/authors/admin/_index.md`; homepage presentation data lives in `data/editorial.yaml`.
- Keep role, employer, location, profile biography, and search metadata consistent. Do not invent dates or achievements.
- Validate desktop/mobile layout, internal links, publication pages, and contact form markup. Do not send test contact messages.
