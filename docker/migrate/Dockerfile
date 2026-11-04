# =============================================================================
# NoloTrack — immagine "migrate": schema SQL + script di applicazione
# =============================================================================
# Usata in Kubernetes come initContainer dell'app: lo schema (database/) viaggia
# con la stessa versione del codice. In Docker Compose non serve (i file sono
# montati come volume), ma l'immagine funziona anche lì.
#
#   docker build -f docker/migrate/Dockerfile -t nolotrack-migrate .
# =============================================================================
FROM supabase/postgres:15.8.1.060
COPY database/ /database/
COPY docker/migrate/migrate.sh /migrate.sh
ENTRYPOINT ["sh", "/migrate.sh"]
