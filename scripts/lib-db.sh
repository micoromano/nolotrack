# shellcheck shell=sh
# Funzioni comuni a backup.sh / ripristina.sh: stesso script per Docker Compose
# e Kubernetes. Con K8S_NAMESPACE impostato (es. K8S_NAMESPACE=nolotrack) i
# comandi passano da kubectl invece che da docker compose.

if [ -n "${K8S_NAMESPACE:-}" ]; then
  KUBECTL="kubectl -n $K8S_NAMESPACE"
  db_exec() { $KUBECTL exec -i statefulset/db -c postgres -- "$@"; }
  servizi_stop() { $KUBECTL scale deployment app rest auth --replicas=0 && $KUBECTL wait --for=delete pod -l 'app.kubernetes.io/name in (app,rest,auth)' --timeout=120s 2>/dev/null || true; }
  servizi_start() { $KUBECTL scale deployment auth rest app --replicas=1; }
else
  db_exec() { docker compose exec -T db "$@"; }
  servizi_stop() { docker compose stop app rest auth; }
  servizi_start() { docker compose up -d --no-build; }
fi
