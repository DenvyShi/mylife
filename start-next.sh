#!/bin/bash
cd /home/denvy/mylife.first.pet
export PATH="/home/denvy/.nodejs/bin:$PATH"
exec node node_modules/next/dist/bin/next start -p 3000 -H 0.0.0.0
