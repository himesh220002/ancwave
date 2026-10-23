#!/bin/sh
set -e

# In AWS Lambda environments, ensure writable cache directory in /tmp
if [ -d "/tmp" ]; then
    mkdir -p /tmp/cache 2>/dev/null || true
fi

# Launch Next.js standalone server
exec node server.js
