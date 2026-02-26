NAME = transcendence
DOC_COMP = docker compose

#colors
GREEN = \033[0;32m
RESET = \033[0m

all: build up

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
	docker volume prune -af
	@echo "$(GREEN)Tout est nettoyé !$(RESET)"

re: fclean all

.PHONY: all build up down bd logs fclean re