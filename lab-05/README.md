# LAB-05: Terraform en Google Cloud

## Evidencia

| Lab | Puntaje | Captura | Carpeta |
|-----|---------|---------|---------|
| GSP233: Deploy Kubernetes Load Balancer Service with Terraform | 100/100 | [evidencia/gsp233.png](evidencia/gsp233.png) | [01-gsp233/](01-gsp233/) |
| GSP497: Cloud Operations for GKE | 100/100 | [evidencia/gsp497.png](evidencia/gsp497.png), [evidencia/monitoring.png](evidencia/monitoring.png) | [02-gsp497/](02-gsp497/) |
| GSP345: Build Infrastructure with Terraform on Google Cloud: Challenge Lab | 100/100 | [evidencia/gsp345.png](evidencia/gsp345.png) | [03-gsp345/](03-gsp345/) |

### GSP345 por tarea

| Tarea | Qué hace | Plan | Resultado del plan |
|-------|----------|------|--------------------|
| 1 | Estructura de archivos y módulos | (sin plan) | `main.tf`, `variables.tf`, `modules/instances/`, `modules/storage/` |
| 2 | Importar `tf-instance-1` y `tf-instance-2` | [plan-2.txt](03-gsp345/plan-2.txt) | `0 to add, 2 to change, 0 to destroy` |
| 3 | Bucket y backend remoto en Cloud Storage | [plan-3.txt](03-gsp345/plan-3.txt), [init-backend.txt](03-gsp345/init-backend.txt) | `1 to add`; estado migrado a `gs://tf-bucket-727642/terraform/state` |
| 4 | `e2-standard-2` y tercera instancia | [plan-4.txt](03-gsp345/plan-4.txt) | `1 to add, 2 to change, 0 to destroy` |
| 5 | Destruir la tercera instancia | [plan-5.txt](03-gsp345/plan-5.txt) | `0 to add, 0 to change, 1 to destroy` |
| 6 | Módulo de red del Registry (`10.0.0`) y mover las instancias a las subredes | [plan-6.txt](03-gsp345/plan-6.txt), [plan-6b.txt](03-gsp345/plan-6b.txt) | `3 to add`; luego `0 to add, 2 to change, 0 to destroy` |
| 7 | Regla de firewall `tf-firewall` (TCP 80 desde `0.0.0.0/0`) | [plan-7.txt](03-gsp345/plan-7.txt) | `1 to add, 0 to change, 0 to destroy` |

[state-list.txt](03-gsp345/state-list.txt) tiene `terraform state list` dos veces: justo después del import (las dos instancias) y al final del lab.

## Bitácora

### GSP233

**Qué hice.** Desplegué un clúster de GKE y NGINX con un Service tipo `LoadBalancer`, usando dos providers en la misma configuración: `google` crea la red, la subred y el clúster (`main.tf`) y la IP estática (`k8s.tf`), y `kubernetes` crea el namespace `staging`, el replication controller y el Service (`k8s.tf`).

- [plan-inicial.txt](01-gsp233/plan-inicial.txt): `Plan: 7 to add`. Son 4 recursos de `google` y 3 de `kubernetes`.
- El grafo de dependencias se ve en `k8s.tf`: el provider `kubernetes` toma su `host`, certificado y CA de `google_container_cluster.default`, así que nada de Kubernetes se puede crear hasta que el clúster exista. El `kubernetes_service.nginx` además usa la IP de `google_compute_address.default` como `load_balancer_ip`.
- IP externa del Service: **136.108.183.69** ([servicio.txt](01-gsp233/servicio.txt)), en el namespace `staging`, puerto 80.
- `curl http://136.108.183.69` devolvió la página *Welcome to nginx!* ([curl-nginx.txt](01-gsp233/curl-nginx.txt)).

**Qué me costó.** La primera vez terminé el lab sin guardar nada y tuve que repetirlo. En la segunda vez el `apply` ya estaba hecho cuando fui a guardar el plan, y un `plan` en esa carpeta habría dicho `No changes`. Lo resolví copiando los `.tf` a una carpeta vacía (sin estado) y corriendo `terraform plan` ahí con las mismas variables del lab (`region=us-east1`, `location=us-east1-c`): contra un estado vacío, el plan es exactamente el que se ve antes del primer `apply`. Además `kubectl` no veía el Service hasta que corrí `gcloud container clusters get-credentials` y busqué en todos los namespaces (`-A`), porque está en `staging`, no en `default`.

**Qué cambiaría.** Guardar el plan con `terraform plan -out` **antes** del `apply` desde el principio, como hice en el lab 3.

### GSP497

**Qué hice.** Creé con Terraform (`make create`) un clúster de GKE con una aplicación de ejemplo y una política de alertas de Cloud Monitoring, revisé las métricas de Prometheus en Metrics Explorer (recurso *Prometheus Target*) y destruí todo con `make teardown`.

- [plan-inicial.txt](02-gsp497/plan-inicial.txt): `Plan: 5 to add, 0 to change, 0 to destroy`.
- [destroy.txt](02-gsp497/destroy.txt): termina con `Destroy complete! Resources: 5 destroyed.` Coincide con los 5 del plan.
- Captura de Monitoring: [evidencia/monitoring.png](evidencia/monitoring.png).

