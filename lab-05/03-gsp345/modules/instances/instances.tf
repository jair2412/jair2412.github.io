resource "google_compute_instance" "tf-instance-1" {
  name         = "tf-instance-1"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20261102"
    }
  }

  network_interface {
    network    = "tf-vpc-137176"
    subnetwork = "subnet-01"
  }

  metadata_startup_script = <<-EOT
        #!/bin/bash
    EOT
  allow_stopping_for_update = true
}

resource "google_compute_instance" "tf-instance-2" {
  name         = "tf-instance-2"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20261102"
    }
  }

  network_interface {
    network    = "tf-vpc-137176"
    subnetwork = "subnet-02"
  }

  metadata_startup_script = <<-EOT
        #!/bin/bash
    EOT
  allow_stopping_for_update = true
}

