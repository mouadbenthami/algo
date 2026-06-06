from lexer import TokenType, Token, remove_accents

class ASTNode:
    pass

class Program(ASTNode):
    def __init__(self, name, constants, declarations, statements):
        self.name = name
        self.constants = constants
        self.declarations = declarations
        self.statements = statements

class ConstDecl(ASTNode):
    def __init__(self, name_token, value_token):
        self.name_token = name_token
        self.value_token = value_token

class VarDecl(ASTNode):
    def __init__(self, name_token, type_token, is_array=False, array_size=None):
        self.name_token = name_token
        self.type_token = type_token
        self.is_array = is_array
        self.array_size = array_size

class Expr(ASTNode):
    pass

class Binary(Expr):
    def __init__(self, left, op, right):
        self.left = left
        self.op = op
        self.right = right

class Unary(Expr):
    def __init__(self, op, right):
        self.op = op
        self.right = right

class Literal(Expr):
    def __init__(self, value, typehint=None):
        self.value = value
        self.typehint = typehint

class Variable(Expr):
    def __init__(self, name_token):
        self.name_token = name_token

class ArrayAccess(Expr):
    def __init__(self, name_token, index_expr):
        self.name_token = name_token
        self.index_expr = index_expr

class Stmt(ASTNode):
    pass

class Assign(Stmt):
    def __init__(self, line, name_token, index_expr, value):
        self.line = line
        self.name_token = name_token
        self.index_expr = index_expr
        self.value = value

class Print(Stmt):
    def __init__(self, line, expressions):
        self.line = line
        self.expressions = expressions

class Read(Stmt):
    def __init__(self, line, name_token, index_expr=None):
        self.line = line
        self.name_token = name_token
        self.index_expr = index_expr

class If(Stmt):
    def __init__(self, line, condition, then_branch, else_branch):
        self.line = line
        self.condition = condition
        self.then_branch = then_branch
        self.else_branch = else_branch

class While(Stmt):
    def __init__(self, line, condition, body):
        self.line = line
        self.condition = condition
        self.body = body

class For(Stmt):
    def __init__(self, line, var_token, start_expr, end_expr, body):
        self.line = line
        self.var_token = var_token
        self.start_expr = start_expr
        self.end_expr = end_expr
        self.body = body

