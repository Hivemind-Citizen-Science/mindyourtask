#!/bin/sh

#  ci_post_clone.sh
#  mindyourtask 
#
# Navigate to the project root
cd ../../

echo "===== Installling CocoaPods ====="
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install cocoapods

echo "===== Installing Node.js ====="
# Specify exact Node.js version
# NODE_VERSION=19.8.1

# # Install specific Node.js version
# curl "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-x64.tar.gz" -o $HOME/Downloads/node.tar.gz
# tar -xf "$HOME/Downloads/node.tar.gz" -C $HOME
# NODE_PATH="$HOME/node-v${NODE_VERSION}-darwin-x64/bin"
# PATH="$NODE_PATH:$PATH"
brew install node
# Verify Node.js installation
node -v
npm -v
# brew install node@18
# echo "===== Installing yarn ====="
# brew install yarn

# Install dependencies
echo "===== Running npm install ====="
npm install --legacy-peer-deps
#CI="true" npx expo prebuild --clean && eas build --profile dev-sim --platform ios --local
echo "===== Running pod install ====="
cd ios
pod install