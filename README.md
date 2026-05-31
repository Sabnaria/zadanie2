# Aplikacja Docker — Zadanie 2

## Opis
Pipeline CD/CI stworzony w ramach wykonania sprawozdania z drugiego obowiązkowego zadania. Pipeline buduje obraz kontenera dla platform linux_amd64 i linux_arm64. 

## Schemat tagowania
- `sha-<commit>` — unikalny tag dla każdego commita
- `vX.Y.Z` — tag wersji przy pushu taga git

## Cache
Cache przechowywany na Docker Hub: `sabnaria/aplikacja-cache:cache` w trybie `mode=max`.

## CVE
Przed wysłaniem obrazu do ghcr.io wykonywany jest skan Trivy.
Obraz zostaje wysłany tylko jeśli nie zawiera zagrożeń CRITICAL ani HIGH.
