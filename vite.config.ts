import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function scanReferencesFolder() {
  const dir = path.resolve(process.cwd(), 'public/references');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const files = fs
    .readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f))
    .sort();

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

  // Always write manifest.json so static hostings (Vercel, Netlify, GitHub Pages, Apache/Nginx) work out of the box
  try {
    const manifestPath = path.join(dir, 'manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('Could not write manifest.json:', err);
  }

  return items;
}

function referencesFolderPlugin(): Plugin {
  return {
    name: 'vite-plugin-references',
    buildStart() {
      scanReferencesFolder();
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

              // Update manifest.json after saving new files
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

