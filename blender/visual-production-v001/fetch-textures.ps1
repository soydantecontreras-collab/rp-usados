$ErrorActionPreference = 'Stop'
$textureDir = Join-Path $PSScriptRoot 'textures'
New-Item -ItemType Directory -Force -Path $textureDir | Out-Null
$records = @()
foreach ($id in @('painted_plaster_wall', 'asphalt_02', 'concrete_floor_worn_001')) {
    $d = Invoke-RestMethod "https://api.polyhaven.com/files/$id"
    foreach ($map in @('Diffuse', 'Rough', 'nor_gl')) {
        if ($id -eq 'painted_plaster_wall' -and $map -eq 'Diffuse') { continue }
        $resolution = if ($id -eq 'asphalt_02') { '2k' } else { '1k' }
        $entry = $d.$map.$resolution.jpg
        $target = Join-Path $textureDir ([IO.Path]::GetFileName($entry.url))
        if (-not (Test-Path -LiteralPath $target)) {
            Invoke-WebRequest $entry.url -OutFile $target
        }
        $records += [PSCustomObject]@{
            asset=$id; map=$map; resolution=$resolution
            file=[IO.Path]::GetFileName($target); url=$entry.url
            source="https://polyhaven.com/a/$id"; license='CC0'
            bytes=(Get-Item -LiteralPath $target).Length
        }
    }
}
$records | ConvertTo-Json | Set-Content (Join-Path $textureDir 'sources.json') -Encoding utf8
$records | Format-Table asset,map,resolution,bytes
