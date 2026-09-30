$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = (Get-Command node -ErrorAction Stop).Source
& $nodeCommand (Join-Path $PSScriptRoot 'create-demo-preview.mjs') | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la preview demo.' }
$arguments = @(
    '"tools/node_modules/@wp-playground/cli/wp-playground.js"', 'server',
    '--mount-dir', ('"' + (Join-Path $projectRoot 'theme/rp-usados') + '"'),
    '"/wordpress/wp-content/themes/rp-usados"',
    '--blueprint', 'tools/.preview/rich-demo/blueprint.json', '--port', '9470',
    '--workers', '6', '--wp', '6.8', '--php', '8.3',
    '--define-bool', 'WP_DEBUG', 'true', '--define-bool', 'DISABLE_WP_CRON', 'true'
)
$previewProcess = Start-Process -FilePath $nodeCommand -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'tools/.preview/rich-demo/server.log') -RedirectStandardError (Join-Path $projectRoot 'tools/.preview/rich-demo/server-error.log') -PassThru
Write-Output "Preview DEMO local iniciada (PID $($previewProcess.Id)). URL: http://127.0.0.1:9470/"
