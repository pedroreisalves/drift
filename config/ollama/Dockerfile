FROM docker.io/ollama/ollama:0.24.0 AS ollama

FROM cgr.dev/chainguard/wolfi-base


RUN apk add --no-cache libstdc++

COPY --from=ollama /usr/bin/ollama /usr/bin/ollama
COPY --from=ollama /usr/lib/ollama/libggml-cpu-* /usr/lib/ollama/
COPY --from=ollama /usr/lib/ollama/libggml-base.so /usr/lib/ollama/libggml-base.so

ENV OLLAMA_HOST=0.0.0.0

EXPOSE 11434

ENTRYPOINT ["/usr/bin/ollama"]
CMD ["serve"]
