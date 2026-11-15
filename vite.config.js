import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  publicDir: false,
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'js/*', dest: 'js' },
        { src: 'css/*', dest: 'css' },
        { src: 'assets/**/*', dest: 'assets' },
        { src: 'products.json', dest: '.' },
        { src: 'sw.js', dest: '.' },
        { src: 'manifest.webmanifest', dest: '.' }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html'
      }
    }
  }
});
