.PHONY: help install install-global uninstall dev test clean lint

PREFIX ?= /usr/local
BIN_DIR = $(PREFIX)/bin
INSTALL_DIR = /usr/lib/hyprminimizer

help:
	@echo "hyprminimizer - Makefile Commands"
	@echo ""
	@echo "  make install         Install globally (copies project to $(INSTALL_DIR))"
	@echo "  make install-global  Alias for make install"
	@echo "  make uninstall       Remove global installation"
	@echo "  make dev             Run in watch/development mode (local)"
	@echo "  make test            Run tests (local)"
	@echo "  make lint            Lint code"
	@echo "  make clean           Clean local dependencies"
	@echo "  make help            Show this help message"

install:
	@echo "Installing hyprminimizer to $(INSTALL_DIR)..."
	@sudo rm -rf $(INSTALL_DIR)
	@sudo mkdir -p $(INSTALL_DIR)
	@sudo cp -r . $(INSTALL_DIR)
	@sudo rm -rf $(INSTALL_DIR)/node_modules $(INSTALL_DIR)/.npm
	@sudo chown -R root:root $(INSTALL_DIR)
	@sudo npm install --prefix $(INSTALL_DIR)
	@sudo mkdir -p $(BIN_DIR)
	@printf '#!/bin/sh\nexec node "$(INSTALL_DIR)/src/index.js" "$$@"\n' | sudo tee $(BIN_DIR)/hyprminimizer > /dev/null
	@sudo chmod +x $(BIN_DIR)/hyprminimizer
	@echo "✓ Installed: $(BIN_DIR)/hyprminimizer"
	@echo "✓ You can now use: hyprminimizer"

install-global: install

install-deps:
	@echo "Installing npm dependencies..."
	@npm install

uninstall:
	@echo "Uninstalling hyprminimizer..."
	@sudo rm -rf $(INSTALL_DIR)
	@sudo rm -f $(BIN_DIR)/hyprminimizer
	@echo "✓ Uninstalled"

dev: install-deps
	@echo "Running in watch mode..."
	@npm run dev

test:
	@echo "Running tests..."
	@node src/index.js --help > /dev/null 2>&1 && echo "✓ CLI works"
	@node src/index.js --help 2>&1 | grep -q hyprminimizer && echo "✓ Binary name correct"

lint:
	@echo "No linter configured (skipping)"

clean:
	@echo "Cleaning local dependencies..."
	@rm -rf node_modules
	@rm -rf .npm
	@echo "✓ Cleaned"

.DEFAULT_GOAL := help
