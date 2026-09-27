# OBS renderer access

The cloud renderer uses one stable, randomly generated token stored at
`/opt/ographic-spx/auth/renderer-token` on the server. It is not in Git or the
SPX project data. Restarting SPX or OBS does not change it.

On the operator Mac, run `deploy/cloud/copy-obs-url.command`. It copies the
complete Browser Source URL from Keychain to the clipboard. Paste that URL
into the OBS Browser Source URL field; do not enter the SPX administrator
password in OBS. The normal transparent renderer opens automatically.

The token is held in the URL fragment, so it is not included in HTTP request
paths or Nginx access logs. The bootstrap exchanges it for an HttpOnly cookie
and opens `/renderer`. The cookie grants renderer pages, their static assets,
and Socket.IO transport only, not the controller or Studio API. To revoke a
compromised token, replace the server token file and update the Keychain item;
old renderer cookies then stop working. Rotation is manual, never automatic.
