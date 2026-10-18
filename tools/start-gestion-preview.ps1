$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = (Get-Command node -ErrorAction Stop).Source
& $nodeCommand (Join-Path $PSScriptRoot 'prepare-gestion-preview.mjs')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la instancia de gestión.' }
$arguments = @(
    '"tools/playground.mjs"', 'server', '--no-login',
    '--mount-dir', ('"' + (Join-Path $projectRoot 'theme/rp-usados') + '"'), '"/wordpress/wp-content/themes/rp-usados"',
    '--mount-dir', ('"' + (Join-Path $projectRoot 'plugins/rp-usados-security') + '"'), '"/wordpress/wp-content/plugins/rp-usados-security"',
    '--mount-dir', ('"' + (Join-Path $projectRoot 'tools/.preview/gestion-local') + '"'), '"/gestion-local-output"',
    '--blueprint', 'tools/.preview/gestion-local/blueprint.json', '--port', '9540',
    '--workers', '6', '--wp', '6.8', '--php', '8.3', '--define-bool', 'DISABLE_WP_CRON', 'true'
)
$previewProcess = Start-Process -FilePath $nodeCommand -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'tools/.preview/gestion-local/server.log') -RedirectStandardError (Join-Path $projectRoot 'tools/.preview/gestion-local/server-error.log') -PassThru
Write-Output "Gestión local iniciada (PID $($previewProcess.Id)): http://127.0.0.1:9540/gestion/"
Write-Output ('Acceso generado únicamente para esta instancia: ' + (Join-Path $projectRoot 'tools/.preview/gestion-local/access.json'))
