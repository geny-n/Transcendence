NAME = transcendence
DOC_COMP = docker compose

#colors
GREEN = \033[0;32m
RESET = \033[0m

all: build up

#get tree
tree:
	tree -L 4

#build images
build:
	$(DOC_COMP) build
	echo "$(GREEN)images created with success !$(RESET)"

#build containers
up:
	$(DOC_COMP) up -d
	echo "$(GREEN)Welcome to https://localhost $(RESET)"

bd:
	docker exec -it bd mysql -u user_root -p123 mydb

fclean:
	$(DOC_COMP) down -v --rmi all --remove-orphans 2>/dev/null || true
	docker system prune -af --volumes 2>/dev/null || true
	echo "$(GREEN)Everithing is clean !$(RESET)"

re: fclean all