# Translation Guide

This project uses [Lingui](https://lingui.dev) for internationalization. All user-facing strings are extracted into PO files — a standard format supported by every translation tool.

## Quick Start

### 1. Add a new locale

Open `lingui.config.ts` and add the locale code:

```ts
locales: ["en", "ru"],  // add your locale here
```

### 2. Extract strings

```bash
bun run i18n:extract
```

This creates `src/locales/ru/messages.po` with all 555+ strings, pre-filled with empty translations.

### 3. Translate

Open the `.po` file in any PO editor (or a text editor) and fill in the `msgstr` lines. See the "How to translate" section below.

### 4. Compile

```bash
bun run i18n:compile
```

This generates the compiled JS file that the app loads at runtime.

### 5. Activate the locale

Update `src/lib/i18n.ts` to load and activate the new locale:

```ts
import { i18n } from "@lingui/core";
import { messages as enMessages } from "../locales/en/messages";
import { messages as ruMessages } from "../locales/ru/messages";

i18n.load("en", enMessages);
i18n.load("ru", ruMessages);
i18n.activate("ru"); // or detect from browser/user preference
export { i18n };
```

Add a type declaration file at `src/locales/ru/messages.d.ts`:

```ts
declare const messages: Record<string, string>;
export { messages };
```

---

## How to Translate

### PO file structure

Each translatable string looks like this:

```po
#. Button to upload videos to a project
#: src/components/upload/UploadButton.tsx:9
msgid "Upload"
msgstr "Upload"
```

- `#.` — context comment explaining where and how the string is used. Read this before translating.
- `#:` — source file and line number (for reference only).
- `msgid` — the original English string. **Never modify this line.**
- `msgstr` — your translation goes here. Replace the English text with the translated text.

Example (Russian):

```po
#. Button to upload videos to a project
#: src/components/upload/UploadButton.tsx:9
msgid "Upload"
msgstr "Загрузить"
```

### Placeholders

Some strings contain placeholders like `{0}`, `{1}`, or named placeholders like `{days}`. These are replaced with dynamic values at runtime. Keep them in your translation.

```po
msgid "{days}d ago"
msgstr "{days} дн. назад"
```

```po
msgid "{0} has invited you to join as a {1}."
msgstr "{0} пригласил(а) вас присоединиться в роли {1}."
```

You can reorder placeholders if your language requires a different word order:

```po
msgid "{0} has invited you to join as a {1}."
msgstr "Вас пригласил(а) {0} в роли {1}."
```

### HTML-like tags

Some strings contain tags like `<0>`, `<1/>`, `</0>`. These represent React components (bold text, links, line breaks, etc.). Keep them in your translation and maintain proper nesting.

```po
msgid "Shared via <0>{PRODUCT_NAME}</0>"
msgstr "Поделились через <0>{PRODUCT_NAME}</0>"
```

- `<0>...</0>` — wraps content in a component (usually bold, link, or styled span)
- `<0/>` — self-closing tag (usually a line break `<br/>`)

### Plurals (ICU format)

Plural strings use ICU MessageFormat syntax. Each language has its own plural rules.

English has 2 forms (`one`, `other`):

```po
msgid "{0, plural, one {# comment} other {# comments}}"
msgstr "{0, plural, one {# comment} other {# comments}}"
```

Russian has 3 forms (`one`, `few`, `other`):

```po
msgid "{0, plural, one {# comment} other {# comments}}"
msgstr "{0, plural, one {# комментарий} few {# комментария} other {# комментариев}}"
```

The `#` symbol is replaced with the actual number. Keep it as `#`.

Plural categories by language:
- **English, German, Spanish, etc.**: `one`, `other`
- **Russian, Ukrainian, Polish, etc.**: `one`, `few`, `other`
- **Arabic**: `zero`, `one`, `two`, `few`, `many`, `other`
- **Japanese, Chinese, Korean**: `other` (no plural distinction)

Reference: [CLDR Plural Rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)

---

## Product Names — Do Not Translate

The following names must stay in English in all translations:

- **Правко** — our product name (variable `PRODUCT_NAME` in `src/lib/product.ts`)
- **Frame.io** — competitor product name
- **Wipster** — competitor product name
- **Adobe**, **Premiere**, **After Effects**, **Final Cut** — software names
- **Mux** — video infrastructure provider
- **GitHub** — platform name
- **ProRes**, **H.264**, **HLS** — video format names

Context comments in the PO file will remind you when a string contains product names.

---

## Recommended PO Editors

You can edit `.po` files with any text editor, but dedicated tools make it easier:

| Tool | Platform | Notes |
|------|----------|-------|
| [Poedit](https://poedit.net) | macOS, Windows, Linux | Free, GUI, best for individual translators |
| [Crowdin](https://crowdin.com) | Web | Team collaboration, free for open source |
| [Lokalise](https://lokalise.com) | Web | Team collaboration, paid |
| [Transifex](https://transifex.com) | Web | Team collaboration, free tier available |
| VS Code | Any | Works fine with syntax highlighting extensions |

---

## Developer Workflow

### Adding new strings

When writing new UI text in the code, use Lingui macros:

```tsx
// JSX text content
import { Trans } from "@lingui/react/macro";
<button><Trans comment="Button to submit the form">Save</Trans></button>

// Attributes, placeholders, non-JSX strings
import { t } from "@lingui/core/macro";
<input placeholder={t({ message: "Search...", comment: "Search input placeholder" })} />

// Plurals
import { Plural } from "@lingui/react/macro";
<Plural value={count} one="# item" other="# items" comment="Item count" />
```

Always include a `comment` — it becomes the translator context in the PO file.

After adding strings, run:

```bash
bun run i18n:extract    # updates all PO files with new strings
bun run i18n:compile    # recompile for runtime
```

### Keeping translations in sync

Run `bun run i18n:extract` after any code change that adds or modifies strings. Lingui will:
- Add new strings to all locale PO files (with empty `msgstr`)
- Keep existing translations intact
- Mark obsolete strings (removed from code) with `#~`

To remove obsolete strings entirely:

```bash
bun run i18n:extract:clean
```

### CI check (optional)

Add this to CI to ensure the catalog is always up to date:

```bash
bun run i18n:extract
git diff --exit-code src/locales/
```

Fails if a developer added i18n-wrapped strings without running extract.
