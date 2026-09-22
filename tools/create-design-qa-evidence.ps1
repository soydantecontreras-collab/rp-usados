$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactRoot = Join-Path $projectRoot 'artifacts'

function Open-Bitmap([string] $name) {
	return [System.Drawing.Bitmap]::FromFile((Join-Path $artifactRoot $name))
}

function New-Canvas([int] $width, [int] $height) {
	$bitmap = [System.Drawing.Bitmap]::new($width, $height)
	$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
	$graphics.Clear([System.Drawing.Color]::FromArgb(11, 11, 13))
	$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
	$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
	return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Draw-Label($graphics, [string] $text, [int] $x, [int] $y, [float] $size = 24) {
	$font = [System.Drawing.Font]::new('Arial', $size, [System.Drawing.FontStyle]::Bold)
	$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(244, 242, 240))
	$graphics.DrawString($text, $font, $brush, $x, $y)
	$brush.Dispose()
	$font.Dispose()
}

function Draw-FullImage($graphics, $image, [int] $x, [int] $y, [int] $width) {
	$height = [int] [Math]::Round($image.Height * ($width / $image.Width))
	$graphics.DrawImage($image, [System.Drawing.Rectangle]::new($x, $y, $width, $height))
	return $height
}

function Draw-Crop($graphics, $image, [System.Drawing.Rectangle] $source, [System.Drawing.Rectangle] $destination) {
	$graphics.DrawImage($image, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
}

$desktopBefore = Open-Bitmap 'qa-baseline-desktop.png'
$desktopAfter = Open-Bitmap 'home-desktop.png'
$mobileBefore = Open-Bitmap 'qa-baseline-mobile.png'
$mobileAfter = Open-Bitmap 'home-mobile.png'

try {
	$desktopWidth = 720
	$desktopHeight = [Math]::Max(
		[int] [Math]::Round($desktopBefore.Height * ($desktopWidth / $desktopBefore.Width)),
		[int] [Math]::Round($desktopAfter.Height * ($desktopWidth / $desktopAfter.Width))
	)
	$mobileWidth = 360
	$mobileHeight = [Math]::Max(
		[int] [Math]::Round($mobileBefore.Height * ($mobileWidth / $mobileBefore.Width)),
		[int] [Math]::Round($mobileAfter.Height * ($mobileWidth / $mobileAfter.Width))
	)
	$canvas = New-Canvas 1600 (260 + $desktopHeight + 140 + $mobileHeight + 100)
	$graphics = $canvas.Graphics
	Draw-Label $graphics 'RP Usados - design QA' 60 38 34
	Draw-Label $graphics 'Source: IMPLEMENTATION_PLAN.md | State: Home without stock or approved media' 60 92 18
	Draw-Label $graphics 'Before - desktop 1440 px' 60 180 22
	Draw-Label $graphics 'After - desktop 1440 px' 820 180 22
	[void] (Draw-FullImage $graphics $desktopBefore 60 230 $desktopWidth)
	[void] (Draw-FullImage $graphics $desktopAfter 820 230 $desktopWidth)
	$mobileTop = 230 + $desktopHeight + 110
	Draw-Label $graphics 'Before - mobile 390 px' 410 ($mobileTop - 50) 22
	Draw-Label $graphics 'After - mobile 390 px' 830 ($mobileTop - 50) 22
	[void] (Draw-FullImage $graphics $mobileBefore 410 $mobileTop $mobileWidth)
	[void] (Draw-FullImage $graphics $mobileAfter 830 $mobileTop $mobileWidth)
	$canvas.Bitmap.Save((Join-Path $artifactRoot 'design-qa-comparison.png'), [System.Drawing.Imaging.ImageFormat]::Png)
	$graphics.Dispose()
	$canvas.Bitmap.Dispose()

	$focus = New-Canvas 1600 1510
	$focusGraphics = $focus.Graphics
	Draw-Label $focusGraphics 'Focused comparison' 60 38 34
	Draw-Label $focusGraphics 'Before' 60 105 22
	Draw-Label $focusGraphics 'After' 820 105 22
	Draw-Crop $focusGraphics $desktopBefore ([System.Drawing.Rectangle]::new(0, 1320, 1440, 1260)) ([System.Drawing.Rectangle]::new(60, 150, 720, 630))
	Draw-Crop $focusGraphics $desktopAfter ([System.Drawing.Rectangle]::new(0, 1210, 1440, 1160)) ([System.Drawing.Rectangle]::new(820, 150, 720, 630))
	Draw-Label $focusGraphics 'Services and empty state' 60 805 20
	Draw-Crop $focusGraphics $desktopBefore ([System.Drawing.Rectangle]::new(0, 2680, 1440, 900)) ([System.Drawing.Rectangle]::new(60, 860, 720, 450))
	Draw-Crop $focusGraphics $desktopAfter ([System.Drawing.Rectangle]::new(0, 2450, 1440, 820)) ([System.Drawing.Rectangle]::new(820, 860, 720, 450))
	Draw-Label $focusGraphics 'Location: removed faux map; structured confirmed data' 60 1340 20
	$focus.Bitmap.Save((Join-Path $artifactRoot 'design-qa-focus.png'), [System.Drawing.Imaging.ImageFormat]::Png)
	$focusGraphics.Dispose()
	$focus.Bitmap.Dispose()
} finally {
	$desktopBefore.Dispose()
	$desktopAfter.Dispose()
	$mobileBefore.Dispose()
	$mobileAfter.Dispose()
}

Write-Output 'Evidencia design QA generada en artifacts/.'
