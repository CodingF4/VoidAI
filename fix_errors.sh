#!/bin/bash

# Replace all instances of req.user.id with req.user!.id
sed -i 's/req\.user\.id/req.user!.id/g' server/routes.ts

# Replace all instances of user.id with user!.id where it's a problem
sed -i '269s/user\.id/user!.id/g' server/routes.ts
sed -i '396s/user\.id/user!.id/g' server/routes.ts

# Make the script executable and run it
chmod +x fix_errors.sh
./fix_errors.sh
