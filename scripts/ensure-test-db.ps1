#requires -Version 7.0
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) { throw "Authorisation test database: $Message" }
function Docker([string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) { Fail "Docker command failed: $($Arguments[0])" }
}

if (-not (Test-Path '.env')) { Fail 'Create a local .env with PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD.' }
foreach ($line in [System.IO.File]::ReadAllLines((Resolve-Path '.env'))) {
    if ($line -match '^\s*(?:#|$)') { continue }
    if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { Fail 'Invalid .env line; use unquoted KEY=value entries.' }
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
}
$expected = @{
    PGHOST = '127.0.0.1'; PGPORT = '5432'
    PGDATABASE = 'authorisation_contract_test'; PGUSER = 'authorisation_contract'
}
foreach ($key in $expected.Keys) {
    if ([Environment]::GetEnvironmentVariable($key, 'Process') -cne $expected[$key]) {
        Fail "$key must equal $($expected[$key]); refusing to use another database or account."
    }
}
if ([string]::IsNullOrEmpty($env:PGPASSWORD)) { Fail 'PGPASSWORD is missing from .env.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail 'Docker CLI not installed.' }

& docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) {
    $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $desktop)) { Fail 'Docker engine unavailable and Docker Desktop executable was not found.' }
    Write-Host 'Starting Docker Desktop...'
    Start-Process -FilePath $desktop
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 2
        & docker info --format '{{.ServerVersion}}' *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    }
    if (-not $ready) { Fail 'Docker Desktop engine did not become available.' }
}
Write-Host 'Docker engine available.'

$name = 'authorisation-test-db'
$containerNames = @(& docker ps -a --format '{{.Names}}')
if ($LASTEXITCODE -ne 0) { Fail 'Unable to list Docker containers.' }
if ($containerNames -notcontains $name) {
    Write-Host 'Creating isolated PostgreSQL 18 container...'
    # Password is passed through the environment, never on the command line.
    $previous = [Environment]::GetEnvironmentVariable('POSTGRES_PASSWORD', 'Process')
    try {
        $env:POSTGRES_PASSWORD = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
        Docker @('run', '-d', '--name', $name, '--publish', '127.0.0.1:5432:5432',
            '--volume', 'authorisation-contract-db-data:/var/lib/postgresql',
            '-e', 'POSTGRES_PASSWORD', 'postgres:18-alpine')
    } finally {
        [Environment]::SetEnvironmentVariable('POSTGRES_PASSWORD', $previous, 'Process')
    }
} else {
    $state = (& docker inspect --format '{{.State.Running}}' $name).Trim()
    if ($LASTEXITCODE -ne 0) { Fail 'Cannot inspect database container.' }
    if ($state -ne 'true') {
        Write-Host 'Starting existing PostgreSQL container...'
        Docker @('start', $name)
    }
}
$ports = @(& docker port $name '5432/tcp')
if ($LASTEXITCODE -ne 0 -or ($ports -notmatch '127\.0\.0\.1:5432').Count -eq 0) {
    Fail 'Container must publish PostgreSQL on 127.0.0.1:5432; refusing to replace it.'
}

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    & docker exec $name pg_isready -U postgres -d postgres *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $ready) { Fail 'PostgreSQL did not become ready.' }

$roleExists = (& docker exec $name psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'authorisation_contract'").Trim()
if ($LASTEXITCODE -ne 0) { Fail 'Unable to inspect PostgreSQL roles.' }
if ($roleExists -ne '1') {
    $escaped = $env:PGPASSWORD.Replace("'", "''")
    $createRoleSql = "CREATE ROLE authorisation_contract LOGIN PASSWORD '$escaped';"
    $createRoleSql | & docker exec -i $name psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 *> $null
    if ($LASTEXITCODE -ne 0) { Fail 'Unable to create dedicated test role.' }
    Write-Host 'Created dedicated test role.'
}
$dbExists = (& docker exec $name psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'authorisation_contract_test'").Trim()
if ($LASTEXITCODE -ne 0) { Fail 'Unable to inspect PostgreSQL databases.' }
if ($dbExists -ne '1') {
    Docker @('exec', $name, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
        '-c', 'CREATE DATABASE authorisation_contract_test OWNER authorisation_contract')
    Write-Host 'Created isolated test database.'
} else {
    $owner = (& docker exec $name psql -U postgres -d postgres -tAc "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'authorisation_contract_test'").Trim()
    if ($LASTEXITCODE -ne 0) { Fail 'Unable to inspect test database owner.' }
    if ($owner -ne 'authorisation_contract') {
        Fail "Existing test database belongs to '$owner'. Resolve ownership deliberately; no automatic takeover."
    }
}
& node (Join-Path $PSScriptRoot 'check-database.mjs')
if ($LASTEXITCODE -ne 0) { Fail 'Database credentials or connection are invalid. Correct local .env; no passwords were changed.' }
Write-Host 'Authorisation test database ready.'
