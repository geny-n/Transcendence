#!/bin/bash

# Script pour corriger automatiquement tous les imports TypeScript

echo "🔧 Correction des imports en cours..."

# Trouver tous les fichiers .ts
find src -name "*.ts" -type f | while read file; do
    echo "Traitement: $file"
    
    # Ajouter .js aux imports relatifs (../ ou ./)
    sed -i "s|from '\(\.\.*/[^']*\)'|from '\1.js'|g" "$file"
    sed -i 's|from "\(\.\.*/[^"]*\)"|from "\1.js"|g' "$file"
    
    # Corriger les doubles .js.js (au cas où)
    sed -i "s|\.js\.js|.js|g" "$file"
done

echo "✅ Tous les imports ont été corrigés!"
echo "Vérification des fichiers modifiés..."
grep -rn "from ['\"]\.\.*/[^'\"]*['\"]" src/ --include="*.ts" | head -10
