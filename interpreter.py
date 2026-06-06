from lexer import TokenType
from parser import (Program, VarDecl, Binary, Unary, Literal, Variable, 
                    ArrayAccess, Assign, Print, Read, If, While, For)

class InterpreterError(Exception):
    def __init__(self, token, message):
        self.token = token
        self.message = message
        line = token.line if token else "?"
        source = token.source_line if token else "?"
        super().__init__(f"[Ligne {line}] Erreur : {message} | Code : {source.strip()}")

class NeedsInputException(Exception):
    def __init__(self, line):
        self.line = line
        super().__init__("Attente d'entrée utilisateur")

class Environment:
    def __init__(self):
        self.values = {}
        self.types = {}
        self.is_array = {}
        self.is_constant = {}

    def define(self, name, type_token, is_array=False, array_size=None, is_constant=False):
        clean_name = name.upper()
        if clean_name in self.values:
            raise Exception(f"Variable ou constante '{name}' déjà déclarée.")
            
        self.types[clean_name] = type_token.type
        self.is_array[clean_name] = is_array
        self.is_constant[clean_name] = is_constant
        
        if is_array:
            self.values[clean_name] = [None] * array_size
        else:
            self.values[clean_name] = None

    def define_constant(self, name, value_token, value):
        clean_name = name.upper()
        if clean_name in self.values:
            raise Exception(f"Variable ou constante '{name}' déjà déclarée.")
            
        self.types[clean_name] = value_token.type
        self.is_array[clean_name] = False
        self.is_constant[clean_name] = True
        self.values[clean_name] = value

    def get(self, name_token):
        clean_name = name_token.lexeme.upper()
        if clean_name not in self.values:
            raise InterpreterError(name_token, f"La variable '{name_token.lexeme}' n'a pas été déclarée dans la section Variables.")
            
        val = self.values[clean_name]
        if val is None and not self.is_array[clean_name]:
             raise InterpreterError(name_token, f"La variable '{name_token.lexeme}' est utilisée avant d'avoir été initialisée.")
             
        return val

    def get_array_element(self, name_token, index):
        clean_name = name_token.lexeme.upper()
        if clean_name not in self.values:
            raise InterpreterError(name_token, f"Le tableau '{name_token.lexeme}' n'a pas été déclaré.")
        if not self.is_array[clean_name]:
            raise InterpreterError(name_token, f"'{name_token.lexeme}' n'est pas un tableau.")
            
        arr = self.values[clean_name]
        try:
            val = arr[index]
            if val is None:
                raise InterpreterError(name_token, f"L'élément à l'indice {index} du tableau '{name_token.lexeme}' n'est pas initialisé.")
            return val
        except IndexError:
            raise InterpreterError(name_token, f"Indice {index} hors des limites pour le tableau '{name_token.lexeme}'.")

    def assign(self, name_token, value):
        clean_name = name_token.lexeme.upper()
        if clean_name not in self.values:
            raise InterpreterError(name_token, f"La variable '{name_token.lexeme}' n'a pas été déclarée dans la section Variables.")
        
        if self.is_constant.get(clean_name, False):
            raise InterpreterError(name_token, f"Impossible de modifier la constante '{name_token.lexeme}'.")
            
        if self.is_array[clean_name]:
            raise InterpreterError(name_token, f"Vous devez spécifier un indice pour affecter une valeur au tableau '{name_token.lexeme}'.")
            
        expected_type = self.types[clean_name]
        self.check_type(name_token, expected_type, value)
        self.values[clean_name] = value

    def assign_array_element(self, name_token, index, value):
        clean_name = name_token.lexeme.upper()
        if clean_name not in self.values:
             raise InterpreterError(name_token, f"Le tableau '{name_token.lexeme}' n'a pas été déclaré.")
        if not self.is_array[clean_name]:
             raise InterpreterError(name_token, f"'{name_token.lexeme}' n'est pas un tableau.")
             
        expected_type = self.types[clean_name]
        self.check_type(name_token, expected_type, value)
        
        arr = self.values[clean_name]
        try:
            arr[index] = value
        except IndexError:
            raise InterpreterError(name_token, f"Indice {index} hors des limites pour le tableau '{name_token.lexeme}'.")

    def check_type(self, token, expected_type, value):
        TYPE_NAMES = {
            TokenType.ENTIER: "Entière",
            TokenType.REEL: "Réelle",
            TokenType.CHAINE: "Chaîne",
            TokenType.CARACTERE: "Caractère",
            TokenType.BOOLEEN: "Booléenne",
            TokenType.NUMBER_INT: "Entière",
            TokenType.NUMBER_REAL: "Réelle",
            TokenType.STRING: "Chaîne"
        }
        
        actual = type(value)
        expected_str = TYPE_NAMES.get(expected_type, str(expected_type))
        
        if expected_type in (TokenType.ENTIER, TokenType.NUMBER_INT):
            if actual is not int or isinstance(value, bool):
                raise InterpreterError(token, f"Erreur de type : Vous ne pouvez pas affecter ce type à une variable {expected_str}.")
        elif expected_type in (TokenType.REEL, TokenType.NUMBER_REAL):
            if (actual is not float and actual is not int) or isinstance(value, bool):
                 raise InterpreterError(token, f"Erreur de type : Vous ne pouvez pas affecter ce type à une variable {expected_str}.")
        elif expected_type in (TokenType.CHAINE, TokenType.STRING):
            if actual is not str:
                 raise InterpreterError(token, f"Erreur de type : Vous ne pouvez pas affecter ce type à une variable {expected_str}.")
        elif expected_type == TokenType.CARACTERE:
            if actual is not str or len(value) != 1:
                 raise InterpreterError(token, f"Erreur de type : Vous devez affecter exactement un caractère à une variable {expected_str}.")
        elif expected_type == TokenType.BOOLEEN:
            if actual is not bool:
                 raise InterpreterError(token, f"Erreur de type : Vous ne pouvez pas affecter ce type à une variable {expected_str}.")

