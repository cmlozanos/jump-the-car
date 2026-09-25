.PHONY: help serve stop install build check test physics-check

build:
	node tools/build-offline.cjs

check:
	node tools/check.cjs

test:
	node tools/browser-check.cjs

physics-check:
	node tools/physics-check.cjs

# Variables
PORT ?= 9000
HOST ?= localhost
PYTHON := $(shell which python3 2>/dev/null || which python 2>/dev/null)
NODE := $(shell which node 2>/dev/null)

help:
	@echo "🚗 Makefile para Jump the Car 🚗"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make serve    - Inicia el servidor web (puerto $(PORT))"
	@echo "  make stop     - Detiene el servidor"
	@echo "  make install  - Verifica dependencias"
	@echo "  make help     - Muestra esta ayuda"
	@echo "  make build    - Regenera lista offline versionada"
	@echo "  make check    - Sintaxis, assets y física 10–60 FPS"
	@echo "  make test     - Pruebas reales en navegador (CHROME95_PATH opcional)"
	@echo "  make physics-check - Comparación de ticks, obstáculos y pausas"
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
