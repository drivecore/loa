import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const paths = [
  {
    kicker: 'CLI',
    title: 'Script it from your terminal',
    body: 'Upload, download, and manage assets from your shell or CI with the loa command.',
    code: `npm install -g @landofassets/cli
loa auth login

loa assets create --file chair.glb \\
  --org my-org --project my-project \\
  --visibility PRIVATE`,
    to: '/cli',
    link: 'CLI reference',
  },
  {
    kicker: 'SDK',
    title: 'Build it into your app',
    body: 'A typed TypeScript client with Zod-validated requests and responses.',
    code: `import {
  createSecretTokenInstance,
  listAssets,
} from '@landofassets/sdk';

const client = createSecretTokenInstance({
  secretToken: process.env.LOA_TOKEN,
});
const assets = await listAssets(client, {
  query: {
    orgName: 'my-org',
    projectName: 'my-project',
  },
});`,
    to: '/sdk',
    link: 'SDK reference',
  },
  {
    kicker: 'REST API',
    title: 'Call it from any language',
    body: 'Plain HTTPS and JSON, authenticated with a bearer API token.',
    code: `curl -H "Authorization: Bearer $LOA_TOKEN" \\
  https://api.landofassets.com/assets/my-org/my-project`,
    to: '/api',
    link: 'REST API reference',
  },
];

export default function Home() {
  return (
    <Layout
      title="Developer docs"
      description="Automate Land of Assets with the loa CLI, the TypeScript SDK, or the REST API."
    >
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>LAND OF ASSETS DEVELOPER DOCS</p>
          <h1>
            Automate your 3D asset pipeline.
            <br />
            <em>CLI, SDK, or REST API.</em>
          </h1>
          <p className={styles.lead}>
            Upload, convert, and deliver 3D models, materials, and environments programmatically. Create an API token in
            the <a href="https://landofassets.com">Land of Assets dashboard</a>, pick the tool that fits your workflow,
            and you are a few lines from your first asset.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} to="/getting-started">
              Getting started guide <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondary} to="/api">
              Browse the REST API <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className={styles.cards} aria-label="Ways to integrate">
          {paths.map((path) => (
            <article key={path.kicker} className={styles.card}>
              <p className={styles.kicker}>{path.kicker}</p>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <pre className={styles.example}>
                <code>{path.code}</code>
              </pre>
              <Link to={path.to}>{path.link} →</Link>
            </article>
          ))}
        </section>
        <section className={styles.note}>
          <strong>New to Land of Assets?</strong>
          <span>The getting started guide covers accounts, API tokens, and your first upload end to end.</span>
          <Link to="/getting-started">Read the guide →</Link>
        </section>
      </main>
    </Layout>
  );
}
