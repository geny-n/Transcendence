NAME = transcendence
DOC_COMP = docker compose

export BUILDAH_FORMAT=docker

#colors
GREEN = \033[0;32m
RESET = \033[0m

all: certs build up

#generate self-signed SSL certificates for nginx if not already present
certs:
	@mkdir -p nginx/certs
	@if [ ! -f nginx/certs/cert.pem ] || [ ! -f nginx/certs/key.pem ]; then \
		echo "Génération des certificats SSL auto-signés..."; \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout nginx/certs/key.pem \
			-out nginx/certs/cert.pem \
			-subj "/C=FR/ST=Paris/L=Paris/O=42School/CN=localhost" \
			2>/dev/null; \
		echo "$(GREEN)Certificats générés dans nginx/certs/$(RESET)"; \
	else \
		echo "Certificats SSL déjà présents, on passe."; \
	fi

#build images
build:
	$(DOC_COMP) build
	@echo "$(GREEN)Images créées avec succès !$(RESET)"

#start containers
up:
	$(DOC_COMP) up -d
	@echo "$(GREEN)Bienvenue sur https://localhost:1443$(RESET)"

#stop and remove containers (volumes and images kept)
down:
	$(DOC_COMP) down
	@echo "$(GREEN)Containers arrêtés.$(RESET)"

bd:
	docker exec -it bd mysql -u user_root -p123 mydb

logs:
	$(DOC_COMP) logs -f

fclean:
	$(DOC_COMP) down -v --rmi all --remove-orphans 2>/dev/null || true
	docker system prune -af
	docker volume prune -f
	@echo "$(GREEN)Tout est nettoyé !$(RESET)"

re: fclean all

.PHONY: all certs build up down bd logs fclean re
