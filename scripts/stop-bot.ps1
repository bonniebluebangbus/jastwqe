$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$processes = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -ieq 'node.exe' -and
    $_.CommandLine -match 'src[\\/]index\.js' -and
    $_.CurrentDirectory -and
    ([System.IO.Path]::GetFullPath($_.CurrentDirectory).TrimEnd('\\') -ieq $projectPath.TrimEnd('\\'))
}

if (-not $processes) {
    Write-Host 'Bot is not running.'
    exit 0
}

foreach ($process in $processes) {
    Stop-Process -Id $process.ProcessId -Force
    Write-Host "Stopped bot process $($process.ProcessId)."
}
