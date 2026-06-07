import sys
sys.path.insert(0, '.')
from lexer import Lexer
from parser import Parser
from interpreter import Interpreter

def test(code, label):
    print(f"\n===== {label} =====")
    try:
        lexer = Lexer(code)
        tokens = lexer.scan_tokens()
        parser = Parser(tokens)
        program = parser.parse()
        interp = Interpreter()
        result = interp.interpret(program)
        for i, snap in enumerate(result['snapshots']):
            line = snap.get('ligne_actuelle', '?')
            action = snap.get('action', '')
            cond = ' [cond]' if snap.get('condition') else ''
            branch = f' branch={snap.get("branch")}' if snap.get('branch') else ''
            viz = f' viz={snap.get("viz_type")}[{snap.get("viz_step",0)}/{snap.get("viz_total",0)}]' if snap.get('viz_type') else ''
            ba = f' ba={snap.get("block_active")}' if snap.get('block_active') else ''
            ls = ' [logical]' if snap.get('logical_steps') else ''
            final = ' FINAL' if snap.get('viz_final') else ''
            print(f'  {i}: L{line} | {action}{cond}{branch}{viz}{ba}{ls}{final}')
        if result['erreurs']:
            print(f"  ERROR: {result['erreurs']}")
    except Exception as e:
        print(f"  ERROR: {e}")

# Test 1: Arithmetic
test("""Algorithme Arith
Variables
    x : Entier
Debut
    x <- 10 + 5 * 3;
Fin
""", "Arithmetic multi-step")

# Test 2: Si condition (animation phases)
test("""Algorithme TestSi
Variables
    x : Entier
Debut
    x <- 10;
    Si x > 5 Alors
        x <- x * 2;
    Sinon
        x <- 0;
    FinSi
    Ecrire(x);
Fin
""", "Si animation phases")

# Test 3: Logical condition
test("""Algorithme TestLog
Variables
    a, b, r : Booleen
Debut
    a <- Vrai;
    b <- Faux;
    r <- a ET b;
    Si a OU b Alors
        Ecrire("au moins un vrai");
    FinSi
Fin
""", "Logical ET/OU + Si")

# Test 4: Nested Si
test("""Algorithme Nested
Variables
    x : Entier
Debut
    x <- 7;
    Si x > 0 Alors
        Si x > 5 Alors
            x <- 1;
        Sinon
            x <- 2;
        FinSi
    FinSi
Fin
""", "Nested Si blocks")

# Test 5: Cas
test("""Algorithme TestCas
Variables
    x : Entier
Debut
    x <- 2;
    Cas (x) Vaut
        1: x <- 10;
        2: x <- 20;
        3: x <- 30;
        Autre: x <- 0;
    FinCas
Fin
""", "Cas selector")

# Test 6: Simple assignment (no steps)
test("""Algorithme Simple
Variables
    x : Entier
Debut
    x <- 42;
Fin
""", "Simple assignment (no viz steps)")

# Test 7: While loop
test("""Algorithme Loop
Variables
    i : Entier
Debut
    i <- 0;
    TantQue i < 3 Faire
        i <- i + 1;
    FinTantQue
Fin
""", "While loop with arithmetic")
