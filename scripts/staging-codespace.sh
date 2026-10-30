#!/usr/bin/env bash
# STAGING dentro del Codespace, en lugar de Rancher Desktop (Docker no funciona en mi máquina, ver bitácora).
#
#   bash scripts/staging-codespace.sh crear      # una sola vez: clúster kind "staging", namespace y Secret
#   bash scripts/staging-codespace.sh arrancar   # en cada inicio del Codespace: prende el clúster y el runner
#
# El clúster publica el NodePort 30080 en el Codespace, así que STAGING queda en http://localhost:30080
# igual que en Rancher Desktop. El Secret de Postgres se crea aquí, a mano, y el pipeline nunca lo toca.
set -euo pipefail

RUNNER_DIR="$HOME/actions-runner"

crear() {
  if ! kind get clusters 2>/dev/null | grep -qx staging; then
    cat <<'YAML' | kind create cluster --name staging --config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30080
        hostPort: 30080
YAML
  fi
  kubectl config use-context kind-staging
  kubectl get namespace demo-staging >/dev/null 2>&1 || kubectl create namespace demo-staging
  kubectl -n demo-staging get secret db-credenciales >/dev/null 2>&1 || \
    kubectl -n demo-staging create secret generic db-credenciales --from-literal=DB_PASSWORD="$(openssl rand -hex 16)"
  echo "STAGING listo: kind-staging, namespace demo-staging"
}

arrancar() {
  # Después de apagar el Codespace, el contenedor del nodo de kind queda detenido
  docker start staging-control-plane >/dev/null 2>&1 || true
  if [ -x "$RUNNER_DIR/run.sh" ] && ! pgrep -f Runner.Listener >/dev/null; then
    (cd "$RUNNER_DIR" && nohup ./run.sh >"$RUNNER_DIR/runner.log" 2>&1 &)
    echo "Runner self-hosted prendido (log en $RUNNER_DIR/runner.log)"
  fi
}

"${1:?uso: staging-codespace.sh crear|arrancar}"
