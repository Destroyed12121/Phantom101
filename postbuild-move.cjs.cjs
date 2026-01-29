#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const assetsDir = path.join(root, 'assets');
const downloadDir = path.join(root, 'download');

if (!fs.existsSync(dist)) process.exit(0);
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

const indexHtmlPath = path.join(dist, 'index.html');
let html = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '';

const distAssets = path.join(dist, 'assets');
let jsFile = null;
let cssFile = null;
if (fs.existsSync(distAssets)) {
  for (const f of fs.readdirSync(distAssets)) {
    if (f.endsWith('.js')) jsFile = path.join(distAssets, f);
    if (f.endsWith('.css')) cssFile = path.join(distAssets, f);
  }
}

if (jsFile) fs.copyFileSync(jsFile, path.join(assetsDir, 'index.js'));
if (cssFile) fs.copyFileSync(cssFile, path.join(assetsDir, 'index.css'));

if (html) {
  const cdnJs = 'https://cdn.jsdelivr.net/gh/rhenryw/lupine@main/assets/index.js';
  const cdnCss = 'https://cdn.jsdelivr.net/gh/rhenryw/lupine@main/assets/index.css';
  html = html
    .replace(/<script[^>]*src="[^"]*assets\/[^"]+\.js"[^>]*><\/script>/g, `<script type="module" src="${cdnJs}"></script>`)
    .replace(/<script[^>]*src="\/assets\/index\.js"[^>]*><\/script>/g, `<script type="module" src="${cdnJs}"></script>`)
    .replace(/<link[^>]*href="[^"]*assets\/[^"]+\.css"[^>]*>/g, `<link rel="stylesheet" href="${cdnCss}">`)
    .replace(/<link[^>]*href="\/assets\/index\.css"[^>]*>/g, `<link rel="stylesheet" href="${cdnCss}">`)
    .replace(/<link[^>]*rel="modulepreload"[^>]*href="[^"]*assets\/[^"]+\.js"[^>]*>/g, `<link rel="modulepreload" href="${cdnJs}">`);
  if (process.env.CREATE_DOWNLOAD_TXT === '1') {
    fs.writeFileSync(path.join(downloadDir, 'download.txt'), html, 'utf8');
  }
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
}

console.log('Postbuild: assets moved to /assets' + (process.env.CREATE_DOWNLOAD_TXT === '1' ? ' and download.txt created.' : '.'));