class ParserError(Exception):
    def __init__(self, token, message):
        self.token = token
        self.message = message
        line = token.line
        source = token.source_line
        super().__init__(f"[Ligne {line}] Erreur syntaxique : {message} | Code : {source.strip()}")

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.current = 0

    def parse(self):
        return self.program()

    def peek(self):
        return self.tokens[self.current]

    def previous(self):
        return self.tokens[self.current - 1]

    def is_at_end(self):
        return self.peek().type == TokenType.EOF

    def check(self, type_):
        if self.is_at_end(): return False
        return self.peek().type == type_

    def advance(self):
        if not self.is_at_end():
            self.current += 1
        return self.previous()

    def match(self, *types):
        for type_ in types:
            if self.check(type_):
                self.advance()
                return True
        return False

    def consume(self, type_, message):
        print(type_)
        if self.check(type_):
            return self.advance()
        raise ParserError(self.peek(), message)

    def consume_identifier_keyword(self, expected_lexeme, message):
        token = self.peek()
        if token.type == TokenType.IDENTIFIER and remove_accents(token.lexeme).upper() == expected_lexeme.upper():
            return self.advance()
        raise ParserError(token, message)

    def const_decl(self):
        name_token = self.consume(TokenType.IDENTIFIER, "Nom de constante attendu.")
        self.consume(TokenType.EQUAL, "'=' attendu après le nom de la constante.")
        if self.match(TokenType.BOOLEEN, TokenType.NUMBER_INT, TokenType.NUMBER_REAL, TokenType.STRING):
            value_token = self.previous()
            return ConstDecl(name_token, value_token)
        raise ParserError(self.peek(), "Valeur de constante attendue (Entier, Réel, Chaîne, Booléen).")

    def program(self):
        self.consume(TokenType.ALGORITHME, "Mot-clé 'Algorithme' attendu au début.")
        name_token = self.consume(TokenType.IDENTIFIER, "Nom de l'algorithme attendu.")
        
        constants = []
        if self.match(TokenType.CONSTANTES):
            while not self.check(TokenType.VARIABLES) and not self.check(TokenType.DEBUT) and not self.is_at_end():
                constants.append(self.const_decl())

        declarations = []
        if self.match(TokenType.VARIABLES):
            while not self.check(TokenType.DEBUT) and not self.is_at_end():
                declarations.extend(self.var_decl())
                
        self.consume(TokenType.DEBUT, "Mot-clé 'Début' attendu.")
        
        statements = []
        while not self.check(TokenType.FIN) and not self.is_at_end():
            statements.append(self.statement())
            
        self.consume(TokenType.FIN, "Mot-clé 'Fin' attendu à la fin de l'algorithme.")
        
        return Program(name_token.lexeme, constants, declarations, statements)

    def var_decl(self):
        decls = []
        if self.match(TokenType.TABLEAU):
            name_token = self.consume(TokenType.IDENTIFIER, "Nom du tableau attendu.")
            self.consume(TokenType.LBRACKET, "'[' attendu après le nom du tableau.")
            size_token = self.consume(TokenType.NUMBER_INT, "Taille du tableau (entier) attendue.")
            self.consume(TokenType.RBRACKET, "']' attendu après la taille du tableau.")
            self.consume(TokenType.COLON, "':' attendu après la définition du tableau.")
            type_token = self.type_specifier()
            decls.append(VarDecl(name_token, type_token, is_array=True, array_size=size_token.literal))
        else:
            names = []
            names.append(self.consume(TokenType.IDENTIFIER, "Nom de variable attendu."))
            while self.match(TokenType.COMMA):
                names.append(self.consume(TokenType.IDENTIFIER, "Nom de variable attendu après ','."))
            self.consume(TokenType.COLON, "':' attendu après les noms de variables.")
            type_token = self.type_specifier()
            for name in names:
                decls.append(VarDecl(name, type_token))
        return decls

    def type_specifier(self):
        if self.match(TokenType.ENTIER, TokenType.REEL, TokenType.CHAINE, TokenType.CARACTERE, TokenType.BOOLEEN):
            return self.previous()
        raise ParserError(self.peek(), "Type attendu (Entier, Réel, Chaîne, Caractère, Booléen).")

    def statement(self):
        if self.match(TokenType.ECRIRE): return self.print_stmt()
        if self.match(TokenType.LIRE): return self.read_stmt()
        if self.match(TokenType.SI): return self.if_stmt()
        if self.match(TokenType.TANTQUE): return self.while_stmt()
        if self.match(TokenType.POUR): return self.for_stmt()
        
        if self.check(TokenType.IDENTIFIER):
            return self.assign_stmt()
            
        raise ParserError(self.peek(), "Instruction non reconnue.")

    def print_stmt(self):
        line = self.previous().line
        self.consume(TokenType.LPAREN, "'(' attendu après 'Ecrire'.")
        expressions = []
        if not self.check(TokenType.RPAREN):
            expressions.append(self.expression())
            while self.match(TokenType.COMMA):
                expressions.append(self.expression())
        self.consume(TokenType.RPAREN, "')' attendu à la fin de 'Ecrire'.")
        return Print(line, expressions)

    def read_stmt(self):
        line = self.previous().line
        self.consume(TokenType.LPAREN, "'(' attendu après 'Lire'.")
        name_token = self.consume(TokenType.IDENTIFIER, "Nom de variable attendu dans 'Lire'.")
        index_expr = None
        if self.match(TokenType.LBRACKET):
            index_expr = self.expression()
            self.consume(TokenType.RBRACKET, "']' attendu.")
        self.consume(TokenType.RPAREN, "')' attendu à la fin de 'Lire'.")
        return Read(line, name_token, index_expr)

    def assign_stmt(self):
        name_token = self.advance() # we checked it's IDENTIFIER
        line = name_token.line
        index_expr = None
        if self.match(TokenType.LBRACKET):
            index_expr = self.expression()
            self.consume(TokenType.RBRACKET, "']' attendu.")
            
        if not self.match(TokenType.ASSIGN, TokenType.EQUAL):
            raise ParserError(self.peek(), "Opérateur d'affectation '<-' ou '=' attendu.")
            
        value = self.expression()
        return Assign(line, name_token, index_expr, value)

    def if_stmt(self):
        line = self.previous().line
        condition = self.expression()
        self.consume(TokenType.ALORS, "Mot-clé 'Alors' attendu après la condition du 'Si'.")
        
        then_branch = []
        while not self.check(TokenType.SINON) and not self.check(TokenType.FINSI) and not self.is_at_end():
            then_branch.append(self.statement())
            
        else_branch = []
        if self.match(TokenType.SINON):
            while not self.check(TokenType.FINSI) and not self.is_at_end():
                else_branch.append(self.statement())
                
        self.consume(TokenType.FINSI, "Mot-clé 'FinSi' manquant pour le 'Si'.")
        return If(line, condition, then_branch, else_branch)

    def while_stmt(self):
        line = self.previous().line
        condition = self.expression()
        self.consume(TokenType.FAIRE, "Mot-clé 'Faire' attendu après la condition du 'TantQue'.")
        
        body = []
        while not self.check(TokenType.FINTANTQUE) and not self.is_at_end():
            body.append(self.statement())
            
        self.consume(TokenType.FINTANTQUE, "Mot-clé 'FinTantQue' manquant pour le 'TantQue'.")
        return While(line, condition, body)

    def for_stmt(self):
        line = self.previous().line
        var_token = self.consume(TokenType.IDENTIFIER, "Nom de variable attendu après 'Pour'.")
        self.consume(TokenType.ALLANT, "'Allant' attendu.")
        self.consume_identifier_keyword("DE", "'de' attendu.")
        start_expr = self.expression()
        self.consume_identifier_keyword("A", "'à' attendu.")
        end_expr = self.expression()
        self.consume(TokenType.FAIRE, "'Faire' attendu.")
        
        body = []
        while not self.check(TokenType.FINPOUR) and not self.is_at_end():
            body.append(self.statement())
            
        self.consume(TokenType.FINPOUR, "Mot-clé 'FinPour' manquant pour le 'Pour'.")
        return For(line, var_token, start_expr, end_expr, body)

    def expression(self):
        return self.logic_or()

    def logic_or(self):
        expr = self.logic_and()
        while self.match(TokenType.OU):
            op = self.previous()
            right = self.logic_and()
            expr = Binary(expr, op, right)
        return expr

    def logic_and(self):
        expr = self.equality()
        while self.match(TokenType.ET):
            op = self.previous()
            right = self.equality()
            expr = Binary(expr, op, right)
        return expr

    def equality(self):
        expr = self.comparison()
        while self.match(TokenType.NEQ, TokenType.EQUAL):
            op = self.previous()
            right = self.comparison()
            expr = Binary(expr, op, right)
        return expr

    def comparison(self):
        expr = self.term()
        while self.match(TokenType.GT, TokenType.GTE, TokenType.LT, TokenType.LTE):
            op = self.previous()
            right = self.term()
            expr = Binary(expr, op, right)
        return expr

    def term(self):
        expr = self.factor()
        while self.match(TokenType.MINUS, TokenType.PLUS):
            op = self.previous()
            right = self.factor()
            expr = Binary(expr, op, right)
        return expr

    def factor(self):
        expr = self.unary()
        while self.match(TokenType.SLASH, TokenType.STAR):
            op = self.previous()
            right = self.unary()
            expr = Binary(expr, op, right)
        return expr

    def unary(self):
        if self.match(TokenType.NON, TokenType.MINUS, TokenType.PLUS):
            op = self.previous()
            right = self.unary()
            return Unary(op, right)
        return self.primary()

    def primary(self):
        if self.match(TokenType.BOOLEEN):
            return Literal(self.previous().literal, TokenType.BOOLEEN)
        if self.match(TokenType.NUMBER_INT):
            return Literal(self.previous().literal, TokenType.ENTIER)
        if self.match(TokenType.NUMBER_REAL):
            return Literal(self.previous().literal, TokenType.REEL)
        if self.match(TokenType.STRING):
            return Literal(self.previous().literal, TokenType.CHAINE)
        
        if self.match(TokenType.LPAREN):
            expr = self.expression()
            self.consume(TokenType.RPAREN, "')' attendu après l'expression.")
            return expr
            
        if self.match(TokenType.IDENTIFIER):
            name_token = self.previous()
            if self.match(TokenType.LBRACKET):
                index_expr = self.expression()
                self.consume(TokenType.RBRACKET, "']' attendu.")
                return ArrayAccess(name_token, index_expr)
            return Variable(name_token)
            
        raise ParserError(self.peek(), "Expression attendue.")
