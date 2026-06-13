#!/bin/zsh
cd "$(dirname "$0")"

echo "Hebrew Trainer PWA"
echo "Serving folder:"
pwd
echo

IP=$(ifconfig | awk '/^[a-z0-9]+:/{iface=$1; sub(":", "", iface)} /inet / && $2 != "127.0.0.1" {print $2; exit}')

echo "Open on this Mac:"
echo "  http://localhost:8001/"
echo

if [ -n "$IP" ]; then
  echo "Open on iPad, if it is on the same Wi-Fi:"
  echo "  http://$IP:8001/"
else
  echo "Could not detect local IP automatically."
fi

echo
echo "Keep this Terminal window open while using the app."
echo "Press Ctrl+C here to stop the server."
echo

python3 -m http.server 8001 --bind 0.0.0.0
