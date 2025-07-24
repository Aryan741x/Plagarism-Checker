import subprocess
import platform
import tempfile
import os
from difflib import SequenceMatcher
from itertools import combinations
from pycparser import c_parser

# Set up ctags path
if platform.system() == "Windows":
    CTAGS_EXE = os.environ.get("CTAGS_PATH", "bin/ctags.exe")
else:
    CTAGS_EXE = "ctags"


def extract_tokens(code: str) -> list[str]:
    with tempfile.NamedTemporaryFile(suffix=".c", delete=False, mode="w", encoding="utf-8") as temp_file:
        temp_file.write(code)
        temp_file_path = temp_file.name

    try:
        result = subprocess.run([
            CTAGS_EXE,
            "-x",
            "--c-kinds=+p",
            "--fields=+n",
            "--language-force=C",
            temp_file_path
        ], capture_output=True, text=True, check=True)

        lines = result.stdout.strip().split("\n")
        tokens = [line.split()[0] for line in lines if line.strip()]
        return tokens
    except Exception as e:
        print(f"[ctags] Error: {e}")
        return []
    finally:
        os.remove(temp_file_path)


def extract_c_ast(code: str):
    try:
        parser = c_parser.CParser()
        ast = parser.parse(code)
        return ast
    except Exception as e:
        print(f"[AST] Error: {e}")
        return None

def serialize_ast(node):
    """Serialize pycparser AST into a list of strings."""
    if not hasattr(node, '__dict__'):
        return str(node)

    result = [type(node).__name__]
    for _, value in node.__dict__.items():
        if isinstance(value, list):
            for item in value:
                result.extend(serialize_ast(item))
        elif hasattr(value, '__dict__'):
            result.extend(serialize_ast(value))
        elif value is not None:
            result.append(str(value))
    return result


def _sim(a: str, b: str, alpha: float = 0.5) -> float:
    # Token similarity
    t1, t2 = extract_tokens(a), extract_tokens(b)
    token_sim = SequenceMatcher(None, t1, t2).ratio() if t1 and t2 else 0.0

    # AST similarity
    ast1 = extract_c_ast(a)
    ast2 = extract_c_ast(b)
    if ast1 and ast2:
        flat1 = serialize_ast(ast1)
        flat2 = serialize_ast(ast2)
        ast_sim = SequenceMatcher(None, flat1, flat2).ratio()
    else:
        ast_sim = 0.0

    # Final similarity
    return alpha * token_sim + (1 - alpha) * ast_sim


def matches(docs, threshold=0.6, alpha=0.5):
    out = []
    for d1, d2 in combinations(docs, 2):
        score = _sim(d1["text"], d2["text"], alpha=alpha)
        if score >= threshold:
            out.append({
                "source": d1["fileName"],
                "target": d2["fileName"],
                "similarity": round(score, 4)
            })
    return out
