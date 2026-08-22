#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <release-id> <output-directory>" >&2
  exit 64
fi

release_id="$1"
output_dir="$2"

if [[ ! "$release_id" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Release ID may contain only letters, numbers, dots, underscores, and hyphens." >&2
  exit 64
fi

if [[ -e "$output_dir" ]]; then
  echo "Output directory already exists: $output_dir" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
publish_dir="$output_dir/publish"
archive_path="$output_dir/$release_id.tar.gz"

mkdir -p "$publish_dir"

(
  cd "$repo_root/src/Poqr.Web"
  npm ci
  npm run build
)

dotnet publish "$repo_root/src/Poqr.Api/Poqr.Api.csproj" \
  -c Release \
  -r linux-x64 \
  --self-contained true \
  -o "$publish_dir"

rm -rf "$publish_dir/wwwroot"
mkdir -p "$publish_dir/wwwroot"
cp -a "$repo_root/src/Poqr.Web/dist/poqr-web/browser/." "$publish_dir/wwwroot/"

tar -C "$publish_dir" -czf "$archive_path" .

printf 'Created release archive: %s\n' "$archive_path"
