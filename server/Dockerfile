# PocketBase is a single static binary, so there is nothing to build — just
# fetch it and run it. Pinned deliberately: an unpinned :latest would silently
# change the schema API under the migrations in pb_migrations/.
FROM alpine:3.21

ARG PB_VERSION=0.39.9
ARG TARGETARCH

RUN apk add --no-cache ca-certificates unzip wget

RUN case "$TARGETARCH" in \
      amd64) PB_ARCH=amd64 ;; \
      arm64) PB_ARCH=arm64 ;; \
      *) echo "unsupported arch: $TARGETARCH" && exit 1 ;; \
    esac && \
    wget -q -O /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" && \
    unzip -o /tmp/pb.zip -d /usr/local/bin/ pocketbase && \
    chmod +x /usr/local/bin/pocketbase && \
    rm /tmp/pb.zip

# Migrations are baked into the image and applied automatically at boot, so the
# schema is version-controlled rather than clicked into the admin UI.
COPY pb_migrations /pb/pb_migrations

# /pb/pb_data is the Fly volume mount point — everything stateful lives there.
EXPOSE 8080
CMD ["pocketbase", "serve", \
     "--http=0.0.0.0:8080", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations"]
