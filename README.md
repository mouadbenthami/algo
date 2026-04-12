# Interpréteur Algorithmique Marocain

Un interpréteur pédagogique en Python conçu pour évaluer et exécuter du pseudo-code algorithmique en français, basé sur le programme enseigné dans les lycées marocains.

## Spécifications de la syntaxe supportée

L'interpréteur est **insensible à la casse** et ignore les **accents** sur les mots-clés pour faciliter la saisie sur les smartphones.

### 1. Structure d'un algorithme
```
Algorithme NomDuProgramme
Variables
    a, b : Entier
Début
    // Instructions...
Fin
```

### 2. Types de données
- `Entier` : nombres entiers (ex. `10`)
- `Réel` : nombres à virgule (ex. `3.14`)
- `Chaîne` : texte entre guillemets (ex. `"Bonjour"`)
- `Caractère` : lettre unique entre guillemets (ex. `"A"`)
- `Booléen` : valeurs de vérité (ex. `Vrai`, `Faux`)
- `Tableau` : structure à taille fixe (ex. `Tableau T[10] : Entier`)

### 3. Affectation
Les deux opérateurs `<-` et `=` sont supportés.
```
a <- 5
b = 10
T[0] <- 42
```

### 4. Entrées / Sorties
```
Ecrire("Texte à afficher : ", a)
Lire(b)
```

### 5. Structures Conditionnelles (Si)
```
Si a > b Alors
    Ecrire("a est plus grand")
Sinon
    Ecrire("b est plus grand")
FinSi
```

### 6. Boucles (TantQue et Pour)
```
TantQue a < 10 Faire
    a <- a + 1
FinTantQue

Pour i Allant De 1 A 5 Faire
    Ecrire(i)
FinPour
```

### 7. Opérateurs
- **Arithmétique** : `+`, `-`, `*`, `/`
  *(Note : la division `/` entre deux entiers effectue une division entière).*
- **Comparaison** : `>`, `<`, `>=`, `<=`, `=`, `<>`
- **Logique** : `ET`, `OU`, `NON`

---

## Instructions pour ajouter de nouveaux mots-clés

Pour enrichir l'interpréteur, par exemple en rajoutant de nouvelles fonctions ou structures :

1. **Dans `lexer.py` :**
   - Ajoutez le nouveau token à l'enum `TokenType`.
   - Liez le mot-clé en français dans le dictionnaire `KEYWORDS`.

2. **Dans `parser.py` :**
   - Ajoutez le nouveau nœud dans l'Arbre de Syntaxe Abstraite (`ASTNode`).
   - Ajoutez une nouvelle fonction ou mettez à jour `statement()`/`expression()` pour lier les tokens générés par le lexer à la règle de grammaire.

3. **Dans `interpreter.py` :**
   - Modifiez `execute()` ou `evaluate()` pour ajouter la logique d'exécution liée à la nouvelle expression ou instruction.

---

## Guide : Intégration dans un environnement Web (Smartphones)

Pour utiliser ce script dans un navigateur web afin que les élèves puissent pratiquer sans salle d'informatique, voici deux approches recommandées :

### 1. Approche "Backend" avec Flask / FastAPI (Python)
- Placez ces fichiers au cœur de votre API Python.
- Dans votre point d'entrée, parsez le code reçu par une requête `POST`.
- Remplacez les appels globaux `print()` et `input()` dans `interpreter.py` par des générateurs ou des collecteurs de chaînes.
- Retournez les éventuelles erreurs (de type `LexerError`, `ParserError` ou `InterpreterError`) sous format JSON pour les afficher proprement sur l'interface (avec la ligne et l'extrait).

### 2. Approche "Frontend" avec PyScript
- `PyScript` permet d'exécuter du code Python directement dans le navigateur (par-dessus WebAssembly).
- Vous pouvez importer les fichiers `.py` directement dans votre page HTML.
- **Entrées / Sorties** : Vous devrez lier les méthodes `Ecrire()` (pour modifier le DOM, ex. `document.getElementById('console').innerText += ...`) et `Lire()` (pour ouvrir un `prompt()` JS ou attendre une saisie dans un `<input>`).

## Mode "Trace" (Débogage visuel)

L'interpréteur intègre un mode "Trace" idéal pour la pédagogie :
En ajoutant `--trace` lors de l'exécution, vous afficherez l'état complet de la "mémoire" (valeurs des variables) à chaque ligne exécutée, ce qui permet à l'élève de comprendre le déroulement pas à pas !

```bash
python main.py mon_code.txt --trace
```
