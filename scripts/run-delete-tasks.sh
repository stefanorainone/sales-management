#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Run the deletion script
node scripts/delete-stefanorainone-tasks.js
