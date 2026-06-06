import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from lexer import Lexer, LexerError
from parser import Parser, ParserError
from interpreter import Interpreter

app = FastAPI(title="Algo Interpreter API")

class ExecutionRequest(BaseModel):
    code: str
    inputs: list[str] = []

@app.post("/execute")
def execute_code(req: ExecutionRequest):
    try:
        lexer = Lexer(req.code)
        tokens = lexer.scan_tokens()
        
        parser = Parser(tokens)
        program = parser.parse()
        
        interpreter = Interpreter(trace_mode=False, inputs=req.inputs)
        result = interpreter.interpret(program)
        return result
        
    except LexerError as e:
        return {"status": "error", "snapshots": [], "erreurs": str(e)}
    except ParserError as e:
        return {"status": "error", "snapshots": [], "erreurs": str(e)}
    except Exception as e:
        return {"status": "error", "snapshots": [], "erreurs": f"Erreur système : {str(e)}"}

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
