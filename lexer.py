import enum
import unicodedata

class TokenType(enum.Enum):
    # Single-character tokens
    PLUS = "PLUS"
    MINUS = "MINUS"
    STAR = "STAR"
    SLASH = "SLASH"
    LPAREN = "LPAREN"
    RPAREN = "RPAREN"
    LBRACKET = "LBRACKET"
    RBRACKET = "RBRACKET"
    COMMA = "COMMA"
    COLON = "COLON"

    # One or two character tokens
    ASSIGN = "ASSIGN" # <-
    EQUAL = "EQUAL" # =
    NEQ = "NEQ" # <>
    LT = "LT" # <
    LTE = "LTE" # <=
    GT = "GT" # >
    GTE = "GTE" # >=

    # Literals
    IDENTIFIER = "IDENTIFIER"
    STRING = "STRING"
    NUMBER_INT = "NUMBER_INT"
    NUMBER_REAL = "NUMBER_REAL"

    # Keywords
    ALGORITHME = "ALGORITHME"
    CONSTANTES = "CONSTANTES"
    VARIABLES = "VARIABLES"
    DEBUT = "DEBUT"
    FIN = "FIN"
    ENTIER = "ENTIER"
    REEL = "REEL"
    CHAINE = "CHAINE"
    CARACTERE = "CARACTERE"
    BOOLEEN = "BOOLEEN"
    TABLEAU = "TABLEAU"
    SI = "SI"
    ALORS = "ALORS"
    SINON = "SINON"
    FINSI = "FINSI"
    TANTQUE = "TANTQUE"
    FAIRE = "FAIRE"
    FINTANTQUE = "FINTANTQUE"
    POUR = "POUR"
    ALLANT = "ALLANT"
    FINPOUR = "FINPOUR"
    LIRE = "LIRE"
    ECRIRE = "ECRIRE"
    ET = "ET"
    OU = "OU"
    NON = "NON"

    # Cas (switch) keywords
    CAS = "CAS"
    VAUT = "VAUT"
    AUTRE = "AUTRE"
    FINCAS = "FINCAS"

    SEMICOLON = "SEMICOLON"

    EOF = "EOF"

KEYWORDS = {
    "ALGORITHME": TokenType.ALGORITHME,
    "CONSTANTES": TokenType.CONSTANTES,
    "VARIABLES": TokenType.VARIABLES,
    "DEBUT": TokenType.DEBUT,
    "FIN": TokenType.FIN,
    "ENTIER": TokenType.ENTIER,
    "REEL": TokenType.REEL,
    "CHAINE": TokenType.CHAINE,
    "CARACTERE": TokenType.CARACTERE,
    "BOOLEEN": TokenType.BOOLEEN,
    "TABLEAU": TokenType.TABLEAU,
    "SI": TokenType.SI,
    "ALORS": TokenType.ALORS,
    "SINON": TokenType.SINON,
    "FINSI": TokenType.FINSI,
    "TANTQUE": TokenType.TANTQUE,
    "FAIRE": TokenType.FAIRE,
    "FINTANTQUE": TokenType.FINTANTQUE,
    "POUR": TokenType.POUR,
    "ALLANT": TokenType.ALLANT,
    "FINPOUR": TokenType.FINPOUR,
    "LIRE": TokenType.LIRE,
    "ECRIRE": TokenType.ECRIRE,
    "ET": TokenType.ET,
    "OU": TokenType.OU,
    "NON": TokenType.NON,
    "VRAI": TokenType.BOOLEEN,
    "FAUX": TokenType.BOOLEEN,
    "CAS": TokenType.CAS,
    "VAUT": TokenType.VAUT,
    "AUTRE": TokenType.AUTRE,
    "FINCAS": TokenType.FINCAS
}

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

class Token:
    def __init__(self, type_: TokenType, lexeme: str, literal: any, line: int, source_line: str):
        self.type = type_
        self.lexeme = lexeme
        self.literal = literal
        self.line = line
        self.source_line = source_line

    def __repr__(self):
        return f"Token({self.type.name}, {self.lexeme}, {self.literal})"

class LexerError(Exception):
    def __init__(self, line, message, source_line):
        self.line = line
        self.message = message
        self.source_line = source_line
        super().__init__(f"[Ligne {line}] Erreur : {message} | Code : {source_line.strip()}")