**Qué me costó.** El primer `make teardown` lo corrí sin guardar la salida en un archivo. Como el estado quedó vacío, volví a hacer el ciclo completo: generé las variables con `scripts/generate-tfvars.sh` (lo mismo que hace `make create` por dentro), guardé el plan inicial, volví a crear con `make create`, tomé la captura de Monitoring y destruí otra vez con `make teardown 2>&1 | tee destroy.txt`. El `destroy.txt` traía los colores de la terminal como códigos de escape; se los quité para que se lea en GitHub.

**Qué cambiaría.** Leer el `Makefile` y los scripts antes de empezar: ahí se ve que `make teardown` además borra `terraform.tfvars` y el estado local, así que después ya no se puede rehacer el plan sin regenerar las variables.

### GSP345

**Qué hice.** Las siete tareas, con un `plan` guardado antes de cada `apply`. En cada tarea usé `terraform plan -no-color -out=tfplan > plan-N.txt` y luego `terraform apply tfplan`: así lo que se aplicó es exactamente el plan que está en el archivo, no uno recalculado.

- **Tarea 2, import.** Escribí las dos instancias en `modules/instances/instances.tf` con solo los argumentos que pide el lab (`machine_type`, `boot_disk`, `network_interface`, `metadata_startup_script`, `allow_stopping_for_update`) y las importé con `terraform import module.instances.google_compute_instance.tf-instance-N projects/<proyecto>/zones/us-central1-c/instances/tf-instance-N`. Para que el import coincida con lo que ya existe:
  - `machine_type`: el mismo de la instancia (`e2-micro`). Si no coincide, el plan lo cambia en el lugar (con `allow_stopping_for_update`).
  - `boot_disk.initialize_params.image`: la imagen real del disco (`debian-12-bookworm-v20261102`, la que corresponde a `debian-12`), que saqué con `gcloud compute disks describe`. Si la imagen no coincide, Terraform **destruye y recrea** la instancia, porque la imagen de un disco de arranque no se puede cambiar.
  - `network_interface.network`: `default`, la red donde estaban creadas.
  - El `plan-2.txt` quedó en `0 to add, 2 to change, 0 to destroy`: solo actualiza en el lugar `metadata_startup_script` y `allow_stopping_for_update`, que no estaban en las instancias creadas a mano. Ninguna se recrea.
- **Tarea 3, backend.** Primero creé el bucket con el módulo `storage` (estado todavía local), después agregué `backend "gcs"` con `prefix = "terraform/state"` y corrí `terraform init -migrate-state`. Terraform detecta que cambió el backend y copia el estado local al bucket (`-force-copy` responde `yes` a esa pregunta). Desde ahí el estado vive en `gs://tf-bucket-727642/terraform/state/default.tfstate`, y el `terraform.tfstate` local queda vacío; ninguno de los dos está en este repositorio.
- **Tareas 4 y 5.** Cambiar a `e2-standard-2` es un cambio en el lugar (`~`) gracias a `allow_stopping_for_update = true`: Terraform detiene la instancia, cambia el tipo y la vuelve a encender. La tercera instancia `tf-instance-072656` se crea en la tarea 4 y se destruye en la 5 solo con borrar su bloque del archivo (`1 to destroy`).
- **Tarea 6.** Módulo `terraform-google-modules/network/google` fijado en `version = "10.0.0"`, VPC `tf-vpc-137176` con `routing_mode = "GLOBAL"` y las subredes `subnet-01` (`10.10.10.0/24`) y `subnet-02` (`10.10.20.0/24`) en `us-central1`. Después moví cada instancia a su subred: `plan-6b.txt` dice `2 to change`, sin recrear.
- **Tarea 7.** `tf-firewall` solo permite TCP 80 desde `0.0.0.0/0` en `tf-vpc-137176`, tomando la red de la salida del módulo (`module.vpc.network_self_link`) en lugar de escribir el `self_link` a mano.

**¿Qué pasa si dos personas corren `apply` a la vez contra este backend?** El backend `gcs` bloquea el estado: al empezar un `plan` o `apply`, Terraform crea un archivo de lock (`default.tflock`) junto al estado en el bucket. El segundo `apply` no puede tomar el lock y falla con `Error acquiring the state lock`, mostrando quién lo tiene y desde cuándo. Así no se pisan dos escrituras del estado. Si un proceso muere y deja el lock tomado, se libera a mano con `terraform force-unlock <ID>`, después de confirmar que nadie más está aplicando.

**Qué me costó.** Que el import no recreara las instancias: la clave fue copiar la imagen exacta del disco en lugar de inventarla. Y el orden de la tarea 3: el bucket tiene que existir antes de declararlo como backend, porque `init` necesita escribir el estado ahí.

**Qué cambiaría.** Usar `import` blocks (Terraform 1.5+) en lugar del comando `terraform import`, para que el import también quede en el código y aparezca en el `plan`.
