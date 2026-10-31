#requires -Version 7.0
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
& (Join-Path $PSScriptRoot 'ensure-test-db.ps1')
if (-not $?) { throw 'Database preparation failed; Nuxt will not start.' }
& pnpm exec nuxt dev
exit $LASTEXITCODE
