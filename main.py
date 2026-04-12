import sys
from lexer import Lexer, LexerError
from parser import Parser, ParserError
from interpreter import Interpreter, InterpreterError

def run(source: str, trace_mode: bool = False):
    print("--- Début de l'exécution ---")
    
    # 1. Analyse Lexicale
    try:
        lexer = Lexer(source)
        tokens = lexer.scan_tokens()
    except LexerError as e:
        print(e)
        return

    # 2. Analyse Syntaxique
    parser = Parser(tokens)
    program = parser.parse()
    
    if program is None:
        # L'erreur a déjà été affichée par le parser
        return

    # 3. Exécution
    interpreter = Interpreter(trace_mode=trace_mode)
    interpreter.interpret(program)

    print("--- Fin de l'exécution ---")

if __name__ == "__main__":
    # Test par défaut avec un code conforme aux spécifications :
    # Algorithme utilisant Tableau, boucle Pour et condition Si
    
    CODE_EXEMPLE = """Algorithme TestComplet
Variables
    T[5] : Entier
    i, max : Entier
Début
    Ecrire("Initialisation du tableau avec quelques valeurs...")
    Pour i Allant de 0 A 4 Faire
        T[i] <- i * 10
    FinPour

    T[2] <- 85
    T[4] <- 12

    max <- 0
    Ecrire("Recherche du maximum...")
    Pour i Allant de 0 A 4 Faire
        Si T[i] > max Alors
            max <- T[i]
        FinSi
    FinPour

    Ecrire("Le maximum est :", max)
Fin
"""

    if len(sys.argv) > 1:
        mon_fichier = sys.argv[1]
        
        trace = False
        if len(sys.argv) > 2 and sys.argv[2] == "--trace":
            trace = True
            
        with open(mon_fichier, 'r', encoding='utf-8') as f:
            source_code = f.read()
        run(source_code, trace_mode=trace)
    else:
        print("Aucun fichier passé, exécution du code d'exemple intégré.")
        print("Pour utiliser le mode 'Trace', lancez : python main.py [fichier.txt] --trace\n")
        
        print("Code source évalué :")
        print(CODE_EXEMPLE)
        print("-------------")
        
        # Par défaut, passons le mode trace à False. 
        # Vous pouvez le passer à True ci-dessous pour voir l'état des variables.
        run(CODE_EXEMPLE, trace_mode=True)
