(async () => {
  const status = document.getElementById('obsStatus');
  const token = window.location.hash.slice(1);
  const destination = window.location.pathname === '/obs/scalable' ? '/renderer/scalable' : '/renderer/';
  const query = window.location.search;
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(token)) {
    status.textContent = 'OBS 渲染令牌缺失。';
    return;
  }
  try {
    const response = await fetch('/obs/authorize', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    });
    if (!response.ok) throw new Error('Unauthorized');
    window.history.replaceState(null, '', window.location.pathname + query);
    window.location.replace(destination + query);
  } catch (_) {
    status.textContent = 'OBS 渲染令牌无效或服务暂不可用。';
  }
})();
