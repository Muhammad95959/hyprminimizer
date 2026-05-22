.PHONY: help install install-global uninstall dev test clean lint

PREFIX ?= /usr/local
BIN_DIR = $(PREFIX)/bin
MAN_DIR = $(PREFIX)/share/man/man1

help:
	@echo "hyprminimizer - Makefile Commands"
	@echo ""
	@echo "  make install         Install globally to $(PREFIX)"
	@echo "  make install-global  Symlink for npm global install"
	@echo "  make uninstall       Remove global installation"
	@echo "  make dev             Run in watch/development mode"
	@echo "  make test            Run tests"
	@echo "  make lint            Lint code"
	@echo "  make clean           Clean dependencies"
	@echo "  make help            Show this help message"

install: install-deps
	@echo "Installing hyprminimizer..."
	@mkdir -p $(BIN_DIR)
	@cp src/index.js $(BIN_DIR)/hyprminimizer
	@chmod +x $(BIN_DIR)/hyprminimizer
	@echo "✓ Installed to $(BIN_DIR)/hyprminimizer"
	@echo "✓ You can now use: hyprminimizer"

install-global: install-deps
	@echo "Creating global npm link..."
	@npm link
	@echo "✓ Global link created"

install-deps:
	@echo "Installing npm dependencies..."
	@npm install

uninstall:
	@echo "Uninstalling..."
	@npm unlink
	@rm -f $(BIN_DIR)/hyprminimizer
	@echo "✓ Uninstalled"

dev: install-deps
	@echo "Running in watch mode..."
	@npm run dev

test:
	@echo "Running tests..."
	@node src/index.js --help > /dev/null 2>&1 && echo "✓ CLI works"

lint:
	@echo "No linter configured (skipping)"

clean:
	@echo "Cleaning..."
	@rm -rf node_modules
	@rm -rf .npm
	@echo "✓ Cleaned"

.DEFAULT_GOAL := help
