.PHONY: help serve stop install

# Variables
PORT ?= 9000
HOST ?= localhost
PYTHON := $(shell which python3 2>/dev/null || which python 2>/dev/null)
NODE := $(shell which node 2>/dev/null)

help:
	@echo "🚗 Makefile para ¡Salta el Coche! 🚗"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make serve    - Inicia el servidor web (puerto $(PORT))"
	@echo "  make stop     - Detiene el servidor"
	@echo "  make install  - Verifica dependencias"
	@echo "  make help     - Muestra esta ayuda"
	@echo ""
	@echo "Variables:"
	@echo "  PORT=$(PORT)  - Puerto del servidor (ej: make serve PORT=3000)"
	@echo "  HOST=$(HOST)  - Host del servidor (ej: make serve HOST=0.0.0.0)"

serve:
	@echo "🚀 Iniciando servidor web..."
	@if [ -n "$(PYTHON)" ]; then \
		echo "✅ Usando Python: $(PYTHON)"; \
		echo "📡 Servidor disponible en: http://$(HOST):$(PORT)"; \
		echo "⏹️  Presiona Ctrl+C para detener el servidor"; \
		echo ""; \
		$(PYTHON) -m http.server $(PORT) --bind $(HOST); \
	elif [ -n "$(NODE)" ]; then \
		echo "✅ Usando Node.js: $(NODE)"; \
		echo "📡 Servidor disponible en: http://$(HOST):$(PORT)"; \
		echo "⏹️  Presiona Ctrl+C para detener el servidor"; \
		echo ""; \
		npx -y http-server -p $(PORT) -a $(HOST); \
	else \
		echo "❌ Error: No se encontró Python ni Node.js instalado"; \
		echo "   Por favor instala Python 3 o Node.js"; \
		exit 1; \
	fi

stop:
	@echo "🛑 Deteniendo servidor..."
	@if [ -n "$$(lsof -ti:$(PORT))" ]; then \
		kill -9 $$(lsof -ti:$(PORT)); \
		echo "✅ Servidor detenido"; \
	else \
		echo "ℹ️  No hay servidor ejecutándose en el puerto $(PORT)"; \
	fi

install:
	@echo "🔍 Verificando dependencias..."
	@if [ -n "$(PYTHON)" ]; then \
		echo "✅ Python encontrado: $(PYTHON)"; \
		$(PYTHON) --version; \
	else \
		echo "❌ Python no encontrado"; \
	fi
	@if [ -n "$(NODE)" ]; then \
		echo "✅ Node.js encontrado: $(NODE)"; \
		$(NODE) --version; \
	else \
		echo "⚠️  Node.js no encontrado (opcional)"; \
	fi
	@echo ""
	@echo "✅ El juego está listo para ejecutarse"
	@echo "   Ejecuta 'make serve' para iniciar el servidor"

# Comando por defecto
.DEFAULT_GOAL := help
