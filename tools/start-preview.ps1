$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js no está en PATH. Agregá el directorio de Node y volvé a ejecutar.'
}
$arguments = @(
    '"tools/node_modules/@wp-playground/cli/wp-playground.js"', 'server',
    '--mount-dir', ('"' + (Join-Path $projectRoot 'theme/rp-usados') + '"'),
    '"/wordpress/wp-content/themes/rp-usados"',
    '--blueprint', 'tools/preview-blueprint.json', '--port', '9400',
    '--workers', '6', '--wp', '6.8', '--php', '8.3',
    '--define-bool', 'WP_DEBUG', 'true', '--define-bool', 'DISABLE_WP_CRON', 'true'
)
$previewProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'preview.log') -RedirectStandardError (Join-Path $PSScriptRoot 'preview-error.log') -PassThru
Write-Output "Servidor local iniciado (PID $($previewProcess.Id)). URL: http://127.0.0.1:9400"
