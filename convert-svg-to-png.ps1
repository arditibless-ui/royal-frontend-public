# PowerShell script to convert SVG to PNG using Inkscape or ImageMagick
# If neither is available, provides instructions

$svgPath = Join-Path $PSScriptRoot "public\poker-icon-512.svg"
$png192Path = Join-Path $PSScriptRoot "public\poker-icon-192.png"
$png512Path = Join-Path $PSScriptRoot "public\poker-icon-512.png"

Write-Host "Generating poker app icons from SVG..." -ForegroundColor Cyan

# Check for ImageMagick
$magickPath = Get-Command magick -ErrorAction SilentlyContinue
if ($magickPath) {
    Write-Host "Found ImageMagick, converting..." -ForegroundColor Green
    & magick $svgPath -resize 192x192 $png192Path
    & magick $svgPath -resize 512x512 $png512Path
    Write-Host "✓ Icons created successfully!" -ForegroundColor Green
    exit 0
}

# Check for Inkscape
$inkscapePath = Get-Command inkscape -ErrorAction SilentlyContinue
if ($inkscapePath) {
    Write-Host "Found Inkscape, converting..." -ForegroundColor Green
    & inkscape $svgPath --export-type=png --export-filename=$png192Path -w 192 -h 192
    & inkscape $svgPath --export-type=png --export-filename=$png512Path -w 512 -h 512
    Write-Host "✓ Icons created successfully!" -ForegroundColor Green
    exit 0
}

Write-Host "`nNo SVG converter found. Options:" -ForegroundColor Yellow
Write-Host "1. Install ImageMagick: winget install ImageMagick.ImageMagick" -ForegroundColor White
Write-Host "2. Install Inkscape: winget install Inkscape.Inkscape" -ForegroundColor White
Write-Host "3. Use online converter: https://cloudconvert.com/svg-to-png" -ForegroundColor White
Write-Host "   Upload: $svgPath" -ForegroundColor Gray
Write-Host "   Create 192x192 and 512x512 versions" -ForegroundColor Gray
Write-Host "4. Open generate-icons.html in browser to download PNG files" -ForegroundColor White
