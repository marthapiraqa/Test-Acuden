$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    $version = 'v24.21.0'
    $archive = "node-$version-win-x64.zip"
    $nodeDirectory = Join-Path $root ".tools\node-$version-win-x64"
    if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node.exe'))) {
        New-Item -ItemType Directory -Force '.tools' | Out-Null
        Invoke-WebRequest "https://nodejs.org/dist/$version/$archive" -OutFile ".tools/$archive" -UseBasicParsing
        $checksums = Invoke-WebRequest "https://nodejs.org/dist/$version/SHASUMS256.txt" -UseBasicParsing
        $line = $checksums.Content -split "`n" | Where-Object { $_.Trim().EndsWith($archive) }
        $expected = ($line -split '\s+')[0]
        if ((Get-FileHash ".tools/$archive" -Algorithm SHA256).Hash -ne $expected) {
            throw 'SHA256 de Node.js incorrecto'
        }
        Expand-Archive -LiteralPath ".tools/$archive" -DestinationPath '.tools' -Force
    }
    & "$root\pw.ps1" ci
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible instalar dependencias' }
    & "$root\pw.ps1" run browsers
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible instalar Chromium' }
    if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
} finally {
    Pop-Location
}
