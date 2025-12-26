#!/bin/bash
# Download CLIProxyAPI binaries from GitHub releases
# This script is called by build.rs if binaries are missing

set -e

VERSION="${CLIPROXYAPI_VERSION:-v6.6.56}"
BINARIES_DIR="$(dirname "$0")/../binaries"
GITHUB_REPO="router-for-me/CLIProxyAPI"
BASE_URL="https://github.com/${GITHUB_REPO}/releases/download/${VERSION}"

# Create binaries directory if it doesn't exist
mkdir -p "$BINARIES_DIR"

# Binary mappings: Tauri target triple -> GitHub release asset name
declare -A BINARIES=(
    ["cli-proxy-api-aarch64-apple-darwin"]="cli-proxy-api_darwin_arm64.tar.gz"
    ["cli-proxy-api-x86_64-apple-darwin"]="cli-proxy-api_darwin_amd64.tar.gz"
    ["cli-proxy-api-aarch64-unknown-linux-gnu"]="cli-proxy-api_linux_arm64.tar.gz"
    ["cli-proxy-api-x86_64-unknown-linux-gnu"]="cli-proxy-api_linux_amd64.tar.gz"
    ["cli-proxy-api-aarch64-pc-windows-msvc.exe"]="cli-proxy-api_windows_arm64.zip"
    ["cli-proxy-api-x86_64-pc-windows-msvc.exe"]="cli-proxy-api_windows_amd64.zip"
)

download_binary() {
    local target_name="$1"
    local asset_name="$2"
    local target_path="${BINARIES_DIR}/${target_name}"
    
    if [ -f "$target_path" ]; then
        echo "Binary already exists: $target_name"
        return 0
    fi
    
    echo "Downloading $asset_name for $target_name..."
    local url="${BASE_URL}/${asset_name}"
    local tmp_dir=$(mktemp -d)
    local archive_path="${tmp_dir}/${asset_name}"
    
    # Download archive
    if ! curl -fsSL -o "$archive_path" "$url"; then
        echo "Failed to download: $url"
        rm -rf "$tmp_dir"
        return 1
    fi
    
    # Extract based on extension
    if [[ "$asset_name" == *.tar.gz ]]; then
        tar -xzf "$archive_path" -C "$tmp_dir"
    elif [[ "$asset_name" == *.zip ]]; then
        unzip -q "$archive_path" -d "$tmp_dir"
    fi
    
    # Find and move the binary
    local binary_name="cli-proxy-api"
    if [[ "$target_name" == *.exe ]]; then
        binary_name="cli-proxy-api.exe"
    fi
    
    local extracted_binary=$(find "$tmp_dir" -name "$binary_name" -type f | head -1)
    if [ -n "$extracted_binary" ]; then
        mv "$extracted_binary" "$target_path"
        chmod +x "$target_path"
        echo "Installed: $target_name"
    else
        echo "Binary not found in archive: $asset_name"
        rm -rf "$tmp_dir"
        return 1
    fi
    
    rm -rf "$tmp_dir"
}

# Download all binaries or just one if specified
if [ -n "$1" ]; then
    # Download specific binary
    if [ -n "${BINARIES[$1]}" ]; then
        download_binary "$1" "${BINARIES[$1]}"
    else
        echo "Unknown binary: $1"
        exit 1
    fi
else
    # Download all binaries
    for target_name in "${!BINARIES[@]}"; do
        download_binary "$target_name" "${BINARIES[$target_name]}"
    done
fi

echo "Done!"
