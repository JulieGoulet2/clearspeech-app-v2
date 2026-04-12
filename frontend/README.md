This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Frontend Testing

This project uses **Jest** with **React Testing Library** for basic UI and API-interaction tests.

Run tests:

```bash
npm test
```

Current tests are in:

- `__tests__/page.test.tsx`
- `__tests__/dictation.test.tsx`

They cover:

- page render (title, textarea, primary button)
- textarea typing interaction
- rewrite button triggering a mocked `fetch` call with the expected payload
- displaying mocked API response text in the UI
- dictation frontend flow with mocked `/transcribe` responses:
  - successful transcript inserts text + shows success notice
  - empty transcript shows an error
  - API failure shows an error
  - browser-aware dictation UI behavior (Safari enabled, Chrome warning/disabled)

Tests mock `global.fetch` with `jest.fn()`, so no real backend calls are made.
Dictation tests also mock browser APIs at a high level (user agent, `getUserMedia`, `MediaRecorder`) without testing real microphone/audio behavior.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
