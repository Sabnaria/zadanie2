# Sprawozdanie z zadania 2

## Opis
Pipeline CD/CI stworzony w ramach wykonania sprawozdania z drugiego obowiązkowego zadania. Pipeline buduje obraz kontenera dla platform linux_amd64 i linux_arm64. 

## Schemat tagowania
- `sha-<commit>` — unikalny tag dla każdego commita w celu rozróżnienia wersji
- `vX.Y.Z` — tag wersji przy pushu taga git
Fragment uruchomienia:
```
~/Studia/Docker/zadanie2% git tag v1.0.4
~/Studia/Docker/zadanie2% git push origin v1.0.4
Wymienianie obiektów: 9, gotowe.
Zliczanie obiektów: 100% (9/9), gotowe.
Kompresja delt z użyciem do 10 wątków
Kompresowanie obiektów: 100% (3/3), gotowe.
Zapisywanie obiektów: 100% (5/5), 703 bajt | 703.00 KiB/s, gotowe.
Total 5 (delta 2), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To https://github.com/Sabnaria/zadanie2.git
 * [new tag]         v1.0.4 -> v1.0.4
```
Schemat ten jest przede wszystkim prosty w obsłudze i zapamietaniu, w dodatku łatwo rozróżnić działajace wersje od niedziałajacych. 

## Cache
Cache jest brane z Docker Hub'a w momencie budowania i pushowania obrazu. Po zbudowaniu cach jest przekazywany ponownie do Docker Hub'a w trybie _mode=max_. Wybór tego trybu był bezposrednio podytkowany z treści zadania, ale również tryb ten sprzyja budowaniu obrazów z `multi_stage` co jest używane przy naszym Dockerfile'u.  Fragment kodu:
```
name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=registry,ref=sabnaria/aplikacja-cache:cache
          cache-to: type=registry,ref=sabnaria/aplikacja-cache:cache,mode=max
```

## CVE
Skan z podatnościami jest wykonywany przez `Trivy`. W pierwszej wersji Pipeline'a obraz przed dodaniem na publiczne repozytorium miał być przeskanowany przez skaner. Pojawiły się jednak problemy, które uniemożliwiały wykonanie zadania w powyższy sposób. Problem ten widać w uruchomieniu pipeline z tagiem `v1.0.2` i `v1.0.3`. Problemem było skaner Trivy nie mógł znaleźc obrazu z ghcr.io, obraz nie był pushowany do rejestru przez co nie mógł być przeskanowany. 

Aby rozwiązac problem zmieniono logike pipeline'u. W obecnej wersji obraz jest dodawany do rejestru, skanowany a w momencie pojawienia się podatności `HIGH` lub `CRITICAL` obraz jest usuwany z repozytorium.

Fragment kodu:
```
 - name: CVE scan (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/sabnaria/aplikacja:${{ steps.meta.outputs.version }}
          format: table
          exit-code: '1'
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          platform: linux/amd64
        env:
          TRIVY_USERNAME: ${{ github.actor }}
          TRIVY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}

      - name: Delete image if CVE scan failed
        if: failure()
        run: |
          gh api \
            --method DELETE \
            /user/packages/container/aplikacja/versions/$(gh api /user/packages/container/aplikacja/versions | jq '.[0].id')
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
# Inne problemy
W zadaniu 1 Dockerfile bazował na pliku `alpine-minirootfs-3.23.3-aarch64.tar` który znajdował się lokalnie na hoście. W momencie uruchomienia po raz pierwszy pipeline'u, pojawił się błąd mówiący o niemożliwości znalezienia pliku tar. ABy rozwiazac problem zmieniono Dockerfile'a. W nowej wersji pierwsza warstwa jest budowana bezposrednio z obrazu alpine, a nie ze scratch. 

**Stara wersja:**
```
FROM scratch AS app_build

ADD alpine-minirootfs-3.23.3-aarch64.tar /
```
**Nowa wersja:**
```
FROM alpine:3.23 AS app_build
```
