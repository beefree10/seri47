$token = "YOUR_GITHUB_TOKEN_HERE"
$headers = @{"Authorization"="token $token";"Accept"="application/vnd.github+json";"Content-Type"="application/json"}
$apiUrl = "https://api.github.com/repos/beefree10/seri47/contents/index.html"
$src = "$PSScriptRoot\seri47-v9.html"

Write-Host "v9 deploy start..."
$content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($src))
$current = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get -ErrorAction SilentlyContinue
$sha = $current.sha

$bodyObj = @{message="deploy v9 $(Get-Date -Format 'yyyy-MM-dd HH:mm')";content=$content}
if ($sha) { $bodyObj.sha = $sha }
$body = $bodyObj | ConvertTo-Json -Compress

Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Put -Body $body | Out-Null
Write-Host "Done! https://beefree10.github.io/seri47/"
