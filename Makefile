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

bdd:
	docker exec -it git_tran-bdd-1 mysql -u root -proot123

#check containers
ps:
	$(DOC_COMP) ps

# Affiche les logs
logs_f:
	docker logs git_tran-frontend-1
logs_b:
	docker logs git_tran-backend-1
logs_n:
	docker logs git_tran-nginx-1

#stop containers
down:
	$(DOC_COMP) down

fclean:
	$(DOC_COMP) down -v --rmi all --remove-orphans 2>/dev/null || true
	$(DOC_COMP) system prune -af --volumes 2>/dev/null || true
	echo "$(GREEN)Everithing is clean !$(RESET)"

re: fclean all