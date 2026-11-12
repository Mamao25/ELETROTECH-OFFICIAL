const studioOrigins = new Set(['https://eletrotech-official.sanity.studio', 'https://www.sanity.io']);

if (window.parent !== window) {
  const parentOrigin = location.ancestorOrigins?.[0];
  const referrerOrigin = document.referrer ? new URL(document.referrer).origin : '';
  const fromStudio = studioOrigins.has(parentOrigin || referrerOrigin);
  let continuingPreview = false;
  try {
    if (fromStudio) sessionStorage.setItem('eletrotech-studio-preview', '1');
    continuingPreview = !parentOrigin && referrerOrigin === location.origin &&
      sessionStorage.getItem('eletrotech-studio-preview') === '1';
  } catch {
    // Browsers that block iframe storage can still identify the Studio by origin.
  }
  if (fromStudio || continuingPreview) {
    const version = new URL(import.meta.url).search;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('./site-editor.bundle.css' + version, import.meta.url);
    document.head.append(style);
    import('./site-editor.bundle.js' + version);
  }
}
