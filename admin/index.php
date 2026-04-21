<?php
// Serve the React SPA — Apache redirects /admin → /admin/ so we serve index.html here
readfile($_SERVER['DOCUMENT_ROOT'] . '/index.html');
