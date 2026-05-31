# ── Go Service Dockerfile ─────────────────────────────────────────────────────
# Multi-stage build: compiles to a tiny static binary.

# Stage 1 — build
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Download dependencies first (cached layer)
COPY go.mod go.sum* ./
RUN go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o school-pdf-service .

# Stage 2 — minimal runtime image
FROM alpine:3.19 AS runner
WORKDIR /app

# ca-certificates needed for any HTTPS calls
RUN apk --no-cache add ca-certificates

COPY --from=builder /app/school-pdf-service .

EXPOSE 6001

CMD ["./school-pdf-service"]
