#!/bin/bash

# Script pour copier le fichier .env du répertoire racine vers le répertoire backend
# Cela permet de maintenir un seul fichier .env à la racine du projet
# tout en assurant que les variables d'environnement sont disponibles pour le backend

# Assurez-vous que le fichier .env existe
if [ ! -f .env ]; then
  echo "Erreur: Le fichier .env n'existe pas à la racine du projet."
  exit 1
fi

# Copier le fichier .env vers le répertoire backend
echo "Copie du fichier .env vers le répertoire backend..."
cp .env backend/.env

echo "Configuration terminée. Les variables d'environnement sont prêtes à être utilisées."