class Interpreter:
    def __init__(self, trace_mode=False, inputs=None):
        self.env = Environment()
        self.trace_mode = trace_mode
        self.inputs = inputs if inputs is not None else []
        self.snapshots = []
        self.output = []

    def capture_snapshot(self, line, action):
        variables = {}
        tableaux = {}
        constantes = {}
        types = {}
        
        for name, value in self.env.values.items():
            # Get type string
            types[name] = self.env.types[name].name
            if self.env.is_array[name]:
                tableaux[name] = list(value) if value else []
            elif self.env.is_constant.get(name, False):
                constantes[name] = value
            else:
                variables[name] = value
                
        self.snapshots.append({
            "ligne_actuelle": line,
            "variables": variables,
            "tableaux": tableaux,
            "constantes": constantes,
            "types": types,
            "sortie": "\n".join(self.output),
            "action": action
        })

    def interpret(self, program: Program):
        try:
            for const_decl in program.constants:
                try:
                    self.env.define_constant(const_decl.name_token.lexeme, const_decl.value_token, const_decl.value_token.literal)
                except Exception as e:
                    raise InterpreterError(const_decl.name_token, str(e))

            for decl in program.declarations:
                try:
                    self.env.define(decl.name_token.lexeme, decl.type_token, decl.is_array, decl.array_size)
                except Exception as e:
                    raise InterpreterError(decl.name_token, str(e))
            
            if program.constants or program.declarations:
                first_line = program.constants[0].name_token.line if program.constants else program.declarations[0].name_token.line
                self.capture_snapshot(first_line, "Initialisation de la mémoire")
                    
            for stmt in program.statements:
                self.execute(stmt)
                
            self.capture_snapshot(None, "Fin de l'exécution")
            return {"status": "success", "snapshots": self.snapshots, "erreurs": None}
            
        except NeedsInputException as e:
            self.capture_snapshot(e.line, "Attente d'une saisie utilisateur...")
            return {"status": "needs_input", "snapshots": self.snapshots, "erreurs": None}
        except InterpreterError as e:
            self.capture_snapshot(e.token.line if e.token else None, f"Erreur : {e.message}")
            return {"status": "error", "snapshots": self.snapshots, "erreurs": str(e)}
        except Exception as e:
            self.capture_snapshot(None, f"Erreur inattendue : {e}")
            return {"status": "error", "snapshots": self.snapshots, "erreurs": f"Erreur inattendue : {e}"}

    def print_trace(self):
        # On garde cette méthode si besoin pour le mode CLI classique
        if not self.trace_mode: return
        print("\n--- TRACE : État de la Mémoire ---")
        for name, value in self.env.values.items():
            type_enum = self.env.types[name]
            is_arr = self.env.is_array[name]
            
            val_str = str(value)
            type_str = type_enum.name
            
            print(f"{name} ({type_str}{' []' if is_arr else ''}) = {val_str}")
        print("----------------------------------\n")

    def execute(self, stmt):
        if isinstance(stmt, Assign):
            value = self.evaluate(stmt.value)
            if stmt.index_expr:
                index = self.evaluate(stmt.index_expr)
                if type(index) is not int:
                    raise InterpreterError(stmt.name_token, "L'indice du tableau doit être un entier.")
                self.env.assign_array_element(stmt.name_token, index, value)
                self.capture_snapshot(stmt.line, f"Affectation de {value} à {stmt.name_token.lexeme}[{index}]")
            else:
                self.env.assign(stmt.name_token, value)
                self.capture_snapshot(stmt.line, f"Affectation de {value} à {stmt.name_token.lexeme}")
            self.print_trace()
            
        elif isinstance(stmt, Print):
            results = [str(self.evaluate(expr)) for expr in stmt.expressions]
            texte = " ".join(results)
            self.output.append(texte)
            self.capture_snapshot(stmt.line, f"Affichage : {texte}")
            self.print_trace()
            
        elif isinstance(stmt, Read):
            if not self.inputs:
                raise NeedsInputException(stmt.line)
            user_input = self.inputs.pop(0)
            
            target_type = self.env.types[stmt.name_token.lexeme.upper()]
            try:
                if target_type == TokenType.ENTIER:
                    value = int(user_input)
                elif target_type == TokenType.REEL:
                    value = float(user_input)
                elif target_type == TokenType.BOOLEEN:
                    value = user_input.upper() == "VRAI"
                else:
                    value = user_input
            except ValueError:
                raise InterpreterError(stmt.name_token, "La valeur saisie ne correspond pas au type de la variable.")
                
            if stmt.index_expr:
                index = self.evaluate(stmt.index_expr)
                if type(index) is not int:
                    raise InterpreterError(stmt.name_token, "L'indice du tableau doit être un entier.")
                self.env.assign_array_element(stmt.name_token, index, value)
                self.capture_snapshot(stmt.line, f"Lecture de {value} dans {stmt.name_token.lexeme}[{index}]")
            else:
                self.env.assign(stmt.name_token, value)
                self.capture_snapshot(stmt.line, f"Lecture de {value} dans {stmt.name_token.lexeme}")
            self.print_trace()
            
        elif isinstance(stmt, If):
            condition_val = self.evaluate(stmt.condition)
            if type(condition_val) is not bool:
                 raise InterpreterError(stmt.condition.left.name_token if hasattr(stmt.condition, 'left') and hasattr(stmt.condition.left, 'name_token') else None, "La condition du 'Si' doit être une expression Booléenne.")
                 
            self.capture_snapshot(stmt.line, f"Évaluation de la condition Si : {'Vraie' if condition_val else 'Fausse'}")
            
            if condition_val:
                for s in stmt.then_branch: self.execute(s)
            else:
                for s in stmt.else_branch: self.execute(s)
                
        elif isinstance(stmt, While):
            while True:
                condition_val = self.evaluate(stmt.condition)
                if type(condition_val) is not bool:
                    raise InterpreterError(None, "La condition du 'TantQue' doit être une expression Booléenne.")
                
                self.capture_snapshot(stmt.line, f"Évaluation TantQue : {'Vraie' if condition_val else 'Fausse (Fin de la boucle)'}")
                if not condition_val: break
                
                for s in stmt.body: self.execute(s)
                
        elif isinstance(stmt, For):
            start_val = self.evaluate(stmt.start_expr)
            if type(start_val) is not int:
                raise InterpreterError(stmt.var_token, "La borne de début de la boucle 'Pour' doit être un Entier.")
                
            self.env.assign(stmt.var_token, start_val)
            self.print_trace()
            self.capture_snapshot(stmt.line, f"Boucle Pour : initialisation de {stmt.var_token.lexeme} à {start_val}")
            
            while True:
                current_val = self.env.get(stmt.var_token)
                end_val = self.evaluate(stmt.end_expr)
                if type(end_val) is not int:
                    raise InterpreterError(stmt.var_token, "La borne de fin de la boucle 'Pour' doit être un Entier.")
                    
                if current_val > end_val:
                    self.capture_snapshot(stmt.line, f"Boucle Pour : fin (dépassé la borne {end_val})")
                    break
                else:
                    self.capture_snapshot(stmt.line, f"Boucle Pour : itération pour {stmt.var_token.lexeme} = {current_val}")
                    
                for s in stmt.body: self.execute(s)
                
                # Increment
                new_val = self.env.get(stmt.var_token) + 1
                self.env.assign(stmt.var_token, new_val)
                self.print_trace()

    def evaluate(self, expr):
        if isinstance(expr, Literal):
            return expr.value
            
        if isinstance(expr, Variable):
            return self.env.get(expr.name_token)
            
        if isinstance(expr, ArrayAccess):
            index = self.evaluate(expr.index_expr)
            if type(index) is not int:
                raise InterpreterError(expr.name_token, "L'indice du tableau doit être un Entier.")
            return self.env.get_array_element(expr.name_token, index)
            
        if isinstance(expr, Unary):
            right = self.evaluate(expr.right)
            if expr.op.type == TokenType.MINUS:
                if type(right) not in [int, float]:
                    raise InterpreterError(expr.op, "L'opérateur '-' nécessite un nombre.")
                return -right
            if expr.op.type == TokenType.NON:
                if type(right) is not bool:
                    raise InterpreterError(expr.op, "L'opérateur 'NON' nécessite un Booléen.")
                return not right
            if expr.op.type == TokenType.PLUS:
                if type(right) not in [int, float]:
                    raise InterpreterError(expr.op, "L'opérateur '+' nécessite un nombre.")
                return right
                
        if isinstance(expr, Binary):
            left = self.evaluate(expr.left)
            right = self.evaluate(expr.right)
            
            op_type = expr.op.type
            
            if op_type in (TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.GT, TokenType.GTE, TokenType.LT, TokenType.LTE):
                 if type(left) not in [int, float] or type(right) not in [int, float]:
                     # Wait, PLUS could be string concatenation
                     if op_type == TokenType.PLUS and isinstance(left, str) and isinstance(right, str):
                         return left + right
                     raise InterpreterError(expr.op, f"Opérandes invalides pour l'opérateur '{expr.op.lexeme}'.")
                     
            if op_type == TokenType.PLUS: return left + right
            if op_type == TokenType.MINUS: return left - right
            if op_type == TokenType.STAR: return left * right
            if op_type == TokenType.SLASH:
                if right == 0:
                    raise InterpreterError(expr.op, "Division par zéro.")
                # Truncate if both are ints
                if type(left) is int and type(right) is int:
                    return left // right
                return left / right
                
            if op_type == TokenType.GT: return left > right
            if op_type == TokenType.GTE: return left >= right
            if op_type == TokenType.LT: return left < right
            if op_type == TokenType.LTE: return left <= right
            
            if op_type == TokenType.EQUAL: return left == right
            if op_type == TokenType.NEQ: return left != right
            
            if op_type == TokenType.ET:
                 if type(left) is not bool or type(right) is not bool:
                      raise InterpreterError(expr.op, "L'opérateur 'ET' nécessite des Booléens.")
                 return left and right
                 
            if op_type == TokenType.OU:
                 if type(left) is not bool or type(right) is not bool:
                      raise InterpreterError(expr.op, "L'opérateur 'OU' nécessite des Booléens.")
                 return left or right

        return None
