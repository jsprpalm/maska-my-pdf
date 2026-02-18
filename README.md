# Maska

A privacy-focused PDF redaction tool that runs entirely in your browser. Upload a PDF, draw black masks over sensitive information, and download the redacted version — no data ever leaves your device.

## Features

- **100% client-side** — all processing happens locally in the browser, nothing is uploaded to a server
- **Draw to redact** — drag to draw black rectangles over any content you want to hide
- **Multi-page support** — navigate between pages and redact across the entire document
- **Zoom controls** — zoom in/out for precise masking
- **Undo & clear** — undo last mask, clear current page, or clear the entire document
- **Instant download** — download the redacted PDF with one click

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (build tool)
- [pdf.js](https://mozilla.github.io/pdf.js/) (rendering) + [pdf-lib](https://pdf-lib.js.org/) (editing)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)

## Getting started

Requires [Node.js](https://nodejs.org/) (v18+).

```sh
git clone https://github.com/jsprpalm/maska-my-pdf.git
cd maska-my-pdf
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

## License

This project is open source.