class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.tokens = []
        self.start = 0
        self.current = 0
        self.line = 1
        
        self.source_lines = source.splitlines()

    def get_source_line(self):
        idx = self.line - 1
        if idx < len(self.source_lines):
            return self.source_lines[idx]
        return ""

    def scan_tokens(self) -> list[Token]:
        while not self.is_at_end():
            self.start = self.current
            self.scan_token()
            
        self.tokens.append(Token(TokenType.EOF, "", None, self.line, self.get_source_line()))
        return self.tokens

    def is_at_end(self):
        return self.current >= len(self.source)

    def advance(self):
        char = self.source[self.current]
        self.current += 1
        return char

    def match(self, expected):
        if self.is_at_end(): return False
        if self.source[self.current] != expected: return False
        self.current += 1
        return True

    def peek(self):
        if self.is_at_end(): return '\0'
        return self.source[self.current]

    def peek_next(self):
        if self.current + 1 >= len(self.source): return '\0'
        return self.source[self.current + 1]

    def add_token(self, type_, literal=None):
        text = self.source[self.start:self.current]
        self.tokens.append(Token(type_, text, literal, self.line, self.get_source_line()))

    def scan_token(self):
        c = self.advance()
        
        if c == '(': self.add_token(TokenType.LPAREN)
        elif c == ')': self.add_token(TokenType.RPAREN)
        elif c == '[': self.add_token(TokenType.LBRACKET)
        elif c == ']': self.add_token(TokenType.RBRACKET)
        elif c == ',': self.add_token(TokenType.COMMA)
        elif c == ':': self.add_token(TokenType.COLON)
        elif c == ';': self.add_token(TokenType.SEMICOLON)
        elif c == '-':
            self.add_token(TokenType.MINUS)
        elif c == '+': self.add_token(TokenType.PLUS)
        elif c == '*': self.add_token(TokenType.STAR)
        elif c == '/': self.add_token(TokenType.SLASH)
        elif c == '=': 
            self.add_token(TokenType.EQUAL)
        elif c == '<':
            if self.match('>'): self.add_token(TokenType.NEQ)
            elif self.match('='): self.add_token(TokenType.LTE)
            elif self.match('-'): self.add_token(TokenType.ASSIGN)
            else: self.add_token(TokenType.LT)
        elif c == '>':
            if self.match('='): self.add_token(TokenType.GTE)
            else: self.add_token(TokenType.GT)
        elif c in [' ', '\r', '\t']:
            pass
        elif c == '\n':
            self.line += 1
        elif c == '"' or c == "'":
            self.string(c)
        else:
            if c.isdigit():
                self.number()
            elif c.isalpha() or c == '_':
                self.identifier()
            else:
                raise LexerError(self.line, f"Caractère inattendu '{c}'.", self.get_source_line())

    def string(self, quote_char):
        while self.peek() != quote_char and not self.is_at_end():
            if self.peek() == '\n':
                self.line += 1
            self.advance()

        if self.is_at_end():
            raise LexerError(self.line, "Chaîne de caractères non terminée.", self.get_source_line())

        self.advance() # The closing quote
        
        # Trim the surrounding quotes
        value = self.source[self.start + 1:self.current - 1]
        self.add_token(TokenType.STRING, value)

    def number(self):
        is_real = False
        while self.peek().isdigit():
            self.advance()

        if self.peek() == '.' and self.peek_next().isdigit():
            is_real = True
            self.advance() # Consume the "."
            while self.peek().isdigit():
                self.advance()

        if is_real:
            self.add_token(TokenType.NUMBER_REAL, float(self.source[self.start:self.current]))
        else:
            self.add_token(TokenType.NUMBER_INT, int(self.source[self.start:self.current]))

    def identifier(self):
        while self.peek().isalnum() or self.peek() == '_':
            self.advance()

        text = self.source[self.start:self.current]
        
        # Treatment of identifier: remove accents and uppercase for keyword matching
        clean_text = remove_accents(text).upper()
        
        type_ = KEYWORDS.get(clean_text, TokenType.IDENTIFIER)
        
        # For Booleans, we map VRAI / FAUX back to actual bool values
        if type_ == TokenType.BOOLEEN and clean_text in ["VRAI", "FAUX"]:
            self.add_token(TokenType.BOOLEEN, True if clean_text == "VRAI" else False)
        else:
            self.add_token(type_, text) # Keep original text for identifiers, but type maps to the right Enum
