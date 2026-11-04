#!/bin/sh
# =============================================================================
# Costruisce e pubblica le immagini per Kubernetes (app + migrate)
# =============================================================================
#   ./scripts/k8s-build.sh <overlay> <registry> <tag> [--push]
#   ./scripts/k8s-build.sh deploy/k8s/overlays/produzione ghcr.io/micoromano 1.0.0 --push
#
# L'immagine dell'app incorpora PUBLIC_URL (config.env), ANON_KEY (secrets.env)
# e le NEXT_PUBLIC_* (build.env) dell'overlay: è specifica per quell'installazione.
# L'immagine migrate contiene database/ (schema) ed è uguale per tutti.
# Alla fine aggiorna il tag delle immagini nel kustomization.yaml dell'overlay.
# =============================================================================
set -eu
cd "$(dirname "$0")/.."

OVERLAY="${1:?Uso: $0 <overlay> <registry> <tag> [--push]}"
REGISTRY="${2:?registry mancante (es. ghcr.io/utente)}"
TAG="${3:?tag mancante (es. 1.0.0)}"
PUSH="${4:-}"

leggi() { # leggi FILE CHIAVE
  [ -f "$1" ] || { echo "ERRORE: $1 non trovato" >&2; exit 1; }
  sed -n "s/^$2=//p" "$1" | tail -1
}

PUBLIC_URL=$(leggi "$OVERLAY/config.env" PUBLIC_URL)
ANON_KEY=$(leggi "$OVERLAY/secrets.env" ANON_KEY)
[ -n "$PUBLIC_URL" ] && [ -n "$ANON_KEY" ] \
  || { echo "ERRORE: PUBLIC_URL (config.env) o ANON_KEY (secrets.env) vuoti" >&2; exit 1; }

BUILD_ARGS="--build-arg NEXT_PUBLIC_SUPABASE_URL=$PUBLIC_URL --build-arg NEXT_PUBLIC_APP_URL=$PUBLIC_URL --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
if [ -f "$OVERLAY/build.env" ]; then
  for k in $(sed -n 's/^\(NEXT_PUBLIC_[A-Z_]*\)=.*/\1/p' "$OVERLAY/build.env"); do
    BUILD_ARGS="$BUILD_ARGS --build-arg $k=$(leggi "$OVERLAY/build.env" "$k")"
  done
fi

APP="$REGISTRY/nolotrack-app:$TAG"
MIGRATE="$REGISTRY/nolotrack-migrate:$TAG"

echo "→ $APP"
# shellcheck disable=SC2086
docker build $BUILD_ARGS -t "$APP" .
echo "→ $MIGRATE"
DOCKER_BUILDKIT=1 docker build -f docker/migrate/Dockerfile -t "$MIGRATE" .

if [ "$PUSH" = "--push" ]; then
  docker push "$APP"
  docker push "$MIGRATE"
fi

# Aggiorna il kustomization.yaml dell'overlay con registry e tag
python3 - "$OVERLAY/kustomization.yaml" "$REGISTRY" "$TAG" <<'PY' 2>/dev/null || echo "Aggiorna a mano newName/newTag in $OVERLAY/kustomization.yaml"
import re, sys
p, reg, tag = sys.argv[1:4]
s = open(p).read()
for img in ("nolotrack-app", "nolotrack-migrate"):
    s = re.sub(rf'(- name: {img}\n\s+newName: )\S+(\n\s+newTag: )\S+', rf'\g<1>{reg}/{img}\g<2>"{tag}"', s)
open(p, "w").write(s)
PY
echo "Fatto. Applica con: kubectl apply -k $OVERLAY"
