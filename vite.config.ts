import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function scanReferencesFolder() {
  const publicDir = path.resolve(process.cwd(), 'public/references');
  const rootDir = path.resolve(process.cwd(), 'references');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }

  // Sync any images added to root /references into /public/references
  for (const f of fs.readdirSync(rootDir)) {
    if (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f)) {
      const srcPath = path.join(rootDir, f);
      const destPath = path.join(publicDir, f);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  const files = fs
    .readdirSync(publicDir)
    .filter(f => /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f))
    .sort();

  // Mirror all images from /public/references into root /references so static hosting from repo root works seamlessly
  for (const f of files) {
    const srcPath = path.join(publicDir, f);
    const destPath = path.join(rootDir, f);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  const items = files.map(filename => {
    const cleanTitle = filename
      .replace(/^[0-9]+_/, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ');
    return {
      id: `folder-${filename}`,
      name: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      url: `./references/${filename}`,
      source: 'folder' as const,
      filename,
    };
  });

  // Always write manifest.json to both public/references and root references/
  const manifestJson = JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2);
  try {
    fs.writeFileSync(path.join(publicDir, 'manifest.json'), manifestJson, 'utf-8');
    fs.writeFileSync(path.join(rootDir, 'manifest.json'), manifestJson, 'utf-8');
  } catch (err) {
    console.warn('Could not write manifest.json:', err);
  }

  return items;
}

function referencesFolderPlugin(): Plugin {
  return {
    name: 'vite-plugin-references',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/<link[^>]*data-standalone-css[^>]*>\s*/i, '')
          .replace(
            /<script[^>]*data-standalone-js[^>]*><\/script>/i,
            '<script type="module" src="/src/main.tsx"></script>'
          );
      },
    },
    buildStart() {
      scanReferencesFolder();
    },
    closeBundle() {
      // Copy compiled assets from dist/assets into root standalone/ so deploying root directly on GitHub Pages works without a build step
      try {
        const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
        const standaloneDir = path.resolve(process.cwd(), 'standalone');
        if (fs.existsSync(distAssetsDir)) {
          fs.mkdirSync(standaloneDir, { recursive: true });
          const assetFiles = fs.readdirSync(distAssetsDir);
          const jsFile = assetFiles.find(f => f.endsWith('.js'));
          const cssFile = assetFiles.find(f => f.endsWith('.css'));
          if (jsFile) {
            fs.copyFileSync(
              path.join(distAssetsDir, jsFile),
              path.join(standaloneDir, 'app.js')
            );
          }
          if (cssFile) {
            fs.copyFileSync(
              path.join(distAssetsDir, cssFile),
              path.join(standaloneDir, 'app.css')
            );
          }
        }
      } catch (err) {
        console.warn('Could not sync standalone bundle:', err);
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = req.url.split('?')[0];

        if (url === '/api/references' && req.method === 'GET') {
          try {
            const items = scanReferencesFolder();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: items.length, items }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }

        if (url === '/api/upload-to-folder' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const dir = path.resolve(process.cwd(), 'public/references');
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

              const saved: string[] = [];
              for (const item of data.files || []) {
                const safeName = (item.filename || `ref_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = path.join(dir, safeName);
                const buffer = Buffer.from(item.base64, 'base64');
                fs.writeFileSync(filePath, buffer);
                saved.push(safeName);
              }

              // Update manifest.json and mirror after saving new files
              scanReferencesFolder();

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, saved }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), referencesFolderPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


