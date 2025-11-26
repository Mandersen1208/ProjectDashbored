Get-ChildItem -Path ".\src\components\ui" -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '@\d+\.\d+\.\d+"', '"'
    Set-Content -Path $_.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($_.Name)"
}