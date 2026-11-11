# rajvarshith.com Studio Launcher
$port = 5000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if (-not $tcp) {
    Start-Process -FilePath "node" -ArgumentList "server/index.js" -WorkingDirectory "D:\Audio Editor" -WindowStyle Hidden
    Start-Sleep -Milliseconds 1000
}

# Open rajvarshith.com Studio in default browser
Start-Process "http://localhost:5000"
