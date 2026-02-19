import { COLORS } from "./colors";

type TokenType =
  | "keyword"
  | "type"
  | "function"
  | "comment"
  | "number"
  | "string"
  | "preprocessor"
  | "operator"
  | "plain";

export type Token = {
  text: string;
  type: TokenType;
};

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: COLORS.PINK,
  type: COLORS.CYAN,
  function: COLORS.GREEN,
  comment: "#5566AA",
  number: COLORS.VIOLET,
  string: COLORS.AMBER,
  preprocessor: COLORS.VIOLET,
  operator: COLORS.TEXT_DIM,
  plain: COLORS.TEXT_PRIMARY,
};

const CPP_KEYWORDS = new Set([
  "void",
  "return",
  "if",
  "else",
  "for",
  "while",
  "class",
  "struct",
  "public",
  "private",
  "protected",
  "virtual",
  "override",
  "const",
  "static",
  "inline",
  "constexpr",
  "auto",
  "namespace",
  "using",
  "template",
  "typename",
  "enum",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "delete",
  "this",
  "true",
  "false",
  "nullptr",
]);

const CPP_TYPES = new Set([
  "int",
  "float",
  "double",
  "bool",
  "char",
  "size_t",
  "uint32_t",
  "int32_t",
  "string",
  "vector",
  "array",
  "unique_ptr",
  "shared_ptr",
  "AudioBuffer",
  "MidiBuffer",
  "MidiMessage",
  "SmoothedValue",
  "AudioProcessorValueTreeState",
  "AudioParameterFloat",
  "NormalisableRange",
  "SynthesiserSound",
  "SynthesiserVoice",
  "Synthesiser",
]);

const CMAKE_KEYWORDS = new Set([
  "cmake_minimum_required",
  "project",
  "set",
  "FetchContent_Declare",
  "FetchContent_MakeAvailable",
  "target_link_libraries",
  "add_executable",
  "target_sources",
  "juce_add_plugin",
  "GIT_REPOSITORY",
  "GIT_TAG",
  "VERSION",
  "LANGUAGES",
  "CXX",
  "include",
  "PRIVATE",
  "PUBLIC",
]);

export function tokenize(code: string, lang: "cpp" | "cmake" = "cpp"): Token[] {
  const tokens: Token[] = [];
  const keywords = lang === "cpp" ? CPP_KEYWORDS : CMAKE_KEYWORDS;
  const types = lang === "cpp" ? CPP_TYPES : new Set<string>();

  const patterns: [RegExp, TokenType][] = [
    [/^\/\/[^\n]*/, "comment"],
    [/^\/\*[\s\S]*?\*\//, "comment"],
    [/^#\w+/, "preprocessor"],
    [/^"(?:[^"\\]|\\.)*"/, "string"],
    [/^'(?:[^'\\]|\\.)*'/, "string"],
    [/^\d+\.?\d*f?/, "number"],
    [/^[a-zA-Z_]\w*/, "plain"],
    [/^[{}()\[\];,.<>:=+\-*\/&|!~^%?]/, "operator"],
    [/^\s+/, "plain"],
  ];

  let remaining = code;

  while (remaining.length > 0) {
    let matched = false;

    for (const [pattern, type] of patterns) {
      const match = remaining.match(pattern);
      if (match) {
        let tokenType = type;
        const text = match[0];

        if (type === "plain" && /^[a-zA-Z_]/.test(text)) {
          if (keywords.has(text)) {
            tokenType = "keyword";
          } else if (types.has(text)) {
            tokenType = "type";
          } else if (remaining.length > text.length && remaining[text.length] === "(") {
            tokenType = "function";
          }
        }

        tokens.push({ text, type: tokenType });
        remaining = remaining.slice(text.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({ text: remaining[0], type: "plain" });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

export function getTokenColor(type: TokenType): string {
  return TOKEN_COLORS[type];
}
